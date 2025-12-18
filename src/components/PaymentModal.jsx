import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Banknote, Copy, Check, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:8080';

// ✅ Batasi ukuran file yang dipilih (sebelum jadi base64)
// (Base64 biasanya ~33% lebih besar dari file asli)
const MAX_PROOF_MB = 2;
const MAX_PROOF_BYTES = MAX_PROOF_MB * 1024 * 1024;

// ===== preset kompres (2 mode) =====
const COMPRESS_PRESETS = {
  light: {
    id: 'light',
    label: 'Ringan (±300KB)',
    hint: 'Resize 1280 + quality turun agresif',
    maxDimension: 1280,
    targetBytes: 300 * 1024,
    initialQuality: 0.78,
    minQuality: 0.40,
    qualityStep: 0.08,
  },
  clear: {
    id: 'clear',
    label: 'Jelas (±500–800KB)',
    hint: 'Resize 1600 + quality lebih tinggi',
    maxDimension: 1600,
    targetBytes: 700 * 1024, // target tengahnya; biasanya 500–800KB
    initialQuality: 0.88,
    minQuality: 0.60,
    qualityStep: 0.06,
  },
};

// ========= helpers =========
const isAllowedProofFile = (file) => {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();

  if (type.startsWith('image/')) return true;
  if (type === 'application/pdf') return true;

  const name = (file.name || '').toLowerCase();
  return (
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.pdf')
  );
};

const isPdfFile = (file) => {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  return type === 'application/pdf' || (file.name || '').toLowerCase().endsWith('.pdf');
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// convert dataURL -> size bytes (approx)
const dataUrlSizeBytes = (dataUrl) => {
  if (!dataUrl) return 0;
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const len = base64.length;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((len * 3) / 4) - padding);
};

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

/**
 * Compress image file to JPEG dataURL:
 * - Resize to max dimension
 * - Fill white background (avoid black background if PNG transparency)
 * - Decrease quality step-by-step until <= targetBytes or quality minimum reached
 */
