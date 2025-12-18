import React, { useEffect, useMemo, useState } from 'react';
import { Download, X, Check, FileSpreadsheet, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const InvoiceModal = ({ isOpen, onClose, bookingData }) => {
  const { toast } = useToast();
  const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:8080";

  const [activeTab, setActiveTab] = useState("ticket");

  // ===== Surat Jalan state (ambil dari backend) =====
  const [suratJalan, setSuratJalan] = useState(null);
  const [suratLoading, setSuratLoading] = useState(false);

  // ===== Payment gating state (live) =====
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);

  // helper
  const norm = (v) => String(v || "").trim().toLowerCase();

  const isPaid = useMemo(() => {
    const st = norm(paymentStatus);
    const pm = norm(paymentMethod);

    // aturan utama: status lunas
    if (st === "lunas" || st === "paid" || st === "sukses" || st === "success" || st === "settlement") return true;

    // fallback: cash biasanya langsung lunas (setelah confirm-cash di backend)
    if (pm === "cash") return true;

    return false;
  }, [paymentStatus, paymentMethod]);

  useEffect(() => {
    // reset ketika modal ditutup
    if (!isOpen) {
      setActiveTab("ticket");
      setSuratJalan(null);
      setSuratLoading(false);

      setPaymentStatus("");
      setPaymentMethod("");
      setCheckingStatus(false);
      return;
    }

    // sync payment status dari props setiap modal dibuka
    const ps = bookingData?.paymentStatus || "";
    const pm = bookingData?.paymentMethod || "";
    setPaymentStatus(ps);
    setPaymentMethod(pm);

    // ✅ gating: kalau belum lunas, default buka surat jalan (bukan ticket)
    const paid = (() => {
      const st = norm(ps);
      const pmm = norm(pm);
      if (st === "lunas" || st === "paid" || st === "sukses" || st === "success" || st === "settlement") return true;
      if (pmm === "cash") return true;
      return false;
    })();

    setActiveTab(paid ? "ticket" : "surat-jalan");
  }, [isOpen, bookingData]);

  if (!bookingData) return null;

  const {
    // backend kamu mengembalikan bookingId, bukan id
    bookingId,
    id: legacyId,

    from,
    to,
    date,
    time,
    category,
    selectedSeats = [],
    passengerName,
    passengerPhone,

    pickupLocation,
    dropoffLocation,

    pickupAddress,
    dropoffAddress,

    rentalDuration,
    totalAmount,
    discountAmount,

    // Package specific
    senderName, senderAddress, senderPhone,
    receiverName, receiverAddress, receiverPhone,
    itemName, itemSize, itemType,

    // PPOB Specific
    isPPOB, provider, customerNumber, sn, adminFee
  } = bookingData;

  // pakai bookingId kalau ada, fallback ke id lama
  const actualBookingId = bookingId ?? legacyId;

  const isPackage = category === 'Paket Barang';
  const isReguler = category === 'Reguler';

  const displayPaymentStatus = paymentStatus || (paymentMethod ? "Belum Bayar" : "Belum Bayar");

  const handleCheckPaymentStatus = async () => {
    if (!actualBookingId) {
      toast({ title: "Gagal", description: "bookingId belum tersedia." });
      return;
    }

    try {
      setCheckingStatus(true);
      const res = await fetch(`${API_BASE}/api/reguler/bookings/${actualBookingId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Gagal cek status pembayaran");

      const ps = data?.paymentStatus || "";
      const pm = data?.paymentMethod || "";

      setPaymentStatus(ps);
      setPaymentMethod(pm);

      const nowPaid = (() => {
        const st = norm(ps);
        const pmm = norm(pm);
        if (st === "lunas" || st === "paid" || st === "sukses" || st === "success" || st === "settlement") return true;
        if (pmm === "cash") return true;
        return false;
      })();

      if (nowPaid) {
        toast({ title: "Lunas", description: "E-ticket & invoice sudah aktif." });
        setActiveTab("ticket");
      } else {
        toast({ title: "Belum Lunas", description: `Status: ${ps || "Belum Bayar"}` });
      }
    } catch (e) {
      toast({ title: "Gagal", description: e?.message || "Terjadi kesalahan saat cek status." });
    } finally {
      setCheckingStatus(false);
    }
  };

  // ===== Fetch Surat Jalan dari backend ketika tab aktif =====
  useEffect(() => {
    const shouldFetch =
      isOpen &&
      isReguler &&
      !isPPOB &&
      activeTab === "surat-jalan" &&
      actualBookingId;

    if (!shouldFetch) return;

    const controller = new AbortController();
    setSuratLoading(true);

    fetch(`${API_BASE}/api/reguler/bookings/${actualBookingId}/surat-jalan`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || data?.error || "Gagal mengambil data surat jalan");
        return data;
      })
      .then((data) => {
        setSuratJalan(data);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setSuratJalan(null);
        toast({ title: "Gagal", description: e.message });
      })
      .finally(() => setSuratLoading(false));

    return () => controller.abort();
  }, [isOpen, activeTab, actualBookingId, isReguler, isPPOB, API_BASE, toast]);

  const handleDownload = () => {
    // ✅ gating download: ticket/invoice tidak boleh kalau belum lunas
    if (!isPaid && activeTab !== "surat-jalan") {
      toast({
        title: "Dikunci",
        description: "E-ticket & invoice hanya bisa diunduh setelah pembayaran Lunas.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Downloading...",
      description: `Generating PDF for ${activeTab === 'surat-jalan' ? 'Surat Jalan' : 'Ticket/Invoice'}.`
    });
    setTimeout(() => {
      toast({
        title: "Success",
        description: "File downloaded successfully."
      });
    }, 1200);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // ===== Helpers surat jalan =====
  const paxList = Array.isArray(suratJalan?.passengers) ? suratJalan.passengers : [];

  // jemput/tujuan ambil dari suratJalan atau bookingData (pickupLocation) juga
  const jemputSJ = suratJalan?.pickupLocation || pickupLocation || pickupAddress || from || "";
  const tujuanSJ = suratJalan?.dropoffLocation || dropoffLocation || dropoffAddress || to || "";

  const seatCount = selectedSeats?.length || paxList?.length || 0;
  const tarifPerSeat =
    Number(suratJalan?.pricePerSeat || 0) ||
    (seatCount > 0 ? Math.round((Number(totalAmount || 0)) / seatCount) : Number(totalAmount || 0));

  const hpSJ = suratJalan?.passengerPhone || passengerPhone || "";

  const LockedBox = ({ title }) => (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
      <Lock className="w-5 h-5 text-red-300 mt-0.5" />
      <div className="text-sm text-red-100">
        <div className="font-bold">{title} dikunci</div>
        <div className="mt-1 text-red-200">
          Untuk metode <b>Transfer/QRIS</b>, {title.toLowerCase()} hanya tampil setelah admin mengubah status menjadi <b>Lunas</b>.
          Anda tetap bisa melihat <b>E-Surat Jalan</b>.
        </div>
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
      <DialogContent className="bg-slate-900 border-2 border-slate-700 text-white max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header Actions */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700 shrink-0">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Check className="w-6 h-6 text-green-500" /> {isPPOB ? 'Transaction Successful' : 'Booking Confirmed'}
            </h2>

            {!isPPOB && (
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <span>
                  Status Pembayaran:{" "}
                  <b className={isPaid ? "text-green-400" : "text-yellow-400"}>
                    {displayPaymentStatus}
                  </b>
                </span>
                {paymentMethod ? <span className="text-slate-400">({paymentMethod})</span> : null}

                {isReguler && actualBookingId ? (
                  <Button
                    onClick={handleCheckPaymentStatus}
                    variant="outline"
                    className="h-7 px-2 text-xs border-slate-500 text-slate-200 hover:bg-slate-700/50"
                    disabled={checkingStatus}
                  >
                    <RefreshCw className={`w-3 h-3 mr-2 ${checkingStatus ? "animate-spin" : ""}`} />
                    Cek Status
                  </Button>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/10 h-8 text-xs"
            >
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
          {isReguler && !isPPOB ? (
            <Tabs value={activeTab} onValueChange={(v) => {
              // ✅ hard gate: kalau belum lunas, jangan izinkan pindah ke ticket
              if (v === "ticket" && !isPaid) {
                toast({
                  title: "Dikunci",
                  description: "E-ticket & invoice hanya muncul setelah pembayaran Lunas.",
                  variant: "destructive"
                });
                setActiveTab("surat-jalan");
                return;
              }
              setActiveTab(v);
            }} className="w-full">

              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800">
                <TabsTrigger
                  value="ticket"
                  disabled={!isPaid}
                  className={[
                    "font-bold",
                    "data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900",
                    !isPaid ? "opacity-60 cursor-not-allowed" : ""
                  ].join(" ")}
                >
                  {!isPaid ? (
                    <span className="inline-flex items-center gap-2">
                      <Lock className="w-4 h-4" /> E-Ticket & Invoice
                    </span>
                  ) : (
                    "E-Ticket & Invoice"
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="surat-jalan"
                  className="data-[state=active]:bg-white data-[state=active]:text-black font-bold border border-transparent data-[state=active]:border-slate-200"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> E-Surat Jalan
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: TICKET & INVOICE */}
              <TabsContent value="ticket" className="space-y-8 mt-0">
                {!isPaid ? (
                  <LockedBox title="E-Ticket & Invoice" />
                ) : (
                  <>
                    {/* E-TICKET */}
                    <div className="w-full bg-[#FFFACD] text-[#000080] font-sans p-4 rounded-lg shadow-xl relative overflow-hidden border-4 border-[#000080]">
                      <div className="flex justify-between items-center border-b-4 border-[#000080] pb-2 mb-4">
                        <div className="w-24 h-24 rounded-full border-2 border-[#000080] flex items-center justify-center bg-white p-1 overflow-hidden">
                          <img src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 text-center px-4">
                          <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-1">LANCANG  KUNING TRAVELINDO</h1>
                          <div className="bg-[#000080] text-white px-4 py-1 rounded-full inline-block font-bold text-sm mb-1 uppercase tracking-widest">Enjoy The Journey</div>
                          <p className="text-[10px] font-bold leading-tight mt-1">
                            Alamat: Jl. Lingkar Pasir Pengaraian, Dusun Kampung Baru, Desa Koto Tinggi<br />
                            Kec. Rambah, Kab. Rokan Hulu | HP: 0823-6421-0642
                          </p>
                        </div>
                        <div className="w-20 h-20 flex flex-col items-center justify-center border-2 border-[#000080] rounded-lg bg-white p-1">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${actualBookingId}`} alt="QR" className="w-full h-full object-contain" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-1 md:col-span-1 space-y-4">
                          <div className="border-2 border-[#000080] rounded-lg p-2 bg-[#FFF8DC]">
                            <h3 className="bg-[#000080] text-white text-center font-bold uppercase text-sm py-1 mb-2 rounded">Tiket Penumpang</h3>
                            <div className="space-y-1 text-xs font-bold">
                              <div className="flex"><span className="w-24">Nama</span>: {passengerName}</div>
                              <div className="flex"><span className="w-24">Dari</span>: {from}</div>
                              <div className="flex"><span className="w-24">Tujuan</span>: {to}</div>
                              <div className="flex"><span className="w-24">Kategori</span>: {category}</div>
                            </div>
                          </div>
                          <div className="border-2 border-[#000080] rounded-lg p-2 bg-[#FFF8DC]">
                            <h3 className="bg-[#000080] text-white text-center font-bold uppercase text-sm py-1 mb-2 rounded">Keberangkatan</h3>
                            <div className="space-y-1 text-xs font-bold">
                              <div className="flex"><span className="w-24">Tanggal</span>: {formatDate(date)}</div>
                              <div className="flex"><span className="w-24">Jam</span>: {time}</div>
                              <div className="flex"><span className="w-24">Tarif</span>: Rp {totalAmount?.toLocaleString()}</div>
                              <div className="flex">
                                <span className="w-24">Status</span>:
                                <span className="text-green-600 ml-1">LUNAS</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-1 flex flex-col items-center">
                          <div className="w-full border-2 border-[#000080] rounded-lg p-2 bg-[#FFF8DC] h-full">
                            <h3 className="bg-[#000080] text-white text-center font-bold uppercase text-sm py-1 mb-4 rounded">
                              Nomor Bangku
                            </h3>
                            <div className="grid grid-cols-2 gap-4 max-w-[200px] mx-auto">
                              <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${selectedSeats.includes('1A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>1</div>
                              <div className="h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-sm bg-gray-200 text-gray-500 rounded">SOPIR</div>
                              <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${selectedSeats.includes('2A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>2</div>
                              <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${selectedSeats.includes('3A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>3</div>
                              <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${selectedSeats.includes('4A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>4</div>
                              <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${selectedSeats.includes('5A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>5</div>
                            </div>
                            <div className="mt-6 text-center text-xs font-bold">
                              <p>No. Tiket: {actualBookingId}</p>
                              <p className="mt-1">Dicetak: {new Date().toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-1 space-y-4">
                          <div className="border-2 border-[#000080] rounded-lg p-2 bg-[#FFF8DC] h-full text-[9px] leading-tight font-semibold">
                            <h3 className="bg-[#000080] text-white text-center font-bold uppercase text-sm py-1 mb-2 rounded">Perhatian</h3>
                            <ul className="list-decimal pl-3 space-y-1">
                              <li>Jemput Antar Ke Alamat Dalam Batas Tertentu</li>
                              <li>Bagasi Free 15kg/orang, Kelebihan Dikenakan Biaya</li>
                              <li>Barang Bawaan Penumpang Jika Terjadi Kehilangan Yang Sifatnya Kelalaian Penumpang, Bukan Menjadi Tanggung Jawab Perusahaan</li>
                              <li>Dilarang Membawa Benda Terlarang (narkoba dll), Hewan, Atau Barang Bau Menyengat</li>
                            </ul>
                            <div className="mt-2 pt-2 border-t border-[#000080]">
                              <h4 className="font-bold mb-1">PROMO</h4>
                              <p>Kumpulkan 5 Tiket (disc 50%) / 10 Tiket Gratis 1x Keberangkatan.</p>
                            </div>
                            <div className="mt-4 text-center text-sm font-bold italic text-[#000080]">"Cepat, Aman & Nyaman"</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* OFFICIAL INVOICE */}
                    <div className="bg-white rounded-xl overflow-hidden text-slate-900 shadow-lg">
                      <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight">OFFICIAL INVOICE</h2>
                          <p className="text-slate-400 text-sm mt-1">#{actualBookingId}</p>
                        </div>
                        <div className="text-right">
                          <h3 className="font-bold text-lg">LAKUTRAND App</h3>
                          <p className="text-sm text-slate-400">PT. Lancang Kuning Travelindo</p>
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="grid grid-cols-2 gap-8 mb-8">
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billed To</h4>
                            <p className="font-bold text-lg">{passengerName}</p>
                            <p className="text-sm text-slate-600">{passengerPhone}</p>
                            <p className="text-sm text-slate-600">{pickupAddress}</p>
                          </div>
                          <div className="text-right">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Trip Details</h4>
                            <p className="font-bold">{from} <span className="text-slate-400">to</span> {to}</p>
                            <p className="text-sm text-slate-600">{formatDate(date)} at {time}</p>
                            <p className="text-sm text-slate-600 font-medium bg-blue-50 text-blue-700 inline-block px-2 rounded mt-1">{category}</p>
                          </div>
                        </div>
                        <table className="w-full mb-8">
                          <thead className="bg-slate-50 border-y border-slate-200">
                            <tr>
                              <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Description</th>
                              <th className="text-center py-3 px-4 font-semibold text-sm text-slate-600">Qty</th>
                              <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="py-4 px-4">
                                <p className="font-bold text-slate-800">Travel Ticket ({category})</p>
                                <p className="text-xs text-slate-500">Seat(s): {selectedSeats.join(', ')}</p>
                              </td>
                              <td className="py-4 px-4 text-center text-slate-600">{selectedSeats.length}</td>
                              <td className="py-4 px-4 text-right font-medium text-slate-800">
                                Rp {(totalAmount + (discountAmount || 0)).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                          <tfoot className="border-t-2 border-slate-900">
                            <tr>
                              <td colSpan="2" className="pt-4 text-right font-bold text-slate-900">Total Paid</td>
                              <td className="pt-4 px-4 text-right font-bold text-xl text-slate-900">Rp {totalAmount?.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* TAB 2: SURAT JALAN */}
              <TabsContent value="surat-jalan" className="mt-0">
                <div className="w-full bg-white text-black p-8 font-sans min-h-[600px] border border-gray-200 shadow-xl">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-white border-2 border-black rounded-full p-1 flex items-center justify-center shrink-0">
                        <img
                          src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg"
                          className="w-full h-full object-contain rounded-full"
                          alt="Logo"
                        />
                      </div>
                      <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">PT. LANCANG KUNING TRAVELINDO</h1>
                        <h2 className="text-2xl font-bold uppercase tracking-wider text-center">SURAT JALAN</h2>
                      </div>
                    </div>

                    <div className="text-right text-sm font-bold space-y-1 min-w-[250px]">
                      <div className="flex justify-between items-center border-b border-black border-dashed pb-1">
                        <span>No. Pol :</span>
                        <span className="font-mono ml-2">..............</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-black border-dashed pb-1">
                        <span>Tanggal :</span>
                        <span className="font-mono ml-2">{formatDate(suratJalan?.tripDate || date)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-black border-dashed pb-1">
                        <span>Driver :</span>
                        <span className="font-mono ml-2">..............</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full mb-12 border-2 border-black">
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
                        {suratLoading ? (
                          <tr className="h-10">
                            <td colSpan={6} className="p-4 text-center font-bold">Loading Surat Jalan...</td>
                          </tr>
                        ) : (
                          <>
                            {Array.from({ length: 7 }, (_, i) => {
                              const p = paxList[i];
                              const hasData = !!p?.name;

                              return (
                                <tr key={i} className="h-10">
                                  <td className="border-r border-black p-2 text-center font-bold">{i + 1}</td>

                                  <td className="border-r border-black p-2 font-bold uppercase">
                                    {hasData ? (
                                      <>
                                        {p.name} {p.seat ? <span className="font-normal text-xs">({String(p.seat).toUpperCase()})</span> : null}
                                        <br />
                                        <span className="font-normal text-xs">{hpSJ}</span>
                                      </>
                                    ) : null}
                                  </td>

                                  <td className="border-r border-black p-2 uppercase text-xs font-semibold">
                                    {hasData ? (jemputSJ || "") : ""}
                                  </td>

                                  <td className="border-r border-black p-2 uppercase text-xs font-semibold">
                                    {hasData ? (tujuanSJ || "") : ""}
                                  </td>

                                  <td className="border-r border-black p-2 text-right">
                                    {hasData ? (tarifPerSeat ? tarifPerSeat.toLocaleString() : "") : ""}
                                  </td>

                                  <td className="p-2 text-center text-[10px] font-bold">
                                    {hasData ? (isPaid ? "LUNAS" : (displayPaymentStatus || "BELUM BAYAR").toUpperCase()) : ""}
                                  </td>
                                </tr>
                              );
                            })}

                            {paxList.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-3 text-center text-xs font-semibold">
                                  Tidak ada data penumpang dari backend. Cek endpoint: <code>/api/reguler/bookings/{String(actualBookingId)}/surat-jalan</code>
                                </td>
                              </tr>
                            ) : null}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between px-16 text-center text-sm font-bold uppercase">
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
              </TabsContent>
            </Tabs>
          ) : (
            // bagian NON-REGULER / PPOB kamu biarkan
            isPPOB ? (
              <div className="w-full max-w-md mx-auto bg-white text-slate-900 font-mono text-sm p-6 shadow-2xl relative">
                <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                  <h3 className="font-bold text-xl">STRUK PEMBAYARAN</h3>
                  <p className="text-xs text-gray-500">LANCANG KUNING TRAVELINDO</p>
                  <p className="text-[10px] text-gray-400">{new Date(date).toLocaleString()}</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between"><span>NO. REF</span><span className="font-bold">{actualBookingId}</span></div>
                  <div className="flex justify-between"><span>PRODUK</span><span>{category}</span></div>
                  <div className="flex justify-between"><span>PROVIDER</span><span>{provider}</span></div>
                  <div className="flex justify-between"><span>ID PEL/NO HP</span><span className="font-bold">{customerNumber}</span></div>
                  {sn && <div className="flex justify-between"><span>TOKEN/SN</span><span className="font-bold bg-gray-100 px-1">{sn}</span></div>}
                  <div className="flex justify-between"><span>STATUS</span><span className="font-bold text-green-600">SUKSES</span></div>
                </div>

                <div className="border-t-2 border-dashed border-gray-300 pt-2 space-y-1">
                  <div className="flex justify-between"><span>HARGA</span><span>Rp {(totalAmount - adminFee).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>ADMIN</span><span>Rp {adminFee?.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
                    <span>TOTAL</span>
                    <span>Rp {totalAmount?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-8 text-center text-xs text-gray-400">
                  <p>Terima kasih atas kepercayaan anda.</p>
                  <p>Simpan struk ini sebagai bukti pembayaran yang sah.</p>
                </div>
              </div>
            ) : null
          )}

          {/* INVOICE SECTION (Common for all NON-REGULER, kept) */}
          {(!isPPOB && !isReguler) && (
            <div className="bg-white rounded-xl overflow-hidden text-slate-900 shadow-lg mt-8">
              <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                <div><h2 className="text-2xl font-bold tracking-tight">OFFICIAL INVOICE</h2><p className="text-slate-400 text-sm mt-1">#{actualBookingId}</p></div>
                <div className="text-right"><h3 className="font-bold text-lg">LAKUTRAND App</h3><p className="text-sm text-slate-400">PT. Lancang Kuning Travelindo</p></div>
              </div>
              {/* sisanya biarkan */}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;
