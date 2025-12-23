// src/pages/PengaturanKeberangkatan.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Users,
  Phone,
  MapPin,
  Calendar,
  Armchair,
  Upload,
  CheckCircle,
  XCircle,
  Car,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const API_BASE = 'http://localhost:8080/api';
const DEPARTURE_API = `${API_BASE}/departure-settings`;
const DRIVERS_API = `${API_BASE}/drivers`;

// ==============================
// ✅ Helpers (tanpa menghapus kode lama)
// - suratJalanFile bisa:
//   1) data:image/... (upload manual)
//   2) URL absolut (http/https)
//   3) URL relatif backend (/api/...)
// ==============================
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

function isDataUrl(v) {
  return typeof v === 'string' && v.startsWith('data:');
}
function isHttpUrl(v) {
  return typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://'));
}
function isRelativeUrl(v) {
  return typeof v === 'string' && v.startsWith('/');
}
function resolveToAbsoluteBackendUrl(v) {
  if (!v || typeof v !== 'string') return '';
  if (isDataUrl(v)) return v;
  if (isHttpUrl(v)) return v;
  if (isRelativeUrl(v)) return `${BACKEND_ORIGIN}${v}`;
  // fallback: sudah berupa path tanpa leading slash
  return `${BACKEND_ORIGIN}/${v}`;
}

// ✅ paksa scope=trip untuk endpoint booking surat jalan (fallback lama)
function ensureSuratJalanTripScope(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

  const u = rawUrl.trim();
  const isBookingSJ = u.includes('/api/reguler/bookings/') && u.includes('/surat-jalan');
  if (!isBookingSJ) return rawUrl;
  if (u.includes('scope=trip')) return rawUrl;

  const joiner = u.includes('?') ? '&' : '?';
  return `${u}${joiner}scope=trip`;
}