const compressImageToJpegDataUrl = async (file, options = {}) => {
  const {
    maxDimension,
    targetBytes,
    initialQuality,
    minQuality,
    qualityStep,
  } = options;

  const img = await loadImageFromFile(file);

  let { width, height } = img;
  const maxSide = Math.max(width, height);
  if (maxSide > maxDimension) {
    const scale = maxDimension / maxSide;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');

  // white background (important if image has alpha)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // iterative quality reduction
  let q = initialQuality;
  let dataUrl = canvas.toDataURL('image/jpeg', q);
  let size = dataUrlSizeBytes(dataUrl);

  while (size > targetBytes && q > minQuality) {
    q = Math.max(minQuality, q - qualityStep);
    dataUrl = canvas.toDataURL('image/jpeg', q);
    size = dataUrlSizeBytes(dataUrl);
  }

  return { dataUrl, bytes: size, width: canvas.width, height: canvas.height, quality: q };
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const toCompressedJpgName = (originalName, presetId) => {
  const name = String(originalName || 'bukti').trim() || 'bukti';
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const tag = presetId === 'clear' ? 'clear' : 'light';
  return `${base}-${tag}.jpg`;
};

// ========= component =========
const PaymentModal = ({ isOpen, onClose, amount, bookingId, onPaymentComplete }) => {
  const { toast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [copiedAcc, setCopiedAcc] = useState(null);

  // bukti pembayaran
  const [proofFile, setProofFile] = useState(''); // dataURL/base64
  const [proofFileName, setProofFileName] = useState('');
  const [originalFile, setOriginalFile] = useState(null); // ✅ simpan file asli supaya bisa recompress saat mode berubah

  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);

  // ✅ preset kompres (2 tombol)
  const [compressPreset, setCompressPreset] = useState('light'); // 'light' | 'clear'

  const preset = COMPRESS_PRESETS[compressPreset] || COMPRESS_PRESETS.light;

  // reset ketika modal dibuka/ditutup
  useEffect(() => {
    if (!isOpen) {
      setSelectedMethod(null);
      setCopiedAcc(null);
      setProofFile('');
      setProofFileName('');
      setOriginalFile(null);
      setSubmitting(false);
      setCompressing(false);
      setCompressPreset('light');
      return;
    }
  }, [isOpen]);

  // kalau ganti metode ke cash, bukti tidak diperlukan
  useEffect(() => {
    if (selectedMethod === 'cash') {
      setProofFile('');
      setProofFileName('');
      setOriginalFile(null);
    }
  }, [selectedMethod]);

  const paymentMethods = useMemo(
    () => [
      { id: 'transfer', name: 'Bank Transfer', icon: CreditCard, badge: 'BCA, BRI, Mandiri' },
      { id: 'qris', name: 'QRIS', icon: Smartphone, badge: 'Scan & Pay' },
      { id: 'cash', name: 'Cash', icon: Banknote, badge: 'Pay to Driver' },
    ],
    []
  );

  const bankAccounts = useMemo(
    () => [
      { bank: 'BCA', number: '123 456 7890', name: 'PT LK Travel' },
      { bank: 'BRI', number: '0987 654 321', name: 'PT LK Travel' },
      { bank: 'Mandiri', number: '1122 3344 55', name: 'PT LK Travel' },
    ],
    []
  );

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAcc(key);
      toast({ title: 'Copied', description: 'Nomor rekening disalin.' });
      setTimeout(() => setCopiedAcc(null), 1500);
    } catch {
      toast({ title: 'Gagal', description: 'Clipboard tidak tersedia.', variant: 'destructive' });
    }
  };

  const processProofFile = async (file, { showToastOnSuccess } = { showToastOnSuccess: true }) => {
    // reset
    setProofFile('');
    setProofFileName('');

    if (!isAllowedProofFile(file)) {
      toast({
        title: 'Format file tidak didukung',
        description: 'Gunakan gambar (JPG/PNG/WEBP) atau PDF.',
        variant: 'destructive',
      });
      return { ok: false };
    }

    if (file.size > MAX_PROOF_BYTES) {
      toast({
        title: 'File terlalu besar',
        description: `Maksimal ${MAX_PROOF_MB}MB. Silakan crop/kompres dulu.`,
        variant: 'destructive',
      });
      return { ok: false };
    }

    try {
      setCompressing(true);

      if (isPdfFile(file)) {
        const dataUrl = await readFileAsDataUrl(file);
        setProofFile(dataUrl);
        setProofFileName(file.name);

        if (showToastOnSuccess) {
          toast({
            title: 'Bukti dipilih (PDF)',
            description: `Ukuran: ${formatBytes(file.size)} (PDF tidak dikompres).`,
          });
        }

        return { ok: true };
      }

      // image compress
      const beforeBytes = file.size;

      const { dataUrl, bytes: afterBytes, width, height, quality } = await compressImageToJpegDataUrl(file, {
        maxDimension: preset.maxDimension,
        targetBytes: preset.targetBytes,
        initialQuality: preset.initialQuality,
        minQuality: preset.minQuality,
        qualityStep: preset.qualityStep,
      });

      setProofFile(dataUrl);
      setProofFileName(toCompressedJpgName(file.name, preset.id));

      if (showToastOnSuccess) {
        toast({
          title: `Bukti dikompres (${preset.label})`,
          description: `Dari ${formatBytes(beforeBytes)} → ${formatBytes(afterBytes)} | ${width}x${height} | q=${quality.toFixed(
            2
          )}`,
        });
      }

      return { ok: true };
    } catch (err) {
      console.error(err);
      toast({
        title: 'Gagal memproses file',
        description: 'Coba pilih ulang file bukti pembayaran.',
        variant: 'destructive',
      });
      return { ok: false };
    } finally {
      setCompressing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file); // ✅ simpan
    const res = await processProofFile(file, { showToastOnSuccess: true });
    if (!res.ok) {
      e.target.value = '';
    }
  };

  // ✅ jika user ganti mode kompres setelah memilih file, recompress otomatis
  useEffect(() => {
    if (!originalFile) return;
    if (isPdfFile(originalFile)) return; // pdf tidak perlu recompress
    // kalau sudah ada proofFile (sudah pernah proses), recompress ulang
    if (!proofFile) return;

    (async () => {
      await processProofFile(originalFile, { showToastOnSuccess: true });
      toast({
        title: 'Mode kompres diubah',
        description: `Bukti dikompres ulang ke mode: ${preset.label}`,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compressPreset]);

  // ✅ Transfer/QRIS: upload bukti -> POST ke backend -> Menunggu Validasi
  const submitProofToBackend = async (method) => {
    if (!bookingId) throw new Error('bookingId belum tersedia. Pastikan booking sudah dibuat sebelum bayar.');
    if (!proofFile) throw new Error('Mohon upload bukti pembayaran terlebih dahulu.');

    const res = await fetch(`${API_BASE}/api/reguler/bookings/${bookingId}/submit-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethod: method,
        proofFile: proofFile,
        proofFileName: proofFileName || '',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || data?.message || 'Gagal submit bukti pembayaran');
    return data;
  };

  // ✅ Cash: confirm-cash -> backend set Lunas
  const confirmCashToBackend = async () => {
    if (!bookingId) throw new Error('bookingId belum tersedia. Pastikan booking sudah dibuat sebelum bayar.');

    const res = await fetch(`${API_BASE}/api/reguler/bookings/${bookingId}/confirm-cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || data?.message || 'Gagal konfirmasi cash');
    return data;
  };

  const handleConfirm = async () => {
    if (!selectedMethod) return;

    try {
      setSubmitting(true);

      if (selectedMethod === 'cash') {
        await confirmCashToBackend();
        toast({ title: 'Pembayaran Cash dikonfirmasi', description: 'Status: Lunas. E-ticket & invoice aktif.' });
        onPaymentComplete?.({ method: 'cash', paymentStatus: 'Lunas' });
        onClose?.();
        return;
      }

      await submitProofToBackend(selectedMethod);
      toast({ title: 'Bukti terkirim', description: 'Status: Menunggu Validasi. Admin akan memverifikasi pembayaran.' });
      onPaymentComplete?.({ method: selectedMethod, paymentStatus: 'Menunggu Validasi' });
      onClose?.();
    } catch (e) {
      toast({ title: 'Gagal', description: e?.message || 'Terjadi kesalahan.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderMethodCard = (method) => {
    const Icon = method.icon;

    const iconWrapClass =
      method.id === 'transfer'
        ? 'bg-blue-500/10 border-blue-500/20'
        : method.id === 'qris'
        ? 'bg-green-500/10 border-green-500/20'
        : 'bg-yellow-500/10 border-yellow-500/20';

    const iconClass =
      method.id === 'transfer'
        ? 'text-blue-400'
        : method.id === 'qris'
        ? 'text-green-400'
        : 'text-yellow-400';

    return (
      <motion.button
        key={method.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedMethod(method.id)}
        className="w-full p-4 rounded-xl border border-gray-700 bg-slate-800 hover:border-yellow-500 hover:bg-slate-800/80 transition-all flex items-center justify-between group"
        type="button"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${iconWrapClass}`}>
            <Icon className={`w-6 h-6 ${iconClass}`} />
          </div>
          <div className="text-left">
            <span className="block text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
              {method.name}
            </span>
            <span className="text-sm text-gray-500">{method.badge}</span>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-gray-600 group-hover:border-yellow-500" />
      </motion.button>
    );
  };

  const compressedSize = useMemo(() => dataUrlSizeBytes(proofFile), [proofFile]);

  const ModeButtons = () => (
    <div className="space-y-2">
      <div className="text-sm text-gray-300">Mode Kompres Bukti</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCompressPreset('light')}
          disabled={compressing}
          className={`px-3 py-2 rounded-md border text-xs font-semibold transition-all ${
            compressPreset === 'light'
              ? 'bg-yellow-500 text-slate-900 border-yellow-400'
              : 'bg-slate-800 text-slate-200 border-slate-600 hover:border-yellow-500'
          }`}
        >
          {COMPRESS_PRESETS.light.label}
        </button>

        <button
          type="button"
          onClick={() => setCompressPreset('clear')}
          disabled={compressing}
          className={`px-3 py-2 rounded-md border text-xs font-semibold transition-all ${
            compressPreset === 'clear'
              ? 'bg-yellow-500 text-slate-900 border-yellow-400'
              : 'bg-slate-800 text-slate-200 border-slate-600 hover:border-yellow-500'
          }`}
        >
          {COMPRESS_PRESETS.clear.label}
        </button>
      </div>
      <div className="text-xs text-slate-400">
        {preset.hint} • target ~{formatBytes(preset.targetBytes)}
      </div>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent className="bg-slate-900 border-2 border-yellow-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Payment</h2>
            <div className="inline-block px-4 py-2 bg-slate-800 rounded-lg border border-gray-700">
              <span className="text-gray-400 text-sm">Amount to Pay:</span>
              <span className="block text-3xl font-bold text-white">
                Rp {Number(amount || 0).toLocaleString('id-ID')}
              </span>
            </div>

            {bookingId ? (
              <div className="mt-2 text-xs text-slate-400">
                Booking ID: <b className="text-slate-200">{bookingId}</b>
              </div>
            ) : (
              <div className="mt-2 text-xs text-red-300">
                Booking ID belum ada (booking belum tersimpan). Lanjutkan booking dulu.
              </div>
            )}
          </div>

          {!selectedMethod ? (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">Select payment method:</p>
              {paymentMethods.map(renderMethodCard)}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <button
                onClick={() => setSelectedMethod(null)}
                className="text-sm text-gray-400 hover:text-white underline"
                type="button"
              >
                Change Method
              </button>

              {selectedMethod === 'transfer' && (
                <div className="space-y-3">
                  {bankAccounts.map((acc, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-white">{acc.bank}</p>
                        <p className="text-sm text-gray-400">{acc.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-mono text-yellow-400 mb-1">{acc.number}</p>
                        <button
                          onClick={() => handleCopy(acc.number, `${acc.bank}-${idx}`)}
                          className="text-xs flex items-center gap-1 text-gray-500 hover:text-white ml-auto"
                          type="button"
                        >
                          {copiedAcc === `${acc.bank}-${idx}` ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {copiedAcc === `${acc.bank}-${idx}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}

                  <ModeButtons />

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-200">
                    Upload bukti (max <b>{MAX_PROOF_MB}MB</b>). Gambar akan <b>auto-compress</b> agar ringan di admin.
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-300">Upload Bukti Transfer</div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-600 cursor-pointer text-sm">
                      {compressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{compressing ? 'Mengompres...' : 'Pilih File'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={compressing}
                      />
                    </label>

                    {proofFileName ? (
                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="truncate">File: {proofFileName}</div>
                        <div>Estimasi ukuran data: {formatBytes(compressedSize)}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">Belum ada file dipilih.</div>
                    )}
                  </div>
                </div>
              )}

              {selectedMethod === 'qris' && (
                <div className="space-y-3">
                  <div className="text-center bg-white p-6 rounded-xl">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
                      alt="QRIS Code"
                      className="w-48 h-48 mx-auto mb-4"
                    />
                    <p className="text-slate-900 font-bold">Scan with any e-wallet app</p>
                    <p className="text-slate-500 text-sm">GoPay, OVO, Dana, ShopeePay, BCA Mobile</p>
                  </div>

                  <ModeButtons />

                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-200">
                    Upload bukti (max <b>{MAX_PROOF_MB}MB</b>). Gambar akan <b>auto-compress</b>.
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-300">Upload Bukti QRIS</div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-600 cursor-pointer text-sm">
                      {compressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>{compressing ? 'Mengompres...' : 'Pilih File'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={compressing}
                      />
                    </label>

                    {proofFileName ? (
                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="truncate">File: {proofFileName}</div>
                        <div>Estimasi ukuran data: {formatBytes(compressedSize)}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">Belum ada file dipilih.</div>
                    )}
                  </div>
                </div>
              )}

              {selectedMethod === 'cash' && (
                <div className="text-center p-8 bg-slate-800 rounded-xl border border-dashed border-gray-600">
                  <Banknote className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Pay to Driver</h3>
                  <p className="text-gray-400">
                    Konfirmasi cash akan membuat status langsung <b>Lunas</b>.
                  </p>
                  <p className="text-gray-400">E-ticket & invoice langsung muncul.</p>
                </div>
              )}

              <Button
                onClick={handleConfirm}
                disabled={
                  submitting ||
                  compressing ||
                  !selectedMethod ||
                  !bookingId ||
                  ((selectedMethod === 'transfer' || selectedMethod === 'qris') && !proofFile)
                }
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold h-12 text-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : compressing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  'Konfirmasi Pembayaran'
                )}
              </Button>

              {!bookingId ? (
                <div className="text-xs text-red-300 text-center">
                  Booking ID belum ada. Pastikan booking sudah tersimpan (Create Booking) sebelum bayar.
                </div>
              ) : null}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
