import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, X, Check, FileSpreadsheet, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_HOST } from '@/lib/api';

const InvoiceModal = ({ isOpen, onClose, bookingData, docsMode: docsModeProp, hideSuratJalan: hideSuratJalanProp }) => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("ticket");
  const [passengers, setPassengers] = useState([]);

  // ✅ pilih penumpang aktif untuk render ETK/INV di modal (bukan buka tab baru)
  const [activePassengerId, setActivePassengerId] = useState(null);

  // ✅ invoice mode (untuk tampilan di modal)
  // - "all"    => invoice gabungan semua penumpang
  // - "single" => invoice 1 penumpang saja (per seat)
  const [invoiceMode, setInvoiceMode] = useState("all");

  // ✅ refs untuk scroll + print
  const ticketRef = useRef(null);
  const invoiceRef = useRef(null);
  const suratRef = useRef(null);

  // ✅ ref khusus "print pack" (SEMUA tiket + invoice gabungan)
  const printPackRef = useRef(null);

  // ✅ state download/print
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // ===== Surat Jalan state (ambil dari backend) =====
  const [suratJalan, setSuratJalan] = useState(null);
  const [suratLoading, setSuratLoading] = useState(false);

  // ===== Payment gating state (live) =====
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [departureSyncing, setDepartureSyncing] = useState(false);
  const [lastSyncedDepartureKey, setLastSyncedDepartureKey] = useState("");

  // helper
  const norm = (v) => String(v || "").trim().toLowerCase();

  // ✅ mode "docs only" (tanpa surat jalan) dari query / props
  const docsCtx = useMemo(() => {
    const safe = { docsMode: "", hideSuratJalan: false };
    try {
      const docsModeFromProps = String(docsModeProp || "").trim();
      const hideFromProps = !!hideSuratJalanProp;

      const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const docsModeFromQuery = sp ? String(sp.get("docs") || "").trim() : "";
      const hideFromQuery =
        sp ? (sp.get("hideSuratJalan") === "1" || sp.get("hideSuratJalan") === "true") : false;

      const docsMode = docsModeFromProps || docsModeFromQuery || "";
      const hideSuratJalan = hideFromProps || hideFromQuery || docsMode === "eticket-invoice";

      return { docsMode, hideSuratJalan };
    } catch {
      return safe;
    }
  }, [docsModeProp, hideSuratJalanProp]);

  const hideSuratJalan = !!docsCtx.hideSuratJalan;

  const isPaid = useMemo(() => {
    const st = norm(paymentStatus);
    const pm = norm(paymentMethod);

    if (st === "lunas" || st === "paid" || st === "sukses" || st === "success" || st === "settlement") return true;
    if (pm === "cash") return true;
    return false;
  }, [paymentStatus, paymentMethod]);

  // Destructure booking data
  if (!bookingData) return null;

  const {
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

    senderName, senderAddress, senderPhone,
    receiverName, receiverAddress, receiverPhone,
    itemName, itemSize, itemType,

    isPPOB, provider, customerNumber, sn, adminFee
  } = bookingData;

  const actualBookingId = bookingId ?? legacyId;

  // ✅ Logo default
  const DEFAULT_LOGO_URL =
    "https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg";

  const logoUrl = useMemo(() => {
    return (
      bookingData?.logoUrl ||
      bookingData?.companyLogoUrl ||
      bookingData?.logo ||
      DEFAULT_LOGO_URL
    );
  }, [bookingData]);

  const qrUrl = useMemo(() => {
    const val = actualBookingId ? String(actualBookingId) : "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(val)}`;
  }, [actualBookingId]);

  // =========================
  // ✅ Agar logo & QR selalu muncul saat print:
  // convert ke dataURL (base64) supaya aman di iframe print.
  // =========================
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  const urlToDataUrl = async (url) => {
    if (!url) return "";
    try {
      const res = await fetch(url, { cache: "force-cache" });
      const blob = await res.blob();
      const reader = new FileReader();
      const data = await new Promise((resolve) => {
        reader.onloadend = () => resolve(String(reader.result || ""));
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
      return data || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setLogoDataUrl("");
      setQrDataUrl("");
      return;
    }

    let cancelled = false;

    (async () => {
      const [l, q] = await Promise.all([
        urlToDataUrl(logoUrl),
        urlToDataUrl(qrUrl),
      ]);

      if (cancelled) return;
      if (l) setLogoDataUrl(l);
      else setLogoDataUrl("");

      if (q) setQrDataUrl(q);
      else setQrDataUrl("");
    })();

    return () => { cancelled = true; };
  }, [isOpen, logoUrl, qrUrl]);

  const logoImgSrc = logoDataUrl || logoUrl;
  const qrImgSrc = qrDataUrl || qrUrl;

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("ticket");
      setSuratJalan(null);
      setSuratLoading(false);
      setPassengers([]);

      setActivePassengerId(null);
      setInvoiceMode("all");

      setPaymentStatus("");
      setPaymentMethod("");
      setCheckingStatus(false);
      setLastSyncedDepartureKey("");
      setDepartureSyncing(false);
      setDownloadingPdf(false);
      return;
    }

    const ps = bookingData?.paymentStatus || "";
    const pm = bookingData?.paymentMethod || "";
    setPaymentStatus(ps);
    setPaymentMethod(pm);

    const paid = (() => {
      const st = norm(ps);
      const pmm = norm(pm);
      if (st === "lunas" || st === "paid" || st === "sukses" || st === "success" || st === "settlement") return true;
      if (pmm === "cash") return true;
      return false;
    })();

    if (hideSuratJalan) {
      setActiveTab("ticket");
    } else {
      setActiveTab(paid ? "ticket" : "surat-jalan");
    }
  }, [isOpen, bookingData, hideSuratJalan]);

  // Fetch penumpang per booking (untuk ETK/INV per seat)
  useEffect(() => {
    if (!isOpen || !actualBookingId || !isPaid) {
      setPassengers([]);
      return;
    }
    const controller = new AbortController();
    fetch(`${API_HOST}/api/passengers?bookingId=${actualBookingId}`, { signal: controller.signal })
      .then((res) => res.json().catch(() => []))
      .then((data) => setPassengers(Array.isArray(data) ? data : []))
      .catch(() => setPassengers([]));
    return () => controller.abort();
  }, [isOpen, actualBookingId, isPaid]);

  // default pilih penumpang pertama
  useEffect(() => {
    if (!isOpen) return;

    if (!passengers || passengers.length === 0) {
      setActivePassengerId(null);
      setInvoiceMode("all");
      return;
    }

    setActivePassengerId((prev) => {
      const exists = passengers.some((p) => String(p.id) === String(prev));
      return exists ? prev : passengers[0].id;
    });
  }, [isOpen, passengers]);

  const seatsFromPassengers = passengers.map((p) => p.selectedSeats).filter(Boolean);
  const isPackage = category === 'Paket Barang';
  const isReguler = category === 'Reguler';

  const activePassenger = useMemo(() => {
    if (!passengers || passengers.length === 0) return null;
    const found = passengers.find((p) => String(p.id) === String(activePassengerId));
    return found || passengers[0] || null;
  }, [passengers, activePassengerId]);

  const seatsForDisplay = useMemo(() => {
    if (activePassenger?.selectedSeats) return [String(activePassenger.selectedSeats).toUpperCase().trim()];
    if (passengers.length) return seatsFromPassengers.map((s) => String(s).toUpperCase().trim());
    return (selectedSeats || []).map((s) => String(s).toUpperCase().trim());
  }, [activePassenger, passengers.length, seatsFromPassengers, selectedSeats]);

  const ticketPassengerName = activePassenger?.passengerName || passengerName || "";
  const ticketPassengerPhone = activePassenger?.passengerPhone || passengerPhone || "";
  const ticketSeat = activePassenger?.selectedSeats || (Array.isArray(selectedSeats) ? selectedSeats.join(", ") : (selectedSeats || ""));
  const ticketAmount = Number(activePassenger?.totalAmount || 0) || Number(totalAmount || 0);

  const displayPaymentStatus = paymentStatus || (paymentMethod ? "Belum Bayar" : "Belum Bayar");

  const handleCheckPaymentStatus = async () => {
    if (!actualBookingId) {
      toast({ title: "Gagal", description: "bookingId belum tersedia." });
      return;
    }

    try {
      setCheckingStatus(true);
      const res = await fetch(`${API_HOST}/api/reguler/bookings/${actualBookingId}`, {
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
        if (!hideSuratJalan) setActiveTab("surat-jalan");
      }
    } catch (e) {
      toast({ title: "Gagal", description: e?.message || "Terjadi kesalahan saat cek status." });
    } finally {
      setCheckingStatus(false);
    }
  };

  // ===== Fetch Surat Jalan ketika tab aktif =====
  useEffect(() => {
    const shouldFetch =
      !hideSuratJalan &&
      isOpen &&
      isReguler &&
      !isPPOB &&
      activeTab === "surat-jalan" &&
      actualBookingId;

    if (!shouldFetch) return;

    const controller = new AbortController();
    setSuratLoading(true);

    fetch(`${API_HOST}/api/reguler/bookings/${actualBookingId}/surat-jalan?scope=trip`, { signal: controller.signal })
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
  }, [isOpen, activeTab, actualBookingId, isReguler, isPPOB, toast, hideSuratJalan]);

  // Auto-fetch surat jalan setelah lunas
  useEffect(() => {
    if (!isOpen || !isReguler || isPPOB) return;
    if (!actualBookingId || !isPaid) return;
    if (suratJalan || suratLoading) return;

    const controller = new AbortController();
    setSuratLoading(true);

    fetch(`${API_HOST}/api/reguler/bookings/${actualBookingId}/surat-jalan?scope=trip`, { signal: controller.signal })
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
        console.warn("Auto-fetch surat jalan gagal:", e?.message || e);
      })
      .finally(() => setSuratLoading(false));

    return () => controller.abort();
  }, [isOpen, isReguler, isPPOB, actualBookingId, isPaid, suratJalan, suratLoading]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // ===== Helpers surat jalan & dokumen per seat =====
  const paxList = Array.isArray(suratJalan?.passengers) ? suratJalan.passengers : [];

  const invoiceRows = useMemo(() => {
    if (!passengers || passengers.length === 0) {
      return [{
        id: actualBookingId || 0,
        seat: (selectedSeats || []).join(', '),
        name: passengerName,
        phone: passengerPhone,
        amount: Number(totalAmount || 0),
      }];
    }

    if (invoiceMode === "single" && activePassenger) {
      return [{
        id: activePassenger.id,
        seat: activePassenger.selectedSeats,
        name: activePassenger.passengerName,
        phone: activePassenger.passengerPhone,
        amount: Number(activePassenger.totalAmount || 0),
      }];
    }

    return passengers.map((p) => ({
      id: p.id,
      seat: p.selectedSeats,
      name: p.passengerName,
      phone: p.passengerPhone,
      amount: Number(p.totalAmount || 0),
    }));
  }, [passengers, selectedSeats, passengerName, passengerPhone, totalAmount, invoiceMode, activePassenger, actualBookingId]);

  const invoiceTotal = useMemo(() => {
    return invoiceRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [invoiceRows]);

  const billedToName = invoiceMode === "single"
    ? (ticketPassengerName || passengerName || "")
    : (passengerName || ticketPassengerName || "");
  const billedToPhone = invoiceMode === "single"
    ? (ticketPassengerPhone || passengerPhone || "")
    : (passengerPhone || ticketPassengerPhone || "");

  // ✅ UNTUK PRINT (PACK): selalu cetak SEMUA tiket + 1 invoice gabungan
  const printTickets = useMemo(() => {
    if (passengers && passengers.length > 0) {
      return passengers.map((p) => ({
        key: String(p.id),
        id: p.id,
        name: p.passengerName || "",
        phone: p.passengerPhone || "",
        seat: String(p.selectedSeats || "").toUpperCase().trim(),
        amount: Number(p.totalAmount || 0),
      }));
    }
    // fallback: kalau backend belum ada passengers, pakai data booking (1 tiket)
    return [{
      key: String(actualBookingId || "booking"),
      id: actualBookingId || "booking",
      name: passengerName || "",
      phone: passengerPhone || "",
      seat: (Array.isArray(selectedSeats) ? selectedSeats.join(", ") : (selectedSeats || "")),
      amount: Number(totalAmount || 0),
    }];
  }, [passengers, actualBookingId, passengerName, passengerPhone, selectedSeats, totalAmount]);

  const printInvoiceRowsAll = useMemo(() => {
    if (passengers && passengers.length > 0) {
      return passengers.map((p) => ({
        id: p.id,
        seat: p.selectedSeats,
        name: p.passengerName,
        phone: p.passengerPhone,
        amount: Number(p.totalAmount || 0),
      }));
    }
    return [{
      id: actualBookingId || 0,
      seat: (selectedSeats || []).join(', '),
      name: passengerName,
      phone: passengerPhone,
      amount: Number(totalAmount || 0),
    }];
  }, [passengers, actualBookingId, selectedSeats, passengerName, passengerPhone, totalAmount]);

  const printInvoiceTotalAll = useMemo(() => {
    return printInvoiceRowsAll.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [printInvoiceRowsAll]);

  const printBilledToName = passengerName || (printTickets?.[0]?.name || "");
  const printBilledToPhone = passengerPhone || (printTickets?.[0]?.phone || "");

  const jemputSJ = suratJalan?.pickupLocation || pickupLocation || pickupAddress || from || "";
  const tujuanSJ = suratJalan?.dropoffLocation || dropoffLocation || dropoffAddress || to || "";
  const hpSJ = suratJalan?.passengerPhone || passengerPhone || "";

  const seatCount =
    (seatsFromPassengers?.length || 0) ||
    (selectedSeats?.length || 0) ||
    (paxList?.length || 0);
  const tarifFallback =
    Number(suratJalan?.pricePerSeat || 0) ||
    (seatCount > 0 ? Math.round((Number(totalAmount || 0)) / seatCount) : Number(totalAmount || 0));

  const rowCount = Math.max(7, paxList.length);

  const seatsFromSurat = Array.isArray(suratJalan?.passengers)
    ? suratJalan.passengers.map((p) => p.seat).filter(Boolean)
    : [];
  const seatNumbersForDepart =
    (seatsFromPassengers.length ? seatsFromPassengers : (selectedSeats?.length ? selectedSeats : seatsFromSurat)).join(", ");
  const passengerCountForDepart =
    seatsFromPassengers.length ||
    selectedSeats?.length ||
    seatsFromSurat.length ||
    paxList.length ||
    Number(bookingData?.passengerCount || 0) ||
    0;

  const bookingIdForDepart = actualBookingId ? Number(actualBookingId) : undefined;
  const validBookingIdForDepart =
    Number.isFinite(bookingIdForDepart) && bookingIdForDepart > 0 ? bookingIdForDepart : null;

  const suratJalanUrlFallback = actualBookingId
    ? `${API_HOST}/api/reguler/bookings/${actualBookingId}/surat-jalan?scope=trip`
    : "";

  const suratFileSrc =
    suratJalan?.downloadUrl ||
    suratJalan?.url ||
    suratJalan?.src ||
    suratJalan?.file ||
    "";
  const suratIsPdf = String(suratFileSrc || "").toLowerCase().includes(".pdf");

  const departurePayload = useMemo(
    () => ({
      bookingId: validBookingIdForDepart ?? undefined,
      bookingName: passengerName || bookingData?.bookingName || "",
      phone: passengerPhone || bookingData?.passengerPhone || bookingData?.phone || "",
      pickupAddress: pickupLocation || pickupAddress || suratJalan?.pickupLocation || jemputSJ || "",
      departureDate: suratJalan?.tripDate || date || "",
      departureTime: suratJalan?.tripTime || time || "",
      seatNumbers: seatNumbersForDepart,
      passengerCount: String(passengerCountForDepart || 0),
      serviceType: category || bookingData?.serviceType || "Reguler",
      driverName: suratJalan?.driverName || "",
      vehicleCode: suratJalan?.vehicleCode || "",
      routeFrom: suratJalan?.routeFrom || from || jemputSJ || "",
      routeTo: suratJalan?.routeTo || to || tujuanSJ || "",
      suratJalanFile:
        suratJalan?.downloadUrl ||
        suratJalan?.url ||
        suratJalan?.src ||
        suratJalan?.file ||
        suratJalanUrlFallback,
      suratJalanFileName: suratJalan?.fileName || (actualBookingId ? `surat_jalan_${actualBookingId}.pdf` : ""),
      departureStatus: "Berangkat",
    }),
    [
      validBookingIdForDepart,
      passengerName,
      bookingData?.bookingName,
      passengerPhone,
      bookingData?.passengerPhone,
      bookingData?.phone,
      pickupLocation,
      pickupAddress,
      suratJalan?.pickupLocation,
      jemputSJ,
      suratJalan?.tripDate,
      date,
      suratJalan?.tripTime,
      time,
      seatNumbersForDepart,
      passengerCountForDepart,
      category,
      bookingData?.serviceType,
      suratJalan?.driverName,
      suratJalan?.vehicleCode,
      suratJalan?.routeFrom,
      from,
      suratJalan?.routeTo,
      to,
      tujuanSJ,
      suratJalan?.downloadUrl,
      suratJalan?.url,
      suratJalan?.src,
      suratJalan?.file,
      suratJalan?.fileName,
    ],
  );

  const departurePayloadKey = useMemo(() => JSON.stringify(departurePayload), [departurePayload]);

  const LockedBox = ({ title }) => (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
      <Lock className="w-5 h-5 text-red-300 mt-0.5" />
      <div className="text-sm text-red-100">
        <div className="font-bold">{title} dikunci</div>
        <div className="mt-1 text-red-200">
          Untuk metode <b>Transfer/QRIS</b>, {title.toLowerCase()} hanya tampil setelah admin mengubah status menjadi <b>Lunas</b>.
          {!hideSuratJalan ? (
            <> Anda tetap bisa melihat <b>E-Surat Jalan</b>.</>
          ) : null}
        </div>
      </div>
    </div>
  );

  // kirim otomatis ke Pengaturan Keberangkatan saat sudah lunas
  useEffect(() => {
    if (!isOpen || !isReguler || isPPOB) return;
    if (!actualBookingId || !isPaid) return;
    if (!departurePayloadKey || departurePayloadKey === lastSyncedDepartureKey) return;
    if (departureSyncing) return;

    let aborted = false;

    const run = async () => {
      setDepartureSyncing(true);
      try {
        let existingId = null;
        try {
          const resList = await fetch(`${API_HOST}/api/departure-settings`);
          const dataList = await resList.json().catch(() => []);
          if (Array.isArray(dataList)) {
            if (validBookingIdForDepart) {
              const found = dataList.find((d) => String(d.bookingId) === String(validBookingIdForDepart));
              if (found) existingId = found.id;
            }
          }
        } catch (err) {
          console.warn("Cek departure-settings gagal", err);
        }

        const url = existingId
          ? `${API_HOST}/api/departure-settings/${existingId}`
          : `${API_HOST}/api/departure-settings`;
        const method = existingId ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(departurePayload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Gagal sinkronisasi (${res.status})`);
        }

        if (!aborted) setLastSyncedDepartureKey(departurePayloadKey);
      } catch (err) {
        if (!aborted) console.error("Sinkronisasi Pengaturan Keberangkatan gagal", err);
      } finally {
        if (!aborted) setDepartureSyncing(false);
      }
    };

    run();

    return () => {
      aborted = true;
    };
  }, [
    isOpen,
    isReguler,
    isPPOB,
    validBookingIdForDepart,
    isPaid,
    departurePayloadKey,
    lastSyncedDepartureKey,
    departurePayload,
    departureSyncing,
  ]);

  // =========================
  // ✅ PRINT (Tanpa Popup) via HIDDEN IFRAME
  // =========================
  const PRINT_CSS = `
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    .shadow, .shadow-lg, .shadow-xl, .shadow-2xl { box-shadow: none !important; }

    /* ukuran A4 kira2 794px di 96dpi */
    .print-sheet { width: 794px; margin: 0 auto; background: #ffffff; }

    /* paksa pindah halaman */
    .page-break-before { break-before: page; page-break-before: always; }
    .page-break-after { break-after: page; page-break-after: always; }
  `;

  const getInlineStylesHTML = () => {
    // Salin stylesheet dari app (Tailwind) agar tampilan 1:1
    try {
      return Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((node) => node.outerHTML)
        .join("\n");
    } catch {
      return "";
    }
  };

  const waitForIframeReady = async (win) => {
    // tunggu fonts
    try {
      if (win?.document?.fonts?.ready) await win.document.fonts.ready;
    } catch { }

    // tunggu images
    const imgs = Array.from(win?.document?.images || []);
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise((res) => {
            if (img.complete) return res();
            img.onload = res;
            img.onerror = res;
          })
      )
    );

    // jeda kecil supaya layout settle
    await new Promise((r) => setTimeout(r, 120));
  };

  const printHtmlInHiddenIframe = async ({ title, bodyHtml }) => {
    // ✅ HIDDEN IFRAME (tanpa popup)
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    const win = iframe.contentWindow;

    if (!doc || !win) {
      try { iframe.remove(); } catch { }
      toast({ title: "Gagal", description: "Tidak bisa membuat area print." });
      return;
    }

    const stylesHTML = getInlineStylesHTML();
    const baseHref = (typeof window !== "undefined" && window.location?.origin) ? window.location.origin : "";

    doc.open();
    doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${baseHref ? `<base href="${baseHref}/" />` : ""}
  <title>${title || "Print"}</title>
  <style>${PRINT_CSS}</style>
  ${stylesHTML}
</head>
<body>
  ${bodyHtml}
</body>
</html>`);
    doc.close();

    try {
      await waitForIframeReady(win);
      win.focus();
      win.print();
    } catch (e) {
      toast({ title: "Gagal", description: e?.message || "Gagal membuka dialog print." });
    } finally {
      setTimeout(() => {
        try { iframe.remove(); } catch { }
      }, 1800);
    }
  };

  const handlePrintTicketInvoice = async () => {
    if (!isPaid) {
      toast({
        title: "Dikunci",
        description: "E-ticket & invoice hanya bisa dicetak setelah pembayaran Lunas.",
        variant: "destructive"
      });
      return;
    }

    const packEl = printPackRef.current;
    if (!packEl) {
      toast({ title: "Gagal", description: "Elemen Print tidak ditemukan." });
      return;
    }

    const bodyHtml = `
      <div class="print-sheet">
        ${packEl.innerHTML}
      </div>
    `;

    await printHtmlInHiddenIframe({ title: "ETicket & Invoice", bodyHtml });
  };

  // ✅ PRINT PER ORANG (1 tiket + 1 invoice)
  const handlePrintPerPassenger = async (p) => {
    if (!isPaid) {
      toast({
        title: "Dikunci",
        description: "E-ticket & invoice hanya bisa dicetak setelah pembayaran Lunas.",
        variant: "destructive"
      });
      return;
    }

    const key = String(p?.id || p?.key || "");
    const el = document.getElementById(`print_single_${key}`);
    if (!el) {
      toast({ title: "Gagal", description: "Elemen print per orang tidak ditemukan." });
      return;
    }

    const bodyHtml = `
      <div class="print-sheet">
        ${el.innerHTML}
      </div>
    `;

    await printHtmlInHiddenIframe({
      title: `ETicket & Invoice - ${p?.passengerName || p?.name || "Penumpang"}`,
      bodyHtml
    });
  };

  // =========================
  // ✅ PDF GENERATOR (khusus Surat Jalan tetap)
  // =========================
  const ensurePdfLibs = async () => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      return { html2canvas, jsPDF };
    } catch (e) {
      return null;
    }
  };

  const canvasToPdfPages = async ({ canvas, pdf }) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const scale = pageWidth / canvasWidth;
    const scaledHeight = canvasHeight * scale;

    if (scaledHeight <= pageHeight) {
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, scaledHeight);
      return;
    }

    const pageHeightPx = Math.floor(pageHeight / scale);
    let y = 0;
    let pageIndex = 0;

    while (y < canvasHeight) {
      const sliceHeight = Math.min(pageHeightPx, canvasHeight - y);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext('2d');
      ctx.drawImage(
        canvas,
        0, y, canvasWidth, sliceHeight,
        0, 0, canvasWidth, sliceHeight
      );

      const imgData = pageCanvas.toDataURL('image/png', 1.0);

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, sliceHeight * scale);

      y += sliceHeight;
      pageIndex += 1;
    }
  };

  const captureElementToCanvas = async (html2canvas, el) => {
    try {
      if (document?.fonts?.ready) await document.fonts.ready;
    } catch { }

    await new Promise((r) => setTimeout(r, 60));

    return await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: Math.min(2, (window.devicePixelRatio || 1) + 0.5),
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.clientWidth,
    });
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleDownload = async () => {
    // gate
    if (!isPaid && activeTab !== "surat-jalan") {
      toast({
        title: "Dikunci",
        description: "E-ticket & invoice hanya bisa diunduh setelah pembayaran Lunas.",
        variant: "destructive"
      });
      return;
    }

    if (downloadingPdf) return;

    // ✅ TICKET/INVOICE => pakai PRINT (paling 1:1), TANPA POPUP
    if (activeTab === "ticket") {
      try {
        setDownloadingPdf(true);
        await handlePrintTicketInvoice();
      } finally {
        setDownloadingPdf(false);
      }
      return;
    }

    // ✅ SURAT JALAN => tetap pakai mekanisme lama
    if (activeTab === "surat-jalan") {
      if (suratFileSrc && suratIsPdf) {
        try {
          setDownloadingPdf(true);
          const res = await fetch(suratFileSrc);
          const blob = await res.blob();
          downloadBlob(blob, `surat_jalan_${actualBookingId || 'trip'}.pdf`);
          toast({ title: "Sukses", description: "Surat Jalan PDF berhasil diunduh." });
        } catch (e) {
          window.open(suratFileSrc || suratJalanUrlFallback, "_blank");
        } finally {
          setDownloadingPdf(false);
        }
        return;
      }

      const libs = await ensurePdfLibs();
      if (!libs) {
        toast({
          title: "Dependency belum ada",
          description: "Install dulu: npm i html2canvas jspdf (agar Download PDF bisa langsung jadi).",
          variant: "destructive"
        });
        return;
      }

      const { html2canvas, jsPDF } = libs;

      try {
        setDownloadingPdf(true);

        const el = suratRef.current;
        if (!el) throw new Error("Elemen Surat Jalan tidak ditemukan.");

        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
        const canvas = await captureElementToCanvas(html2canvas, el);
        await canvasToPdfPages({ canvas, pdf });

        const filename = `surat_jalan_${actualBookingId || 'trip'}.pdf`;
        const blob = pdf.output('blob');
        downloadBlob(blob, filename);

        toast({ title: "Sukses", description: "Surat Jalan PDF berhasil dibuat." });
      } catch (e) {
        toast({ title: "Gagal", description: e?.message || "Gagal membuat PDF Surat Jalan." });
      } finally {
        setDownloadingPdf(false);
      }
      return;
    }
  };

  // =========================
  // ✅ TEMPLATE RENDER (agar konsisten)
  // =========================
  const TicketCard = ({ tName, tPhone, tSeat, tAmount, tSeatsForDisplay }) => {
    const seatsUpper = Array.isArray(tSeatsForDisplay) ? tSeatsForDisplay : [];
    const safeSeat = String(tSeat || "").toUpperCase().trim();
    const seatsForHighlight = seatsUpper.length ? seatsUpper : (safeSeat ? [safeSeat] : []);

    return (
      <div className="w-full bg-[#FFFACD] text-[#000080] font-sans p-4 rounded-lg shadow-xl relative overflow-hidden border-4 border-[#000080]">
        <div className="flex justify-between items-center border-b-4 border-[#000080] pb-2 mb-4">
          <div className="w-24 h-24 rounded-full border-2 border-[#000080] flex items-center justify-center bg-white p-1 overflow-hidden">
            <img
              src={logoImgSrc}
              alt="Logo"
              className="w-full h-full object-cover"
              loading="eager"
            />
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
            <img
              src={qrImgSrc}
              alt="QR"
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <div className="border-2 border-[#000080] rounded-lg p-2 bg-[#FFF8DC]">
              <h3 className="bg-[#000080] text-white text-center font-bold uppercase text-sm py-1 mb-2 rounded">Tiket Penumpang</h3>
              <div className="space-y-1 text-xs font-bold">
                <div className="flex"><span className="w-24">Nama</span>: {tName}</div>
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
                <div className="flex"><span className="w-24">Tarif</span>: Rp {Number(tAmount || 0).toLocaleString('id-ID')}</div>
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
                <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${seatsForHighlight.includes('1A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>1</div>
                <div className="h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-sm bg-gray-200 text-gray-500 rounded">SOPIR</div>
                <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${seatsForHighlight.includes('2A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>2</div>
                <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${seatsForHighlight.includes('3A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>3</div>
                <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${seatsForHighlight.includes('4A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>4</div>
                <div className={`h-12 border-2 border-[#000080] flex items-center justify-center font-bold text-xl rounded ${seatsForHighlight.includes('5A') ? 'bg-[#000080] text-white' : 'bg-white'}`}>5</div>
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
    );
  };

  const InvoiceCard = ({ rows, total, billedName, billedPhone, showModeLabel, modeLabel, modeSeat, showButtons }) => {
    return (
      <div className="bg-white rounded-xl overflow-hidden text-slate-900 shadow-lg">
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">OFFICIAL INVOICE</h2>
            <p className="text-slate-400 text-sm mt-1">#{actualBookingId}</p>
            {showModeLabel ? (
              <p className="text-slate-300 text-xs mt-1">
                Mode: <b>{modeLabel}</b>{modeSeat ? ` (Seat ${modeSeat})` : ""}
              </p>
            ) : null}
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
              <p className="font-bold text-lg">{billedName}</p>
              <p className="text-sm text-slate-600">{billedPhone}</p>
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-800">Travel Ticket ({category})</p>
                    <p className="text-xs text-slate-500">Seat: {row.seat}</p>
                    {row.name ? <p className="text-xs text-slate-500">{row.name}</p> : null}
                  </td>
                  <td className="py-4 px-4 text-center text-slate-600">1</td>
                  <td className="py-4 px-4 text-right font-medium text-slate-800">
                    Rp {Number(row.amount || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-900">
              <tr>
                <td colSpan="2" className="pt-4 text-right font-bold text-slate-900">Total Paid</td>
                <td className="pt-4 px-4 text-right font-bold text-xl text-slate-900">
                  Rp {Number(total || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>

          {showButtons ? (
            <div className="flex justify-end gap-2 no-print">
              <Button
                variant="outline"
                className="h-8 text-xs border-slate-300 text-slate-700"
                onClick={() => setInvoiceMode("all")}
              >
                Invoice Gabungan
              </Button>
              <Button
                variant="outline"
                className="h-8 text-xs border-slate-300 text-slate-700"
                onClick={() => setInvoiceMode("single")}
                disabled={!activePassenger}
              >
                Invoice Per Orang
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

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
              disabled={downloadingPdf}
              title={downloadingPdf ? "Sedang membuat PDF..." : "Print / Save as PDF"}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadingPdf ? "Membuat PDF..." : "Download PDF"}
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
              if (v === "ticket" && !isPaid) {
                toast({
                  title: "Dikunci",
                  description: "E-ticket & invoice hanya muncul setelah pembayaran Lunas.",
                  variant: "destructive"
                });

                if (hideSuratJalan) {
                  setActiveTab("ticket");
                  return;
                }

                setActiveTab("surat-jalan");
                return;
              }

              if (v === "surat-jalan" && hideSuratJalan) {
                setActiveTab("ticket");
                return;
              }

              setActiveTab(v);
            }} className="w-full">

              <TabsList className={`grid w-full ${hideSuratJalan ? "grid-cols-1" : "grid-cols-2"} mb-8 bg-slate-800`}>
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

                {!hideSuratJalan ? (
                  <TabsTrigger
                    value="surat-jalan"
                    className="data-[state=active]:bg-white data-[state=active]:text-black font-bold border border-transparent data-[state=active]:border-slate-200"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> E-Surat Jalan
                  </TabsTrigger>
                ) : null}
              </TabsList>

              {/* TAB 1: TICKET & INVOICE */}
              <TabsContent value="ticket" className="space-y-8 mt-0">
                {!isPaid ? (
                  <LockedBox title="E-Ticket & Invoice" />
                ) : (
                  <>
                    {passengers.length > 0 && (
                      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 no-print">
                        <h3 className="text-sm font-semibold text-white mb-3">E-Ticket & Invoice per Penumpang</h3>
                        <div className="space-y-2">
                          {passengers.map((p) => (
                            <div
                              key={p.id}
                              className={[
                                "flex items-center justify-between bg-slate-900 rounded px-3 py-2 border",
                                String(p.id) === String(activePassengerId) ? "border-yellow-500/60" : "border-transparent",
                              ].join(" ")}
                            >
                              <div>
                                <div className="text-white font-semibold">{p.passengerName} ({p.selectedSeats})</div>
                                <div className="text-xs text-slate-300">Rp {Number(p.totalAmount || 0).toLocaleString('id-ID')}</div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/10 h-8 px-2 text-xs"
                                  onClick={() => {
                                    setActiveTab("ticket");
                                    setActivePassengerId(p.id);
                                    setInvoiceMode("all");
                                    setTimeout(() => ticketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                                  }}
                                >
                                  ETK
                                </Button>

                                <Button
                                  variant="outline"
                                  className="text-green-400 border-green-500/40 hover:bg-green-500/10 h-8 px-2 text-xs"
                                  onClick={() => {
                                    setActiveTab("ticket");
                                    setActivePassengerId(p.id);
                                    setInvoiceMode("single");
                                    setTimeout(() => invoiceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                                  }}
                                >
                                  INV
                                </Button>

                                {/* ✅ Tombol PDF per orang (1 tiket + 1 invoice) */}
                                <Button
                                  variant="outline"
                                  className="text-blue-400 border-blue-500/40 hover:bg-blue-500/10 h-8 px-2 text-xs"
                                  onClick={async () => {
                                    if (downloadingPdf) return;
                                    try {
                                      setDownloadingPdf(true);
                                      await handlePrintPerPassenger(p);
                                    } finally {
                                      setDownloadingPdf(false);
                                    }
                                  }}
                                  title="Print / Save as PDF (1 orang)"
                                >
                                  PDF
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* E-TICKET (tampilan di modal) */}
                    <div ref={ticketRef}>
                      <TicketCard
                        tName={ticketPassengerName}
                        tPhone={ticketPassengerPhone}
                        tSeat={ticketSeat}
                        tAmount={ticketAmount}
                        tSeatsForDisplay={seatsForDisplay}
                      />
                    </div>

                    {/* OFFICIAL INVOICE (tampilan di modal) */}
                    <div ref={invoiceRef}>
                      <InvoiceCard
                        rows={invoiceRows}
                        total={invoiceTotal}
                        billedName={billedToName}
                        billedPhone={billedToPhone}
                        showModeLabel={true}
                        modeLabel={invoiceMode === "single" ? "Per Orang" : "Gabungan"}
                        modeSeat={invoiceMode === "single" ? (ticketSeat || "") : ""}
                        showButtons={passengers.length > 0}
                      />
                    </div>

                    {/* =========================
                        ✅ PRINT PACK (HIDDEN)
                        - SEMUA E-TICKET (per penumpang) -> tiap tiket 1 halaman
                        - OFFICIAL INVOICE -> selalu mulai halaman baru
                       ========================= */}
                    <div
                      ref={printPackRef}
                      aria-hidden="true"
                      className="fixed -left-[99999px] top-0 w-[794px] bg-white"
                    >
                      {printTickets.map((t, idx) => {
                        const seatUp = String(t.seat || "").toUpperCase().trim();
                        const oneSeatArr = seatUp ? [seatUp] : [];
                        const isLastTicket = idx === printTickets.length - 1;

                        return (
                          <div
                            key={t.key}
                            className={isLastTicket ? "" : "page-break-after"}
                          >
                            <TicketCard
                              tName={t.name}
                              tPhone={t.phone}
                              tSeat={t.seat}
                              tAmount={t.amount}
                              tSeatsForDisplay={oneSeatArr}
                            />
                          </div>
                        );
                      })}

                      {/* ✅ Invoice selalu halaman baru */}
                      <div className="page-break-before">
                        <InvoiceCard
                          rows={printInvoiceRowsAll}
                          total={printInvoiceTotalAll}
                          billedName={printBilledToName}
                          billedPhone={printBilledToPhone}
                          showModeLabel={true}
                          modeLabel={"Gabungan"}
                          modeSeat={""}
                          showButtons={false}
                        />
                      </div>
                    </div>

                    {/* =========================
                        ✅ PRINT SINGLE (HIDDEN)
                        - 1 penumpang => tiket halaman 1, invoice halaman 2
                       ========================= */}
                    <div aria-hidden="true" className="fixed -left-[99999px] top-0 w-[794px] bg-white">
                      {(passengers && passengers.length > 0 ? passengers : []).map((p) => {
                        const key = String(p.id);
                        const seatUp = String(p.selectedSeats || "").toUpperCase().trim();
                        const oneSeatArr = seatUp ? [seatUp] : [];
                        const amount = Number(p.totalAmount || 0);

                        const singleRows = [{
                          id: p.id,
                          seat: p.selectedSeats,
                          name: p.passengerName,
                          phone: p.passengerPhone,
                          amount,
                        }];

                        return (
                          <div key={`single_${key}`} id={`print_single_${key}`}>
                            <TicketCard
                              tName={p.passengerName || ""}
                              tPhone={p.passengerPhone || ""}
                              tSeat={p.selectedSeats || ""}
                              tAmount={amount}
                              tSeatsForDisplay={oneSeatArr}
                            />
                            <div className="page-break-before">
                              <InvoiceCard
                                rows={singleRows}
                                total={amount}
                                billedName={p.passengerName || ""}
                                billedPhone={p.passengerPhone || ""}
                                showModeLabel={true}
                                modeLabel={"Per Orang"}
                                modeSeat={p.selectedSeats || ""}
                                showButtons={false}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* TAB 2: SURAT JALAN */}
              {!hideSuratJalan ? (
                <TabsContent value="surat-jalan" className="mt-0">
                  {/* Wrapper ref untuk capture surat jalan */}
                  <div ref={suratRef}>
                    {suratFileSrc ? (
                      <div className="w-full h-[80vh] bg-slate-950 border border-gray-200 shadow-xl rounded-md overflow-hidden flex items-center justify-center">
                        {suratIsPdf ? (
                          <iframe title="Surat Jalan" src={suratFileSrc} className="w-full h-full border-0" />
                        ) : (
                          <img
                            src={suratFileSrc}
                            alt="Surat Jalan"
                            className="max-w-full max-h-full object-contain"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full bg-white text-black p-8 font-sans min-h-[600px] border border-gray-200 shadow-xl">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-white border-2 border-black rounded-full p-1 flex items-center justify-center shrink-0">
                              <img
                                src={logoImgSrc}
                                className="w-full h-full object-contain rounded-full"
                                alt="Logo"
                                loading="eager"
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
                                  {Array.from({ length: rowCount }, (_, i) => {
                                    const p = paxList[i];
                                    const hasData = !!(p && (p.name || p.seat || p.phone || p.pickupLocation || p.dropoffLocation));

                                    const seat = String(p?.seat || "").toUpperCase().trim();
                                    const name = String(p?.name || "").trim();
                                    const phone = String(p?.phone || hpSJ || "").trim();

                                    const jemput = String(p?.pickupLocation || jemputSJ || "").trim();
                                    const tujuan = String(p?.dropoffLocation || tujuanSJ || "").trim();

                                    const fare = Number(p?.fare ?? tarifFallback ?? 0);
                                    const status =
                                      String(p?.status || (isPaid ? "LUNAS" : (displayPaymentStatus || "BELUM BAYAR"))).toUpperCase();

                                    return (
                                      <tr key={i} className="h-10">
                                        <td className="border-r border-black p-2 text-center font-bold">{i + 1}</td>

                                        <td className="border-r border-black p-2 font-bold uppercase">
                                          {hasData ? (
                                            <>
                                              {name ? name : ""}
                                              {seat ? <span className="font-normal text-xs"> ({seat})</span> : null}
                                              <br />
                                              <span className="font-normal text-xs">{phone}</span>
                                            </>
                                          ) : null}
                                        </td>

                                        <td className="border-r border-black p-2 uppercase text-xs font-semibold">
                                          {hasData ? jemput : ""}
                                        </td>

                                        <td className="border-r border-black p-2 uppercase text-xs font-semibold">
                                          {hasData ? tujuan : ""}
                                        </td>

                                        <td className="border-r border-black p-2 text-right">
                                          {hasData ? (fare ? fare.toLocaleString() : "") : ""}
                                        </td>

                                        <td className="p-2 text-center text-[10px] font-bold">
                                          {hasData ? status : ""}
                                        </td>
                                      </tr>
                                    );
                                  })}

                                  {paxList.length === 0 ? (
                                    <tr>
                                      <td colSpan={6} className="p-3 text-center text-xs font-semibold">
                                        Tidak ada data penumpang dari backend. Pastikan endpoint mengembalikan passengers untuk scope=trip.
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
                    )}
                  </div>
                </TabsContent>
              ) : null}
            </Tabs>
          ) : (
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
