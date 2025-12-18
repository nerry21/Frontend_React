// src/pages/BookingPage/index.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Users,
  Briefcase,
  Package,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Hotel as HotelIcon,
  PlaneLanding,
  Key,
} from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import PaymentModal from '@/components/PaymentModal';
import InvoiceModal from '@/components/InvoiceModal';

// step-2 components
import RegulerStep from './Reguler';
import DroppingStep from './Dropping';
import PaketBarangStep from './PaketBarang';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const REGULER_PRICE_PER_SEAT = 150000;
const REGULER_MAX_PAX = 6;
const REGULER_MAX_TOTAL = 900000;

// localStorage keys (persist & resume)
const LS_LAST_BOOKING_ID = 'lastRegulerBookingId';
const LS_LAST_BOOKING_SNAPSHOT = 'lastRegulerBookingSnapshot';

const normalizePaymentStatus = (s) => String(s || '').trim();
const isLunas = (s) => normalizePaymentStatus(s).toLowerCase() === 'lunas';

const BookingPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);

  // --- CORE STATE ---
  const [bookingData, setBookingData] = useState({
    category: '',
    from: 'Rokan Hulu',
    to: 'Pekanbaru',
    date: '',
    time: '08:00',

    // Reguler
    selectedSeats: [],
    passengerCount: 1,
    passengerName: '',
    passengerPhone: '',
    pickupLocation: '',
    dropoffLocation: '',
    bookingId: null,

    // harga
    pricePerSeat: 0,
    totalAmount: 0,

    // Dropping / Rental
    pickupLocations: [''],
    dropoffLocations: [''],
    rentalDuration: 1,

    // Paket Barang
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    itemType: 'Box',
    itemSize: 'Kecil',
    itemName: '',
    packagePrice: 0,

    // Negotiation
    isNegotiated: false,
    negotiatedPrice: 0,

    // Payment
    paymentMethod: '',
    paymentStatus: '',
  });

  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  // ✅ Resume last booking (supaya setelah approve tidak balik ke awal)
  useEffect(() => {
    try {
      const savedId = Number(localStorage.getItem(LS_LAST_BOOKING_ID) || 0);
      const snapRaw = localStorage.getItem(LS_LAST_BOOKING_SNAPSHOT);

      if (!savedId) return;

      // jangan ganggu kalau user sedang bikin booking baru (step bukan 1)
      if (step !== 1) return;

      // kalau user datang via URL category, biarkan flow URL yang menangani
      const params = new URLSearchParams(location.search);
      const catFromUrl = params.get('category');
      if (catFromUrl) return;

      let snap = null;
      try {
        snap = snapRaw ? JSON.parse(snapRaw) : null;
      } catch {
        snap = null;
      }

      setBookingData((prev) => ({
        ...prev,
        ...(snap || {}),
        bookingId: savedId,
        category: (snap && snap.category) || prev.category || 'Reguler',
      }));

      // langsung ke step 4 biar status pembayaran kelihatan
      setStep(4);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, location.search]);

  // 🔥 AUTO PILIH KATEGORI DARI URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let cat = params.get('category');

    const path = location.pathname || '';
    if (!cat) {
      if (path.startsWith('/booking/reguler')) cat = 'Reguler';
      else if (path.startsWith('/booking/dropping')) cat = 'Dropping';
      else if (path.startsWith('/booking/rental')) cat = 'Rental';
      else if (path.startsWith('/booking/paket-barang')) cat = 'Paket Barang';
    }

    const supported = ['Reguler', 'Dropping', 'Rental', 'Paket Barang'];
    if (!cat || !supported.includes(cat)) return;

    setBookingData((prev) => ({
      ...prev,
      category: cat,

      // reset penting
      selectedSeats: [],
      passengerCount: cat === 'Reguler' ? 0 : 1,

      pickupLocations: [''],
      dropoffLocations: [''],
      pickupLocation: '',
      dropoffLocation: '',

      isNegotiated: false,
      negotiatedPrice: 0,

      // reset harga
      pricePerSeat: 0,
      totalAmount: 0,
      bookingId: null,

      // reset payment
      paymentMethod: '',
      paymentStatus: '',

      itemSize: 'Kecil',
    }));
    setStep(2);
  }, [location.pathname, location.search, toast]);

  // --- HELPERS & CALCULATIONS ---

  const isMainRoute = () => {
    const { from, to } = bookingData;
    return (
      (from === 'Rokan Hulu' && to === 'Pekanbaru') ||
      (from === 'Pekanbaru' && to === 'Rokan Hulu')
    );
  };

  const checkNegotiationNeeded = () => {
    if (bookingData.category === 'Rental') return true;
    if (bookingData.category === 'Dropping' && !isMainRoute()) return true;
    return false;
  };

  const calculatePackagePrice = (size) => {
    switch (size) {
      case 'Kecil':
        return 50000;
      case 'Sedang':
        return 75000;
      case 'Besar':
        return 150000;
      default:
        return 50000;
    }
  };

  const calculatePrice = () => {
    if (bookingData.isNegotiated) return parseFloat(bookingData.negotiatedPrice) || 0;

    if (bookingData.category === 'Reguler') {
      const seatCount = bookingData.selectedSeats.length;
      const capped = Math.min(seatCount, REGULER_MAX_PAX);
      const total = capped * REGULER_PRICE_PER_SEAT;
      return Math.min(total, REGULER_MAX_TOTAL);
    }

    if (bookingData.category === 'Dropping') {
      const hasMultipleStops =
        bookingData.pickupLocations.length > 1 || bookingData.dropoffLocations.length > 1;
      return hasMultipleStops ? 900000 : 750000;
    }

    if (bookingData.category === 'Paket Barang') {
      return calculatePackagePrice(bookingData.itemSize);
    }

    return 0;
  };

  const finalTotal = useMemo(() => {
    const backendTotal = Number(bookingData.totalAmount || 0);
    if (backendTotal > 0) return backendTotal;
    return calculatePrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bookingData.totalAmount,
    bookingData.isNegotiated,
    bookingData.negotiatedPrice,
    bookingData.category,
    bookingData.selectedSeats,
    bookingData.pickupLocations,
    bookingData.dropoffLocations,
    bookingData.itemSize,
  ]);

  // ✅ Persist snapshot setiap ada bookingId / status berubah (biar tidak balik ke awal)
  useEffect(() => {
    try {
      if (!bookingData.bookingId) return;
      localStorage.setItem(LS_LAST_BOOKING_ID, String(bookingData.bookingId));
      localStorage.setItem(
        LS_LAST_BOOKING_SNAPSHOT,
        JSON.stringify({
          category: bookingData.category,
          from: bookingData.from,
          to: bookingData.to,
          date: bookingData.date,
          time: bookingData.time,
          selectedSeats: bookingData.selectedSeats,
          passengerName: bookingData.passengerName,
          passengerPhone: bookingData.passengerPhone,
          pickupLocation: bookingData.pickupLocation,
          dropoffLocation: bookingData.dropoffLocation,
          totalAmount: bookingData.totalAmount || finalTotal,
          paymentMethod: bookingData.paymentMethod,
          paymentStatus: bookingData.paymentStatus,
          bookingId: bookingData.bookingId,
        })
      );
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bookingData.bookingId,
    bookingData.paymentStatus,
    bookingData.paymentMethod,
    bookingData.totalAmount,
    finalTotal,
  ]);

  // --- STATUS REFRESH (polling) ---
  const refreshPaymentStatus = useCallback(
    async (bookingId) => {
      if (!bookingId) return;

      // 1) Coba endpoint booking detail (kalau ada)
      try {
        const r = await fetch(`${API_URL}/api/reguler/bookings/${bookingId}`);
        if (r.ok) {
          const d = await r.json().catch(() => ({}));
          const nextStatus = d.paymentStatus || d.payment_status || '';
          const nextMethod = d.paymentMethod || d.payment_method || '';
          const nextTotal = Number(d.totalAmount || d.total || d.total_amount || 0);

          if (nextStatus || nextMethod || nextTotal) {
            setBookingData((prev) => {
              if (Number(prev.bookingId || 0) !== Number(bookingId)) return prev;
              return {
                ...prev,
                paymentStatus: nextStatus || prev.paymentStatus,
                paymentMethod: nextMethod || prev.paymentMethod,
                totalAmount: nextTotal > 0 ? nextTotal : prev.totalAmount,
              };
            });

            if (isLunas(nextStatus)) setShowInvoice(true);
          }
          return;
        }
      } catch {
        // continue fallback
      }

      // 2) Fallback: coba payment-validations?bookingId=...
      try {
        const r2 = await fetch(`${API_URL}/api/payment-validations?bookingId=${bookingId}`);
        if (r2.ok) {
          const d2 = await r2.json().catch(() => null);

          // support: object atau array
          const item = Array.isArray(d2)
            ? d2.find((x) => Number(x?.bookingId || x?.booking_id || 0) === Number(bookingId))
            : d2;

          if (item) {
            const raw = item.status || item.paymentStatus || item.payment_status || '';
            const normalized =
              String(raw).toLowerCase() === 'approved'
                ? 'Lunas'
                : String(raw).toLowerCase() === 'rejected'
                ? 'Ditolak'
                : String(raw) || '';

            if (normalized) {
              setBookingData((prev) => {
                if (Number(prev.bookingId || 0) !== Number(bookingId)) return prev;
                return { ...prev, paymentStatus: normalized || prev.paymentStatus };
              });

              if (isLunas(normalized)) setShowInvoice(true);
            }
          }
          return;
        }
      } catch {
        // ignore
      }

      // 3) Fallback terakhir: ambil semua payment-validations (kurang ideal tapi aman)
      try {
        const r3 = await fetch(`${API_URL}/api/payment-validations`);
        if (!r3.ok) return;

        const all = await r3.json().catch(() => []);
        if (!Array.isArray(all)) return;

        const item = all.find((x) => Number(x?.bookingId || x?.booking_id || 0) === Number(bookingId));
        if (!item) return;

        const raw = item.status || item.paymentStatus || item.payment_status || '';
        const normalized =
          String(raw).toLowerCase() === 'approved'
            ? 'Lunas'
            : String(raw).toLowerCase() === 'rejected'
            ? 'Ditolak'
            : String(raw) || '';

        if (normalized) {
          setBookingData((prev) => {
            if (Number(prev.bookingId || 0) !== Number(bookingId)) return prev;
            return { ...prev, paymentStatus: normalized || prev.paymentStatus };
          });
          if (isLunas(normalized)) setShowInvoice(true);
        }
      } catch {
        // ignore
      }
    },
    [setBookingData]
  );

  // ✅ Polling saat status "Menunggu Validasi"
  useEffect(() => {
    const id = Number(bookingData.bookingId || 0);
    if (!id) return;

    if (normalizePaymentStatus(bookingData.paymentStatus) !== 'Menunggu Validasi') return;

    // fetch langsung + interval
    refreshPaymentStatus(id);
    const t = setInterval(() => refreshPaymentStatus(id), 5000);
    return () => clearInterval(t);
  }, [bookingData.bookingId, bookingData.paymentStatus, refreshPaymentStatus]);

  // --- HANDLERS ---

  const handleCategorySelect = (cat) => {
    if (cat === 'PPOB') return navigate('/booking/pulsa');
    if (cat === 'Hotel') return navigate('/booking/hotel');
    if (cat === 'Airport') return navigate('/booking/airport');
    if (cat === 'RentalLepasKunci') return navigate('/booking/rental');

    setBookingData((prev) => ({
      ...prev,
      category: cat,
      selectedSeats: [],
      passengerCount: cat === 'Reguler' ? 0 : 1,
      pickupLocations: [''],
      dropoffLocations: [''],
      pickupLocation: '',
      dropoffLocation: '',
      isNegotiated: false,
      negotiatedPrice: 0,
      pricePerSeat: 0,
      totalAmount: 0,
      bookingId: null,

      paymentMethod: '',
      paymentStatus: '',

      itemSize: 'Kecil',
    }));
    setStep(2);
  };

  const handleLocationChange = (type, index, value) => {
    setBookingData((prev) => {
      const list = type === 'pickup' ? [...prev.pickupLocations] : [...prev.dropoffLocations];
      list[index] = value;

      if (type === 'pickup') return { ...prev, pickupLocations: list };
      return { ...prev, dropoffLocations: list };
    });
  };

  const addLocation = (type) => {
    const list = type === 'pickup' ? bookingData.pickupLocations : bookingData.dropoffLocations;
    if (list.length >= 5) {
      toast({
        title: 'Limit Reached',
        description: 'Maximum 5 locations allowed.',
        variant: 'destructive',
      });
      return;
    }
    setBookingData((prev) => {
      const base = type === 'pickup' ? prev.pickupLocations : prev.dropoffLocations;
      const newList = [...base, ''];
      if (type === 'pickup') return { ...prev, pickupLocations: newList };
      return { ...prev, dropoffLocations: newList };
    });
  };

  const removeLocation = (type, index) => {
    const list = type === 'pickup' ? bookingData.pickupLocations : bookingData.dropoffLocations;
    if (list.length <= 1) return;

    setBookingData((prev) => {
      const base = type === 'pickup' ? prev.pickupLocations : prev.dropoffLocations;
      const newList = base.filter((_, i) => i !== index);
      if (type === 'pickup') return { ...prev, pickupLocations: newList };
      return { ...prev, dropoffLocations: newList };
    });
  };

  const handleSeatSelect = (seat) => {
    const isSelected = bookingData.selectedSeats.includes(seat);
    const newSeats = isSelected
      ? bookingData.selectedSeats.filter((s) => s !== seat)
      : [...bookingData.selectedSeats, seat];

    if (!isSelected && newSeats.length > REGULER_MAX_PAX) {
      toast({
        title: 'Limit Reached',
        description: `Maksimal ${REGULER_MAX_PAX} seat untuk Reguler.`,
        variant: 'destructive',
      });
      return;
    }

    setBookingData((prev) => ({
      ...prev,
      selectedSeats: newSeats,
      passengerCount: newSeats.length,
      pricePerSeat: REGULER_PRICE_PER_SEAT,

      // reset backend total & bookingId kalau seat berubah
      totalAmount: 0,
      bookingId: null,

      // reset payment kalau seat berubah
      paymentMethod: '',
      paymentStatus: '',
    }));
  };

  const validateStep2 = () => {
    if (!bookingData.date) return 'Please select a date';

    if (bookingData.category === 'Reguler') {
      if (bookingData.selectedSeats.length === 0) return 'Please select at least one seat';
      if (bookingData.selectedSeats.length > REGULER_MAX_PAX)
        return `Maximum ${REGULER_MAX_PAX} seats allowed for Reguler.`;

      if (!bookingData.passengerName?.trim()) return 'Nama penumpang wajib diisi';
      if (!bookingData.pickupLocation?.trim()) return 'Lokasi penjemputan wajib diisi';
      if (!bookingData.dropoffLocation?.trim()) return 'Lokasi pengantaran wajib diisi';
    }

    if (bookingData.category === 'Dropping') {
      if (bookingData.passengerCount > 7) return 'Maximum 7 passengers allowed for Dropping.';
      if (bookingData.pickupLocations.some((l) => !l.trim())) return 'Please fill all pickup locations.';
      if (bookingData.dropoffLocations.some((l) => !l.trim())) return 'Please fill all dropoff locations.';
    }

    if (bookingData.category === 'Rental') {
      if (!bookingData.rentalDuration) return 'Please enter duration.';
      if (!bookingData.pickupLocations[0]) return 'Please enter pickup location.';
      if (!bookingData.dropoffLocations[0]) return 'Please enter destination.';
    }

    if (bookingData.category === 'Paket Barang') {
      if (!bookingData.senderName) return 'Nama Pengirim wajib diisi';
      if (!bookingData.senderPhone) return 'No HP Pengirim wajib diisi';
      if (!bookingData.senderAddress) return 'Alamat Pengirim wajib diisi';
      if (!bookingData.receiverName) return 'Nama Penerima wajib diisi';
      if (!bookingData.receiverPhone) return 'No HP Penerima wajib diisi';
      if (!bookingData.receiverAddress) return 'Alamat Penerima wajib diisi';
      if (!bookingData.itemName) return 'Nama Barang wajib diisi';
    }

    return null;
  };

  // ✅ onNext dari RegulerStep akan memanggil function ini (dengan result booking)
  const handleContinueFromStep2 = (result) => {
    const error = validateStep2();
    if (error) {
      toast({
        title: 'Validation Error',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    // kalau RegulerStep sudah bikin booking, pastikan bookingId terset
    if (result && typeof result === 'object' && result.bookingId) {
      setBookingData((prev) => ({
        ...prev,
        bookingId: result.bookingId,
        totalAmount: Number(result.total ?? result.totalAmount ?? prev.totalAmount ?? 0),
        paymentStatus: result.paymentStatus || prev.paymentStatus || 'Belum Bayar',
        paymentMethod: result.paymentMethod || prev.paymentMethod || '',
      }));
    }

    if (bookingData.category === 'Paket Barang') {
      setBookingData((prev) => ({
        ...prev,
        passengerName: prev.senderName,
        passengerPhone: prev.senderPhone,
      }));
    }

    if (checkNegotiationNeeded()) setStep('negotiation');
    else setStep(3);
  };

  const handleNegotiationComplete = () => {
    if (!bookingData.negotiatedPrice || bookingData.negotiatedPrice <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter the agreed price from WhatsApp negotiation.',
        variant: 'destructive',
      });
      return;
    }
    setBookingData((prev) => ({ ...prev, isNegotiated: true }));
    setStep(3);
  };

  /**
   * ✅ Payment Flow baru:
   * payload bisa string (lama) atau object (baru):
   * { method: "cash|transfer|qris", paymentStatus: "Lunas|Menunggu Validasi" }
   */
  const handlePaymentComplete = (payload) => {
    let method = '';
    let status = '';

    if (typeof payload === 'string') {
      method = payload;
      status = payload === 'cash' ? 'Lunas' : 'Menunggu Validasi';
    } else if (payload && typeof payload === 'object') {
      method = payload.method || '';
      status = payload.paymentStatus || '';
      if (!status) status = method === 'cash' ? 'Lunas' : 'Menunggu Validasi';
    }

    setBookingData((prev) => ({
      ...prev,
      paymentMethod: method,
      paymentStatus: status,
    }));

    setShowPayment(false);

    if (isLunas(status)) {
      setShowInvoice(true);
      toast({
        title: 'Success!',
        description: 'Pembayaran lunas. E-ticket & invoice sudah aktif.',
      });
    } else {
      setShowInvoice(false);
      toast({
        title: 'Menunggu Validasi',
        description: 'Bukti pembayaran terkirim. Admin akan memvalidasi sebelum E-ticket & invoice muncul.',
      });
      // start refresh (langsung)
      if (bookingData.bookingId) refreshPaymentStatus(Number(bookingData.bookingId));
    }

    // simpan ringkas di localStorage juga
    try {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const newBooking = {
        id: `BK${Date.now()}`,
        ...bookingData,
        backendBookingId: bookingData.bookingId,
        pickupAddress:
          bookingData.category === 'Reguler'
            ? bookingData.pickupLocation
            : bookingData.category === 'Paket Barang'
            ? bookingData.senderAddress
            : bookingData.pickupLocations.join(' -> '),
        dropoffAddress:
          bookingData.category === 'Reguler'
            ? bookingData.dropoffLocation
            : bookingData.category === 'Paket Barang'
            ? bookingData.receiverAddress
            : bookingData.dropoffLocations.join(' -> '),

        paymentMethod: method,
        paymentStatus: status,
        status: isLunas(status) ? 'Confirmed' : 'Pending Validation',
        createdAt: new Date().toISOString(),
        totalAmount: finalTotal,
        negotiationStatus: bookingData.isNegotiated ? 'Negotiated' : 'Fixed',
      };

      bookings.push(newBooking);
      localStorage.setItem('bookings', JSON.stringify(bookings));
    } catch {
      // ignore
    }
  };

  const categories = [
    { id: 'Reguler', icon: Users, label: 'Reguler', desc: 'Point to Point / Pool to Pool', price: 'Rp 150.000' },
    { id: 'Dropping', icon: MapPin, label: 'Dropping', desc: 'Private Charter (Max 7 Pax)', price: 'Rp 750.000' },
    { id: 'Rental', icon: Key, label: 'Rental Harian', desc: 'Full Car Charter (Daily)', price: 'Rp 900.000+' },
    { id: 'Paket Barang', icon: Package, label: 'Paket Barang', desc: 'Door-to-door Delivery Service', price: 'Rp 50.000' },
    { id: 'PPOB', icon: Smartphone, label: 'Top Up & Tagihan', desc: 'Pulsa, PLN, Data, E-Wallet', price: 'Mulai Rp 1.000' },
    { id: 'Hotel', icon: HotelIcon, label: 'Hotel Booking', desc: 'Comfortable Stays & Deals', price: 'Best Prices' },
    { id: 'Airport', icon: PlaneLanding, label: 'Airport Transfer', desc: 'Airport Shuttle Service', price: 'Fixed Rates' },
    { id: 'RentalLepasKunci', icon: Key, label: 'Rental Lepas Kunci', desc: 'Self-drive Car Rental', price: 'Flexible' },
  ];

  return (
    <DashboardLayout>
      <Helmet>
        <title>Booking - LAKUTRAND App</title>
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <img
              src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg"
              alt="Logo"
              className="w-12 h-12 rounded-full shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">Booking Service</h1>
              <p className="text-gray-400">
                {step === 1 && 'Step 1: Select Service Type'}
                {step === 2 && 'Step 2: Details & Route'}
                {step === 'negotiation' && 'Step 2.5: Price Negotiation'}
                {step === 3 && 'Step 3: Contact Confirmation'}
                {step === 4 && 'Step 4: Review & Payment'}
              </p>

              {/* ✅ tampilkan status kalau ada booking terakhir */}
              {bookingData.bookingId ? (
                <p className="text-sm text-gray-300 mt-1">
                  Booking ID: <b className="text-yellow-400">{bookingData.bookingId}</b>{' '}
                  {bookingData.paymentStatus ? (
                    <>
                      • Status: <b className="text-yellow-400">{bookingData.paymentStatus}</b>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>

          {/* tombol manual refresh status */}
          {bookingData.bookingId ? (
            <Button
              variant="outline"
              className="border-gray-600"
              onClick={() => refreshPaymentStatus(Number(bookingData.bookingId))}
            >
              Refresh Status
            </Button>
          ) : null}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 hover:border-yellow-500 rounded-2xl p-6 text-left transition-all group relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Icon className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-yellow-500 transition-colors">
                        <Icon className="w-6 h-6 text-yellow-500 group-hover:text-slate-900 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{cat.label}</h3>
                      <p className="text-gray-400 mb-4 text-sm flex-1">{cat.desc}</p>
                      <div className="text-lg font-bold text-yellow-400">{cat.price}</div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && bookingData.category === 'Reguler' && (
            <RegulerStep
              bookingData={bookingData}
              setBookingData={setBookingData}
              handleSeatSelect={handleSeatSelect}
              finalTotal={finalTotal}
              onBack={() => setStep(1)}
              onNext={handleContinueFromStep2} // ✅ menerima result booking dari RegulerStep
            />
          )}

          {step === 2 && (bookingData.category === 'Dropping' || bookingData.category === 'Rental') && (
            <DroppingStep
              bookingData={bookingData}
              setBookingData={setBookingData}
              handleLocationChange={handleLocationChange}
              addLocation={addLocation}
              removeLocation={removeLocation}
              calculatePrice={calculatePrice}
              finalTotal={finalTotal}
              onBack={() => setStep(1)}
              onNext={handleContinueFromStep2}
            />
          )}

          {step === 2 && bookingData.category === 'Paket Barang' && (
            <PaketBarangStep
              bookingData={bookingData}
              setBookingData={setBookingData}
              calculatePackagePrice={calculatePackagePrice}
              finalTotal={finalTotal}
              onBack={() => setStep(1)}
              onNext={handleContinueFromStep2}
            />
          )}

          {/* NEGOTIATION */}
          {step === 'negotiation' && (
            <motion.div
              key="negotiation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-slate-800 rounded-xl border-2 border-yellow-500 p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Price Negotiation Required</h2>
                  <p className="text-gray-400">
                    For <strong>{bookingData.category}</strong> on this route, please negotiate the final price with our admin via WhatsApp.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <a
                    href="https://wa.me/6282364210642"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-bold transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" /> Admin Pekanbaru
                  </a>
                  <a
                    href="https://wa.me/6282364210642"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-bold transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" /> Admin Rokan Hulu
                  </a>
                </div>

                <div className="bg-slate-900 p-6 rounded-xl border border-gray-700 mb-8">
                  <label className="text-gray-300 mb-2 block">Enter Agreed Deal Price (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">Rp</span>
                    <input
                      type="number"
                      placeholder="e.g. 850000"
                      value={bookingData.negotiatedPrice}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, negotiatedPrice: e.target.value }))}
                      className="w-full pl-12 bg-slate-800 border border-gray-600 text-white h-12 text-lg font-bold rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-gray-600">
                    Back
                  </Button>
                  <Button
                    onClick={handleNegotiationComplete}
                    className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold h-12"
                  >
                    Proceed to Booking
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Briefcase className="text-yellow-400" />
                  {bookingData.category === 'Paket Barang' ? 'Confirm Sender Contact' : 'Contact Details'}
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="text-gray-300 mb-2 block">
                      {bookingData.category === 'Paket Barang' ? 'Sender Name (Booker)' : 'Full Name (Booker)'}
                    </label>
                    <input
                      value={bookingData.passengerName}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, passengerName: e.target.value }))}
                      className="w-full bg-slate-900 border border-gray-600 text-white h-12 rounded-lg px-3 outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 mb-2 block">WhatsApp Number</label>
                    <input
                      value={bookingData.passengerPhone}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, passengerPhone: e.target.value }))}
                      className="w-full bg-slate-900 border border-gray-600 text-white h-12 rounded-lg px-3 outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="e.g. 08123456789"
                    />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 items-start">
                    <CheckCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-200">
                      We will send the {bookingData.category === 'Paket Barang' ? 'delivery receipt' : 'e-ticket'} and updates to this WhatsApp number.
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setStep(bookingData.isNegotiated ? 'negotiation' : 2)}
                    className="w-1/3 border-gray-600"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (!bookingData.passengerName || !bookingData.passengerPhone) {
                        toast({
                          title: 'Required',
                          description: 'Please fill in all fields',
                          variant: 'destructive',
                        });
                        return;
                      }
                      setStep(4);
                    }}
                    className="w-2/3 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold h-12"
                  >
                    Review & Pay
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">Final Review</h2>

                <div className="space-y-4 mb-8">
                  <div className="bg-slate-900 p-6 rounded-lg border border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase">
                      {bookingData.category}
                    </div>

                    <div className="mb-6">
                      <p className="text-gray-400 text-sm mb-1">Route</p>
                      <div className="flex items-center gap-3 text-white font-bold text-lg">
                        <span>{bookingData.from}</span>
                        <span className="text-yellow-500">→</span>
                        <span>{bookingData.to}</span>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        {bookingData.date} at {bookingData.time}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-800 pt-4">
                      <div>
                        <p className="text-gray-500">Booker / Sender</p>
                        <p className="text-white font-medium">{bookingData.passengerName}</p>
                        <p className="text-gray-500 text-xs">{bookingData.passengerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">Total Cost</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          Rp {Number(finalTotal || 0).toLocaleString()}
                        </p>
                        {bookingData.isNegotiated && (
                          <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded border border-green-800">
                            Negotiated Deal
                          </span>
                        )}
                      </div>
                    </div>

                    {(bookingData.category === 'Dropping' || bookingData.category === 'Rental') && (
                      <div className="mt-4 bg-slate-800 p-3 rounded border border-slate-700 text-xs text-gray-400">
                        <p className="font-bold text-gray-300 mb-1">Locations:</p>
                        <p>Pickup: {bookingData.pickupLocations.join(', ')}</p>
                        <p>Dropoff: {bookingData.dropoffLocations.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  {bookingData.category === 'Rental' && (
                    <div className="flex items-start gap-3 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      <p className="text-sm text-red-200">
                        Reminder: Fuel (BBM), Driver Meals, Tolls, and Accommodations are NOT included in this price and must be paid by the customer during the trip.
                      </p>
                    </div>
                  )}
                </div>

                {bookingData.bookingId ? (
                  <div className="mb-4 text-sm text-gray-300">
                    Booking ID: <b className="text-yellow-400">{bookingData.bookingId}</b>
                    {bookingData.paymentStatus ? (
                      <>
                        {' '}
                        • Status Pembayaran:{' '}
                        <b className="text-yellow-400">{bookingData.paymentStatus}</b>
                      </>
                    ) : null}
                    {normalizePaymentStatus(bookingData.paymentStatus) === 'Menunggu Validasi' ? (
                      <div className="mt-2 text-xs text-gray-400">
                        *Status akan otomatis diperbarui setelah admin Approve/Reject.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mb-4 text-sm text-red-200">
                    *Booking ID belum ada. Pastikan booking dibuat di Step 2 (Reguler) sebelum bayar.
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(3)} className="w-1/3 border-gray-600">
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (!bookingData.bookingId) {
                        toast({
                          title: 'Booking belum dibuat',
                          description: 'Kembali ke Step 2 untuk membuat booking dulu.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      setShowPayment(true);
                    }}
                    className="w-2/3 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold h-12"
                  >
                    Proceed to Payment
                  </Button>
                </div>

                {/* ✅ tombol buka invoice jika sudah lunas */}
                {bookingData.bookingId && isLunas(bookingData.paymentStatus) ? (
                  <div className="mt-4">
                    <Button
                      onClick={() => setShowInvoice(true)}
                      className="w-full bg-green-500 hover:bg-green-600 text-slate-900 font-bold h-12"
                    >
                      Buka Invoice / E-ticket
                    </Button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={finalTotal}
        bookingId={bookingData.bookingId} // ✅ penting
        onPaymentComplete={handlePaymentComplete}
      />

      <InvoiceModal
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        bookingData={{
          ...bookingData,
          totalAmount: finalTotal,
          pickupAddress:
            bookingData.category === 'Reguler'
              ? bookingData.pickupLocation
              : bookingData.category === 'Paket Barang'
              ? bookingData.senderAddress
              : bookingData.pickupLocations.join(' | '),
          dropoffAddress:
            bookingData.category === 'Reguler'
              ? bookingData.dropoffLocation
              : bookingData.category === 'Paket Barang'
              ? bookingData.receiverAddress
              : bookingData.dropoffLocations.join(' | '),
        }}
      />
    </DashboardLayout>
  );
};

export default BookingPage;