function formatDateID(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function looksLikePdf(v) {
  if (!v || typeof v !== 'string') return false;
  if (v.startsWith('data:application/pdf')) return true;
  return v.toLowerCase().includes('.pdf');
}

// ✅ NEW: deteksi content-type
function isPdfContentType(ct) {
  const s = String(ct || '').toLowerCase();
  return s.includes('application/pdf');
}
function isImageContentType(ct) {
  const s = String(ct || '').toLowerCase();
  return s.startsWith('image/');
}
function isJsonContentType(ct) {
  const s = String(ct || '').toLowerCase();
  return s.includes('application/json') || s.includes('text/json');
}

const PengaturanKeberangkatan = () => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    bookingName: '',
    phone: '',
    pickupAddress: '',
    departureDate: '',
    seatNumbers: '',
    passengerCount: '',
    serviceType: 'Reguler',
    driverName: '',
    vehicleCode: '',
    vehicleType: '',
    suratJalanFile: '',
    suratJalanFileName: '',
    departureStatus: 'Berangkat',
  });

  const [searchText, setSearchText] = useState('');

  // ✅ Preview E-Surat Jalan (tanpa keluar tab / window)
  const [isSuratPreviewOpen, setIsSuratPreviewOpen] = useState(false);
  const [suratPreviewSrc, setSuratPreviewSrc] = useState('');
  const [suratPreviewIsPdf, setSuratPreviewIsPdf] = useState(false);

  // ✅ Preview surat jalan JSON (fallback lama)
  const [suratPreviewIsJson, setSuratPreviewIsJson] = useState(false);
  const [suratPreviewJson, setSuratPreviewJson] = useState(null);
  const [suratPreviewLoading, setSuratPreviewLoading] = useState(false);
  const [suratPreviewError, setSuratPreviewError] = useState('');

  // ✅ Drivers dropdown (/api/drivers)
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);

  // ✅ NEW: blob url untuk preview file asli (supaya tampil seperti Informasi 10)
  const [suratPreviewBlobUrl, setSuratPreviewBlobUrl] = useState('');

  // cleanup blob url
  useEffect(() => {
    return () => {
      if (suratPreviewBlobUrl) {
        try {
          URL.revokeObjectURL(suratPreviewBlobUrl);
        } catch (_) {}
      }
    };
  }, [suratPreviewBlobUrl]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setDriversLoading(true);
        const res = await fetch(DRIVERS_API);
        if (!res.ok) throw new Error('Gagal mengambil data driver');
        const data = await res.json();
        setDrivers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        // tidak perlu toast keras, biar halaman tetap bisa dipakai
      } finally {
        setDriversLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  // Auto isi jenis/kode kendaraan saat driver dipilih (dari Data Driver/Admin/Mitra)
  useEffect(() => {
    const name = formData.driverName || '';
    if (!name) return;
    const lc = name.toLowerCase().trim();
    const found = (drivers || []).find((d) => String(d.name || '').toLowerCase().trim() === lc);
    if (!found) return;

    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      if (found.vehicleAssigned && (!prev.vehicleCode || prev.vehicleCode === '-')) {
        next.vehicleCode = found.vehicleAssigned;
        changed = true;
      }
      if (found.vehicleType && prev.vehicleType !== found.vehicleType) {
        next.vehicleType = found.vehicleType;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [drivers, formData.driverName]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(DEPARTURE_API);
        if (!res.ok) throw new Error('Gagal mengambil data keberangkatan');
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: err.message || 'Gagal mengambil data keberangkatan',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const reload = async () => {
    try {
      const res = await fetch(DEPARTURE_API);
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({
      bookingName: '',
      phone: '',
      pickupAddress: '',
      departureDate: '',
      seatNumbers: '',
      passengerCount: '',
      serviceType: 'Reguler',
      driverName: '',
      vehicleCode: '',
      vehicleType: '',
      suratJalanFile: '',
      suratJalanFileName: '',
      departureStatus: 'Berangkat',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      bookingName: item.bookingName || '',
      phone: item.phone || '',
      pickupAddress: item.pickupAddress || '',
      departureDate: item.departureDate || '',
      seatNumbers: item.seatNumbers || '',
      passengerCount: item.passengerCount || '',
      serviceType: item.serviceType || 'Reguler',
      driverName: item.driverName || '',
      vehicleCode: item.vehicleCode || '',
      vehicleType: item.vehicleType || '',
      suratJalanFile: item.suratJalanFile || '',
      suratJalanFileName: item.suratJalanFileName || '',
      departureStatus: item.departureStatus || 'Berangkat',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${DEPARTURE_API}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus data');
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast({
        title: 'Deleted',
        description: 'Data keberangkatan dihapus.',
        variant: 'destructive',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menghapus data',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        suratJalanFile: reader.result,
        suratJalanFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  // ✅ open preview legacy: langsung pakai src (data-url/pdf/url)
  const openSuratPreviewLegacy = (item) => {
    const raw = item?.suratJalanFile || '';
    if (!raw) return;

    // reset state
    setSuratPreviewError('');
    setSuratPreviewIsJson(false);
    setSuratPreviewJson(null);
    setSuratPreviewLoading(false);

    // cleanup blob url lama
    if (suratPreviewBlobUrl) {
      try {
        URL.revokeObjectURL(suratPreviewBlobUrl);
      } catch (_) {}
      setSuratPreviewBlobUrl('');
    }

    const abs = ensureSuratJalanTripScope(resolveToAbsoluteBackendUrl(raw));
    setSuratPreviewSrc(abs);
    setSuratPreviewIsPdf(looksLikePdf(abs));
    setIsSuratPreviewOpen(true);
  };

  // ✅ open preview utama (Informasi 10 style):
  // - Prioritas: tampilkan FILE asli (PDF/IMG) via blob URL (Accept: pdf/image).
  // - Jika server balas JSON {__type:"image", src:"data:image/..."} -> tampilkan src langsung.
  // - Jika JSON booking -> fallback template lama (Informasi 9).
  const openSuratPreview = async (item) => {
    const raw = item?.suratJalanFile || '';
    if (!raw) return;

    // reset state
    setSuratPreviewError('');
    setSuratPreviewIsJson(false);
    setSuratPreviewJson(null);
    setSuratPreviewLoading(false);
    setSuratPreviewIsPdf(false);
    setSuratPreviewSrc('');

    // cleanup blob url lama
    if (suratPreviewBlobUrl) {
      try {
        URL.revokeObjectURL(suratPreviewBlobUrl);
      } catch (_) {}
      setSuratPreviewBlobUrl('');
    }

    // resolve URL
    let abs = resolveToAbsoluteBackendUrl(raw);
    abs = ensureSuratJalanTripScope(abs);

    // kalau data URL / pdf -> pakai legacy
    if (isDataUrl(abs) || looksLikePdf(abs)) {
      openSuratPreviewLegacy({ ...item, suratJalanFile: abs });
      return;
    }

    try {
      setSuratPreviewLoading(true);

      // ✅ minta PDF/IMG dulu agar hasil preview seperti Informasi 10
      const res = await fetch(abs, {
        headers: {
          Accept:
            'application/pdf,image/*;q=0.9,application/octet-stream;q=0.8,application/json;q=0.6,*/*;q=0.5',
        },
      });

      if (!res.ok) {
        throw new Error(`Gagal membuka surat jalan (${res.status})`);
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase();

      // Jika JSON -> cek apakah wrapper image dari trip_information
      if (isJsonContentType(contentType)) {
        const data = await res.json().catch(() => null);

        // ✅ Trip Information surat jalan biasanya balas:
        // { "__type":"image", "src":"data:image/..." }
        if (data && data.__type === 'image' && data.src) {
          setSuratPreviewIsJson(false);
          setSuratPreviewJson(null);
          setSuratPreviewSrc(data.src);
          setSuratPreviewIsPdf(false);
          setIsSuratPreviewOpen(true);
          return;
        }

        // fallback JSON lama (template Informasi 9)
        if (data) {
          setSuratPreviewIsJson(true);
          setSuratPreviewJson(data);
          setSuratPreviewSrc(abs); // untuk tombol Open
          setSuratPreviewIsPdf(false);
          setIsSuratPreviewOpen(true);
          return;
        }
      }

      // Selain JSON -> anggap file (pdf/image), buat blob url
      const blob = await res.blob();
      const blobCt = (blob.type || contentType || '').toLowerCase();
      const objUrl = URL.createObjectURL(blob);

      setSuratPreviewBlobUrl(objUrl);
      setSuratPreviewSrc(objUrl);

      if (isPdfContentType(blobCt) || isPdfContentType(contentType)) {
        setSuratPreviewIsPdf(true);
      } else if (isImageContentType(blobCt) || isImageContentType(contentType)) {
        setSuratPreviewIsPdf(false);
      } else {
        // heuristik
        setSuratPreviewIsPdf(looksLikePdf(abs));
      }

      setIsSuratPreviewOpen(true);
    } catch (err) {
      console.error(err);
      setSuratPreviewError(err?.message || 'Gagal membuka E-Surat Jalan');

      // fallback legacy
      openSuratPreviewLegacy({ ...item, suratJalanFile: abs });
    } finally {
      setSuratPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (!formData.driverName.trim()) {
      toast({
        title: 'Nama driver wajib diisi',
        description: 'Pilih driver atau isi manual sebelum menyimpan.',
        variant: 'destructive',
      });
      setSaving(false);
      return;
    }

    const payload = { ...formData };

    try {
      if (editingItem) {
        const res = await fetch(`${DEPARTURE_API}/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal mengupdate data');
        toast({ title: 'Updated', description: 'Data berhasil diupdate' });
      } else {
        const res = await fetch(DEPARTURE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal membuat data baru');
        toast({ title: 'Created', description: 'Data keberangkatan dibuat' });
      }
      await reload();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan data',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const findDriverVehicleType = (driverName) => {
    const lc = String(driverName || '').toLowerCase().trim();
    if (!lc) return '';
    const found = (drivers || []).find((d) => String(d.name || '').toLowerCase().trim() === lc);
    return found?.vehicleType || '';
  };

  const filteredItems = items.filter((item) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    const driverVehicleType = item.vehicleType || findDriverVehicleType(item.driverName);
    return (
      (item.bookingName || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.pickupAddress || '').toLowerCase().includes(q) ||
      (item.driverName || '').toLowerCase().includes(q) ||
      (item.vehicleCode || '').toLowerCase().includes(q) ||
      (item.vehicleType || '').toLowerCase().includes(q) ||
      (driverVehicleType || '').toLowerCase().includes(q)
    );
  });

  // Render surat jalan JSON (selaras dengan Informasi Perjalanan)
  const renderSuratJalanJson = (payload) => {
    const pick = (obj, keys, def = '') => {
      for (const k of keys) {
        const v = obj && obj[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
      }
      return def;
    };

    const passengerCandidates = [
      payload?.passengers,
      payload?.penumpang,
      payload?.rows,
      payload?.items,
      payload?.data?.passengers,
      payload?.data?.penumpang,
      payload?.data?.rows,
      payload?.data?.items,
    ];
    const rows = passengerCandidates.find((x) => Array.isArray(x)) || [];
    const rowCount = Math.max(7, rows.length);

    const header = {
      company:
        pick(payload, ['companyName', 'company', 'namaPerusahaan'], '') ||
        'PT. LANCANG KUNING TRAVELINDO',
      title: pick(payload, ['title', 'judul'], 'SURAT JALAN'),
      licensePlate: pick(payload, ['licensePlate', 'noPol', 'plate'], ''),
      tripDate: pick(payload, ['tripDate', 'departureDate', 'date', 'tanggal'], ''),
      driver: pick(payload, ['driverName', 'driver', 'supir'], ''),
    };
    const formattedTripDate = formatDateID(header.tripDate);

    const normRow = (r) => ({
      name: pick(r, ['name', 'passengerName', 'nama'], '-'),
      phone: pick(r, ['phone', 'passengerPhone', 'noHp', 'hp'], ''),
      seat: pick(r, ['seat', 'seatCode', 'selectedSeat', 'selectedSeats', 'bangku'], ''),
      pickup: pick(r, ['pickup', 'jemput', 'pickupLocation', 'pickupAddress'], '-'),
      dest: pick(r, ['destination', 'tujuan', 'dropoffLocation', 'dropoffAddress'], '-'),
      fare: pick(r, ['fare', 'tarif', 'price', 'amount', 'totalAmount', 'pricePerSeat'], ''),
      status: pick(r, ['status', 'keterangan', 'paymentStatus'], ''),
    });

    return (
      <div className="w-full bg-white text-black p-6 rounded-md shadow">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center overflow-hidden bg-white">
              <img
                src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-2xl font-black uppercase tracking-tight leading-tight">
                {header.company}
              </div>
              <div className="text-xl font-bold uppercase tracking-wide">SURAT JALAN</div>
            </div>
          </div>

          <div className="text-right text-sm font-bold space-y-1 min-w-[220px]">
            <div className="flex justify-between items-center border-b border-black border-dashed pb-1">
              <span>No. Pol :</span>
              <span className="font-mono ml-2">{header.licensePlate || '..............'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-black border-dashed pb-1">
              <span>Tanggal :</span>
              <span className="font-mono ml-2">{formattedTripDate || '..............'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-black border-dashed pb-1">
              <span>Driver :</span>
              <span className="font-mono ml-2">{header.driver || '..............'}</span>
            </div>
          </div>
        </div>

        <div className="w-full mb-10 border-2 border-black">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="border-r border-black p-2 w-10 text-center font-bold uppercase">No.</th>
                <th className="border-r border-black p-2 text-left font-bold uppercase">Nama / Nomor HP</th>
                <th className="border-r border-black p-2 text-left font-bold uppercase w-1/5">Jemput</th>
                <th className="border-r border-black p-2 text-left font-bold uppercase w-1/5">Tujuan</th>
                <th className="border-r border-black p-2 text-center font-bold uppercase w-24">Tarif</th>
                <th className="p-2 text-center font-bold uppercase w-28">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {Array.from({ length: rowCount }, (_, i) => {
                const r = rows[i];
                const hasData = !!r;
                const rr = hasData ? normRow(r) : null;
                return (
                  <tr key={i} className="h-10">
                    <td className="border-r border-black p-2 text-center font-bold">{i + 1}</td>
                    <td className="border-r border-black p-2 font-bold uppercase">
                      {hasData ? (
                        <>
                          {rr.name}
                          {rr.seat ? <span className="font-normal text-xs"> ({rr.seat})</span> : null}
                          <br />
                          {rr.phone ? <span className="font-normal text-xs">{rr.phone}</span> : null}
                        </>
                      ) : null}
                    </td>
                    <td className="border-r border-black p-2 uppercase text-xs font-semibold">
                      {hasData ? rr.pickup : ''}
                    </td>
                    <td className="border-r border-black p-2 uppercase text-xs font-semibold">
                      {hasData ? rr.dest : ''}
                    </td>
                    <td className="border-r border-black p-2 text-right">
                      {hasData ? (rr.fare ? rr.fare : '') : ''}
                    </td>
                    <td className="p-2 text-center text-[10px] font-bold">
                      {hasData ? (rr.status ? rr.status : '') : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between px-12 text-center text-sm font-bold uppercase">
          <div className="flex flex-col gap-16">
            <span>Pengemudi</span>
            <span className="border-t border-black pt-1 px-4 min-w-[150px]">(.........................)</span>
          </div>
          <div className="flex flex-col gap-16">
            <span>Pengurus</span>
            <span className="border-t border-black pt-1 px-4 min-w-[150px]">(.........................)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Pengaturan Keberangkatan - LK Travel App</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Pengaturan Keberangkatan
            </h1>
            <p className="text-gray-400">
              Atur jadwal keberangkatan, driver, dan armada.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 border-0"
            >
              + Tambah Jadwal
            </Button>
          </motion.div>
        </div>

        {/* Search */}
        <div className="bg-slate-800/60 border border-gray-700 rounded-xl p-4">
          <Label>Cari (Nama Pemesan / No HP / Driver / Kode Kendaraan)</Label>
          <Input
            placeholder="Ketik kata kunci..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="mt-1 bg-slate-900 border-slate-700"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Pemesan
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    No HP
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Jemput
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Tgl Berangkat
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Seat / Jml
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Layanan
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Driver & Unit
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Jenis Kendaraan
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    E-Surat Jalan
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="text-right py-3 px-6 text-xs text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500 text-sm">
                      Loading...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500 text-sm">
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const openHref = ensureSuratJalanTripScope(
                      resolveToAbsoluteBackendUrl(item.suratJalanFile)
                    );

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hover:bg-slate-700/30"
                      >
                        <td className="py-3 px-6 text-sm text-gray-100">
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-yellow-400" />
                            <span>{item.bookingName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-green-400" />
                            <span>{item.phone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-300 max-w-xs truncate">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span>{item.pickupAddress}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            <span>{item.departureDate || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Armchair className="w-3 h-3 text-yellow-400" />
                              <span>{item.seatNumbers || '-'}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {item.passengerCount
                                ? `${item.passengerCount} Penumpang/Barang`
                                : '-'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200">
                          {item.serviceType}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Users className="w-3 h-3 text-emerald-400" />
                              <span>{item.driverName || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Car className="w-3 h-3 text-sky-400" />
                              <span>{item.vehicleCode || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200">
                          <div className="flex items-center gap-1 text-xs">
                            <Car className="w-3 h-3 text-purple-400" />
                            <span>{item.vehicleType || findDriverVehicleType(item.driverName) || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200">
                          {hasSuratJalan(item.suratJalanFile) ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                <Upload className="w-3 h-3" /> Uploaded
                              </span>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 border-gray-600 text-gray-200"
                                onClick={() => openSuratPreview(item)}
                              >
                                Prev
                              </Button>

                              {/* link tetap ada (kode lama), tapi sudah dinormalisasi */}
                              <a
                                href={openHref}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-yellow-400 underline"
                              >
                                Open
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Belum upload</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              item.departureStatus === 'Berangkat'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                                : 'bg-red-500/10 text-red-400 border border-red-500/40'
                            }`}
                          >
                            {item.departureStatus === 'Berangkat' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {item.departureStatus}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-200"
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDelete(item.id)}
                            >
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-yellow-400">
                {editingItem ? 'Edit Keberangkatan' : 'Tambah Keberangkatan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nama Pemesanan</Label>
                <Input
                  name="bookingName"
                  value={formData.bookingName}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>No HP</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Alamat Penjemputan</Label>
                <Input
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Keberangkatan</Label>
                <Input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tempat Duduk (Seat)</Label>
                  <Input
                    name="seatNumbers"
                    value={formData.seatNumbers}
                    onChange={handleChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="1A, 2B"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah Penumpang/Barang</Label>
                  <Input
                    type="number"
                    name="passengerCount"
                    value={formData.passengerCount}
                    onChange={handleChange}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jenis Layanan</Label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                >
                  <option value="Reguler">Reguler</option>
                  <option value="Dropping">Dropping</option>
                  <option value="Rental">Rental</option>
                  <option value="Paket Barang">Paket Barang</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Driver Info</Label>

                  {/* ✅ Dropdown driver dari /api/drivers (tanpa menghapus input lama) */}
                  <Label className="mt-1 block">Pilih Driver (Data Driver/Admin/Mitra)</Label>
                  <select
                    value={formData.driverName}
                    onChange={(e) => {
                      const v = e.target.value;
                      const vLc = v.toLowerCase().trim();
                      const found = (drivers || []).find(
                        (d) => String(d.name || '').toLowerCase().trim() === vLc
                      );
                      setFormData((prev) => ({
                        ...prev,
                        driverName: v,
                        vehicleCode:
                          found && found.vehicleAssigned
                            ? found.vehicleAssigned
                            : prev.vehicleCode,
                        vehicleType: found ? found.vehicleType || '' : '',
                      }));
                    }}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">-- Pilih Driver --</option>
                    {(drivers || []).map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                        {d.role ? ` (${d.role})` : ''}
                        {d.vehicleType ? ` - ${d.vehicleType}` : ''}
                        {d.vehicleAssigned ? ` [${d.vehicleAssigned}]` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500">
                    {driversLoading ? 'Memuat driver...' : 'Jika belum ada driver, tambah di menu Data Driver/Admin/Mitra.'}
                  </div>

                  {/* ✅ Input lama tetap ada (manual) */}
                  <Label className="mt-3 block">Driver Info (Manual)</Label>
                  <Input
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="Nama driver"
                  />
                </div>

                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label>Kode Kendaraan</Label>
                    <Input
                      name="vehicleCode"
                      value={formData.vehicleCode}
                      onChange={handleChange}
                      className="bg-slate-800 border-slate-600"
                      placeholder="Unit-01 / BK 1234 XX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Kendaraan</Label>
                    <Input
                      name="vehicleType"
                      value={formData.vehicleType}
                      readOnly
                      className="bg-slate-800 border-slate-600"
                      placeholder="Auto dari data driver (edit di Data Driver/Admin/Mitra)"
                    />
                    <div className="text-xs text-gray-500">
                      Diisi otomatis dari data driver. Ubah jenis kendaraan lewat menu Data Driver/Admin/Mitra.
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Foto E-Surat Jalan</Label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-600 cursor-pointer text-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {formData.suratJalanFileName && (
                    <span className="text-xs text-gray-400 truncate max-w-[180px]">
                      {formData.suratJalanFileName}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status Keberangkatan</Label>
                <select
                  name="departureStatus"
                  value={formData.departureStatus}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                >
                  <option value="Berangkat">Berangkat</option>
                  <option value="Tidak Berangkat">Tidak Berangkat</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
                >
                  {saving
                    ? editingItem
                      ? 'Saving...'
                      : 'Creating...'
                    : editingItem
                      ? 'Save Changes'
                      : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ✅ Preview Modal E-Surat Jalan (dari booking / trip_information / upload manual) */}
        <Dialog
          open={isSuratPreviewOpen}
          onOpenChange={(open) => {
            setIsSuratPreviewOpen(open);
            if (!open && suratPreviewBlobUrl) {
              try {
                URL.revokeObjectURL(suratPreviewBlobUrl);
              } catch (_) {}
              setSuratPreviewBlobUrl('');
            }
          }}
        >
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-yellow-400">
                E-Surat Jalan
              </DialogTitle>
            </DialogHeader>

            <div className="w-full h-[75vh] bg-slate-950/50 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
              {suratPreviewLoading ? (
                <div className="text-sm text-gray-400">Memuat surat jalan...</div>
              ) : suratPreviewError ? (
                <div className="text-sm text-red-400">{suratPreviewError}</div>
              ) : suratPreviewIsJson ? (
                <div className="w-full h-full overflow-auto p-4">
                  {renderSuratJalanJson(suratPreviewJson)}
                </div>
              ) : !suratPreviewSrc ? (
                <div className="text-sm text-gray-400">Tidak ada file untuk dipreview.</div>
              ) : suratPreviewIsPdf ? (
                // ✅ PDF asli
                <iframe title="Preview Surat Jalan" src={suratPreviewSrc} className="w-full h-full" />
              ) : (
                // ✅ Image asli
                <img
                  src={suratPreviewSrc}
                  alt="Preview Surat Jalan"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PengaturanKeberangkatan;

function hasSuratJalan(v) {
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower === '-' || lower === 'belum upload' || lower === 'null' || lower === 'undefined') return false;
  return true;
}

