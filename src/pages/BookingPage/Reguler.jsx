// src/pages/BookingPage/Reguler.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, RefreshCw } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SeatSelection from '@/components/SeatSelection';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// fallback jam kalau backend belum punya endpoint time list
const FALLBACK_TIMES = ['08:00 WIB', '10:00 WIB', '14:00 WIB', '16:00 WIB', '20:00 WIB'];
const MAX_PAX = 6;

// localStorage keys (persist booking agar tidak balik ke awal)
const LS_LAST_BOOKING_ID = 'lastRegulerBookingId';
const LS_LAST_BOOKING_SNAPSHOT = 'lastRegulerBookingSnapshot';

const normalizeTimeToHHMM = (t) => {
  const s = String(t || '').trim();
  if (!s) return '';
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return s;
  const hh = String(m[1]).padStart(2, '0');
  return `${hh}:${m[2]}`;
};

const RegulerStep = (props) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    bookingData: externalBookingData,
    setBookingData: externalSetBookingData,
    handleSeatSelect: externalHandleSeatSelect,
    onBack: externalOnBack,
    onNext: externalOnNext,
  } = props;

  // local fallback (kalau komponen ini dipakai mandiri)
  const [localBookingData, setLocalBookingData] = useState({
    category: 'Reguler',
    from: '',
    to: '',
    date: '',
    time: '08:00 WIB',

    bookingFor: 'self', // "self" | "other"
    passengerName: '', // nama pemesan (booker)
    passengerPhone: '', // no hp pemesan (1 nomor)

    pickupLocation: '',
    dropoffLocation: '',

    selectedSeats: [],
    passengerCount: 0,

    // backend-driven pricing
    pricePerSeat: 0,
    totalAmount: 0,
    routeLabel: '',
    bookingId: null,

    // payment
    paymentMethod: '',
    paymentStatus: '',

    // nama penumpang per seat
    passengers: [], // [{seat, name}]
  });

  const bookingData = externalBookingData || localBookingData;

  // updater aman (support parent state atau local)
  const updateBookingData = (updater) => {
    if (externalSetBookingData) {
      externalSetBookingData((prev) => {
        const base = prev ?? bookingData;
        return typeof updater === 'function' ? updater(base) : updater;
      });
    } else {
      setLocalBookingData((prev) => {
        const base = prev ?? bookingData;
        return typeof updater === 'function' ? updater(base) : updater;
      });
    }
  };

  const setField = (key, value) => {
    updateBookingData((prev) => ({ ...prev, [key]: value }));
  };

  // ====== Backend-driven data ======
  const [stops, setStops] = useState([]); // [{key, display}]
  const [timeOptions] = useState(FALLBACK_TIMES);
  const [bookedSeats, setBookedSeats] = useState([]); // ["A1","A2"...]
  const [quote, setQuote] = useState({ pricePerSeat: 0, total: 0, route: '' });

  const [isLoadingStops, setIsLoadingStops] = useState(false);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const seatCount = bookingData?.selectedSeats?.length || 0;

  const stopDisplays = useMemo(() => stops.map((s) => s.display), [stops]);
  const stopDisplaySet = useMemo(() => new Set(stopDisplays), [stopDisplays]);

  const pickDefaultFrom = (list) => {
    const pasir = list.find((x) => String(x.display).toLowerCase() === 'pasir pengaraian');
    if (pasir) return pasir.display;

    const pku = list.find((x) => String(x.display).toLowerCase() === 'pekanbaru');
    if (pku) return pku.display;

    return list[0]?.display || '';
  };

  const pickDefaultTo = (list, fromValue) => {
    const firstDifferent = list.find((x) => x.display !== fromValue);
    return firstDifferent?.display || '';
  };

  const resetSeatAndQuote = () => {
    updateBookingData((prev) => ({
      ...prev,
      selectedSeats: [],
      passengers: [],
      passengerCount: 0,
      pricePerSeat: 0,
      totalAmount: 0,
      routeLabel: '',
      bookingId: null,

      // reset payment kalau schedule berubah
      paymentMethod: '',
      paymentStatus: '',
    }));
    setQuote({ pricePerSeat: 0, total: 0, route: '' });
  };

  // ====== Fetch stops ======
  useEffect(() => {
    let isMounted = true;

    async function loadStops() {
      try {
        setIsLoadingStops(true);
        const res = await fetch(`${API_URL}/api/reguler/stops`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || `Gagal load stops (HTTP ${res.status})`);

        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.stops)) list = data.stops;

        const normalized = list
          .map((x) => {
            if (typeof x === 'string') return { key: x, display: x };
            return {
              key: x?.key || x?.name || x?.display || '',
              display: x?.display || x?.name || x?.key || '',
            };
          })
          .filter((x) => x.key && x.display);

        if (!isMounted) return;

        setStops(normalized);

        // pastikan from/to selalu valid
        updateBookingData((prev) => {
          const listDisplays = new Set(normalized.map((x) => x.display));

          let nextFrom = prev.from || '';
          let nextTo = prev.to || '';

          const defaultFrom = pickDefaultFrom(normalized);

          if (!nextFrom || !listDisplays.has(nextFrom)) nextFrom = defaultFrom;

          if (!nextTo || !listDisplays.has(nextTo) || nextTo === nextFrom) {
            nextTo = pickDefaultTo(normalized, nextFrom);
          }

          return { ...prev, from: nextFrom, to: nextTo };
        });
      } catch (e) {
        toast({
          title: 'Gagal Load Rute',
          description: e?.message || 'Tidak bisa mengambil daftar rute dari backend.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingStops(false);
      }
    }

    loadStops();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // guard: stops berubah
  useEffect(() => {
    if (!stops.length) return;

    updateBookingData((prev) => {
      let nextFrom = prev.from || '';
      let nextTo = prev.to || '';

      const defaultFrom = pickDefaultFrom(stops);

      if (!nextFrom || !stopDisplaySet.has(nextFrom)) nextFrom = defaultFrom;
      if (!nextTo || !stopDisplaySet.has(nextTo) || nextTo === nextFrom) {
        nextTo = pickDefaultTo(stops, nextFrom);
      }

      if (nextFrom === prev.from && nextTo === prev.to) return prev;
      return { ...prev, from: nextFrom, to: nextTo };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopDisplaySet, stops]);

  // Sync passengerCount = seatCount
  useEffect(() => {
    updateBookingData((prev) => {
      if (prev.passengerCount === seatCount) return prev;
      return { ...prev, passengerCount: seatCount };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatCount]);

  // Keep passengers[] aligned with selectedSeats
  useEffect(() => {
    updateBookingData((prev) => {
      const selected = (prev.selectedSeats || [])
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean);

      const current = Array.isArray(prev.passengers) ? prev.passengers : [];
      const map = new Map(
        current.map((p) => [String(p.seat || '').trim().toUpperCase(), String(p.name || '')])
      );

      const nextPassengers = selected.map((seat) => ({
        seat,
        name: map.get(seat) || '',
      }));

      // self: prefill seat pertama dengan nama pemesan
      if (prev.bookingFor === 'self' && nextPassengers.length >= 1) {
        const bookerName = String(prev.passengerName || '').trim();
        if (bookerName && !nextPassengers[0].name) {
          nextPassengers[0] = { seat: nextPassengers[0].seat, name: bookerName };
        }
      }

      const same =
        nextPassengers.length === current.length &&
        nextPassengers.every((p, i) => {
          const c = current[i];
          return (
            String(c?.seat || '').trim().toUpperCase() === p.seat &&
            String(c?.name || '').trim() === String(p.name || '').trim()
          );
        });

      if (same) return prev;
      return { ...prev, passengers: nextPassengers };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.selectedSeats, bookingData.bookingFor, bookingData.passengerName]);

  // Fetch booked seats when route/time/date changes
  useEffect(() => {
    let isMounted = true;

    async function loadBookedSeats() {
      const from = bookingData.from?.trim();
      const to = bookingData.to?.trim();
      const date = bookingData.date?.trim();
      const time = normalizeTimeToHHMM(bookingData.time);

      if (!from || !to || !date || !time) {
        setBookedSeats([]);
        return;
      }

      try {
        setIsLoadingSeats(true);
        const qs = new URLSearchParams({ from, to, date, time });
        const res = await fetch(`${API_URL}/api/reguler/seats?${qs.toString()}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || `Gagal load seats (HTTP ${res.status})`);

        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.bookedSeats)) list = data.bookedSeats;
        else if (Array.isArray(data?.seats)) list = data.seats;

        const normalized = list.map((s) => String(s).trim().toUpperCase()).filter(Boolean);

        if (!isMounted) return;
        setBookedSeats(normalized);
      } catch (e) {
        toast({
          title: 'Gagal Load Seat',
          description: e?.message || 'Tidak bisa mengambil status seat dari backend.',
          variant: 'destructive',
        });
        setBookedSeats([]);
      } finally {
        setIsLoadingSeats(false);
      }
    }

    loadBookedSeats();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.from, bookingData.to, bookingData.date, bookingData.time]);

  // Fetch quote whenever route/time/date/selectedSeats changes
  useEffect(() => {
    let isMounted = true;

    async function loadQuote() {
      const from = bookingData.from?.trim();
      const to = bookingData.to?.trim();
      const date = bookingData.date?.trim();
      const time = normalizeTimeToHHMM(bookingData.time);
      const selectedSeats = (bookingData.selectedSeats || [])
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean);

      if (!from || !to || !date || !time || selectedSeats.length === 0) {
        setQuote({ pricePerSeat: 0, total: 0, route: '' });
        updateBookingData((prev) => ({ ...prev, pricePerSeat: 0, totalAmount: 0, routeLabel: '' }));
        return;
      }

      try {
        setIsLoadingQuote(true);
        const res = await fetch(`${API_URL}/api/reguler/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'Reguler',
            from,
            to,
            date,
            time, // ✅ HH:mm
            selectedSeats,
            passengerCount: selectedSeats.length,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `Gagal ambil quote (HTTP ${res.status})`);

        const next = {
          pricePerSeat: Number(data?.pricePerSeat || 0),
          total: Number(data?.total || 0),
          route: String(data?.route || ''),
        };

        if (!isMounted) return;
        setQuote(next);

        updateBookingData((prev) => ({
          ...prev,
          pricePerSeat: next.pricePerSeat,
          totalAmount: next.total,
          routeLabel: next.route,
        }));
      } catch (e) {
        if (!isMounted) return;

        setQuote({ pricePerSeat: 0, total: 0, route: '' });
        updateBookingData((prev) => ({ ...prev, pricePerSeat: 0, totalAmount: 0, routeLabel: '' }));

        toast({
          title: 'Tarif Tidak Tersedia',
          description: e?.message || 'Tarif untuk rute ini belum tersedia.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingQuote(false);
      }
    }

    loadQuote();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.from, bookingData.to, bookingData.date, bookingData.time, bookingData.selectedSeats]);

  // Seat select
  const handleSeatSelect = (seatId) => {
    const seat = String(seatId || '').trim().toUpperCase();
    if (!seat) return;

    if (bookedSeats.includes(seat)) {
      toast({
        title: 'Seat Tidak Tersedia',
        description: 'Seat ini sudah dibooking, pilih seat lain.',
        variant: 'destructive',
      });
      return;
    }

    const selected = (bookingData.selectedSeats || []).map((s) => String(s).trim().toUpperCase());
    const alreadySelected = selected.includes(seat);

    if (!alreadySelected && selected.length >= MAX_PAX) {
      toast({
        title: 'Limit Seat',
        description: `Maksimal ${MAX_PAX} seat untuk Reguler.`,
        variant: 'destructive',
      });
      return;
    }

    if (externalHandleSeatSelect) {
      externalHandleSeatSelect(seat);
      return;
    }

    updateBookingData((prev) => {
      const prevSelected = (prev.selectedSeats || []).map((s) => String(s).trim().toUpperCase());
      const isSelected = prevSelected.includes(seat);
      const newSeats = isSelected ? prevSelected.filter((s) => s !== seat) : [...prevSelected, seat];
      return { ...prev, selectedSeats: newSeats };
    });
  };

  // Swap Origin/Destination
  const handleSwapRoute = () => {
    updateBookingData((prev) => {
      const nextFrom = prev.to;
      const nextTo = prev.from;

      const safeFrom = stopDisplaySet.has(nextFrom) ? nextFrom : pickDefaultFrom(stops);
      const safeTo =
        stopDisplaySet.has(nextTo) && nextTo !== safeFrom ? nextTo : pickDefaultTo(stops, safeFrom);

      return {
        ...prev,
        from: safeFrom,
        to: safeTo,
        selectedSeats: [],
        passengers: [],
        passengerCount: 0,
        pricePerSeat: 0,
        totalAmount: 0,
        routeLabel: '',
        bookingId: null,
        paymentMethod: '',
        paymentStatus: '',
      };
    });
    setQuote({ pricePerSeat: 0, total: 0, route: '' });
  };

  const showPassengerNamesList = useMemo(() => {
    if (bookingData.bookingFor === 'other') return seatCount > 0;
    return seatCount > 1;
  }, [bookingData.bookingFor, seatCount]);

  const onBack =
    externalOnBack ||
    (() => {
      navigate('/booking');
    });

  const basicValid =
    Boolean(bookingData?.passengerName?.trim()) &&
    Boolean(bookingData?.passengerPhone?.trim()) &&
    Boolean(bookingData?.pickupLocation?.trim()) &&
    Boolean(bookingData?.dropoffLocation?.trim()) &&
    Boolean(bookingData?.from?.trim()) &&
    Boolean(bookingData?.to?.trim()) &&
    Boolean(bookingData?.date) &&
    Boolean(bookingData?.time);

  const seatValid = seatCount > 0 && seatCount <= MAX_PAX;

  const passengerNamesValid = useMemo(() => {
    if (!showPassengerNamesList) return seatCount === 1 ? Boolean(bookingData?.passengerName?.trim()) : true;

    const arr = Array.isArray(bookingData.passengers) ? bookingData.passengers : [];
    if (arr.length !== seatCount) return false;
    return arr.every((p) => String(p?.seat || '').trim() && String(p?.name || '').trim());
  }, [bookingData.passengerName, bookingData.passengers, seatCount, showPassengerNamesList]);

  const quoteValid = Number(bookingData.totalAmount || 0) > 0 && Number(bookingData.pricePerSeat || 0) > 0;

  const canProceed = basicValid && seatValid && passengerNamesValid && quoteValid && !isSubmitting;

  async function submitBooking(payload) {
    const res = await fetch(`${API_URL}/api/reguler/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || `Gagal (HTTP ${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  const handleNext = async () => {
    setSubmitError('');

    if (!canProceed) {
      setSubmitError('Lengkapi data, pilih seat, dan pastikan tarif sudah muncul dari backend sebelum lanjut.');
      return;
    }

    const from = bookingData.from?.trim();
    const to = bookingData.to?.trim();
    const date = bookingData.date?.trim();
    const time = normalizeTimeToHHMM(bookingData.time);
    const selectedSeats = (bookingData.selectedSeats || [])
      .map((s) => String(s).trim().toUpperCase())
      .filter(Boolean);

    let passengersToSend = [];
    if (bookingData.bookingFor === 'self' && seatCount === 1) {
      passengersToSend = [{ seat: selectedSeats[0], name: String(bookingData.passengerName || '').trim() }];
    } else {
      passengersToSend = (bookingData.passengers || []).map((p) => ({
        seat: String(p.seat || '').trim().toUpperCase(),
        name: String(p.name || '').trim(),
      }));
    }

    const payload = {
      category: 'Reguler',
      from,
      to,
      date,
      time, // ✅ HH:mm

      passengerName: String(bookingData.passengerName || '').trim(),
      passengerPhone: String(bookingData.passengerPhone || '').trim(),
      bookingFor: bookingData.bookingFor || '',

      passengerCount: selectedSeats.length,
      pickupLocation: String(bookingData.pickupLocation || '').trim(),
      dropoffLocation: String(bookingData.dropoffLocation || '').trim(),

      selectedSeats,
      passengers: passengersToSend,
    };

    try {
      setIsSubmitting(true);

      const result = await submitBooking(payload);

      const nextBookingId = result.bookingId ?? bookingData.bookingId ?? null;
      const nextTotal = Number(result.total ?? result.totalAmount ?? bookingData.totalAmount ?? 0);
      const nextPricePerSeat = Number(result.pricePerSeat ?? bookingData.pricePerSeat ?? 0);
      const nextRoute = String(result.route ?? bookingData.routeLabel ?? '');
      const nextPaymentStatus = String(result.paymentStatus || bookingData.paymentStatus || 'Belum Bayar');
      const nextPaymentMethod = String(result.paymentMethod || bookingData.paymentMethod || '');

      updateBookingData((prev) => ({
        ...prev,
        bookingId: nextBookingId,
        pricePerSeat: nextPricePerSeat,
        totalAmount: nextTotal,
        routeLabel: nextRoute,
        passengerCount: Number(result.passengerCount ?? prev.passengerCount ?? selectedSeats.length),

        paymentStatus: nextPaymentStatus,
        paymentMethod: nextPaymentMethod,
      }));

      // ✅ Persist booking context agar tidak balik ke awal
      try {
        if (nextBookingId) localStorage.setItem(LS_LAST_BOOKING_ID, String(nextBookingId));
        const snap = {
          category: 'Reguler',
          from,
          to,
          date,
          time,
          selectedSeats,
          passengerName: String(bookingData.passengerName || '').trim(),
          passengerPhone: String(bookingData.passengerPhone || '').trim(),
          pickupLocation: String(bookingData.pickupLocation || '').trim(),
          dropoffLocation: String(bookingData.dropoffLocation || '').trim(),
          totalAmount: nextTotal,
          pricePerSeat: nextPricePerSeat,
          routeLabel: nextRoute,
          bookingId: nextBookingId,
          paymentStatus: nextPaymentStatus,
          paymentMethod: nextPaymentMethod,
        };
        localStorage.setItem(LS_LAST_BOOKING_SNAPSHOT, JSON.stringify(snap));
      } catch {
        // ignore
      }

      if (externalOnNext) {
        externalOnNext(result);
        return;
      }

      navigate(`/booking/reguler/eticket/${nextBookingId}`);
    } catch (e) {
      if (e?.status === 409) {
        setSubmitError(e.message || 'Seat sudah dibooking orang lain, pilih seat lain.');
      } else {
        setSubmitError(e.message || 'Gagal membuat booking.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeFrom = (value) => {
    updateBookingData((prev) => {
      const nextFrom = value;
      let nextTo = prev.to;

      if (!nextTo || nextTo === nextFrom || !stopDisplaySet.has(nextTo)) {
        nextTo = pickDefaultTo(stops, nextFrom);
      }

      return {
        ...prev,
        from: nextFrom,
        to: nextTo,
        selectedSeats: [],
        passengers: [],
        passengerCount: 0,
        pricePerSeat: 0,
        totalAmount: 0,
        routeLabel: '',
        bookingId: null,
        paymentMethod: '',
        paymentStatus: '',
      };
    });
    setQuote({ pricePerSeat: 0, total: 0, route: '' });
  };

  const handleChangeTo = (value) => {
    updateBookingData((prev) => ({
      ...prev,
      to: value,
      selectedSeats: [],
      passengers: [],
      passengerCount: 0,
      pricePerSeat: 0,
      totalAmount: 0,
      routeLabel: '',
      bookingId: null,
      paymentMethod: '',
      paymentStatus: '',
    }));
    setQuote({ pricePerSeat: 0, total: 0, route: '' });
  };

  return (
    <motion.div
      key="reguler-step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* LEFT */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="text-yellow-400" /> Schedule & Route (Reguler)
          </h2>

          {/* Booking For */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-2 block">Pemesanan</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setField('bookingFor', 'self')}
                  className={`flex-1 h-12 rounded-lg border transition-all ${
                    bookingData.bookingFor === 'self'
                      ? 'bg-yellow-500 text-slate-900 border-yellow-500 font-bold'
                      : 'bg-slate-900 text-white border-gray-600 hover:border-yellow-500'
                  }`}
                >
                  Pesan untuk diri sendiri
                </button>
                <button
                  type="button"
                  onClick={() => setField('bookingFor', 'other')}
                  className={`flex-1 h-12 rounded-lg border transition-all ${
                    bookingData.bookingFor === 'other'
                      ? 'bg-yellow-500 text-slate-900 border-yellow-500 font-bold'
                      : 'bg-slate-900 text-white border-gray-600 hover:border-yellow-500'
                  }`}
                >
                  Pesankan untuk orang lain
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                No HP cukup 1 (No HP pemesan). Nama penumpang akan diisi per seat.
              </p>
            </div>

            {/* Booker info */}
            <div>
              <Label className="text-gray-400 mb-2 block">Nama Pemesan</Label>
              <Input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={bookingData.passengerName || ''}
                onChange={(e) => setField('passengerName', e.target.value)}
                className="bg-slate-900 border-gray-600 text-white h-12"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">No HP Pemesan (WhatsApp)</Label>
              <Input
                type="text"
                placeholder="Contoh: 08123456789"
                value={bookingData.passengerPhone || ''}
                onChange={(e) => setField('passengerPhone', e.target.value)}
                className="bg-slate-900 border-gray-600 text-white h-12"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Lokasi Penjemputan</Label>
              <Input
                type="text"
                placeholder="Contoh: Terminal Pasir Pengaraian"
                value={bookingData.pickupLocation || ''}
                onChange={(e) => setField('pickupLocation', e.target.value)}
                className="bg-slate-900 border-gray-600 text-white h-12"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Lokasi Pengantaran</Label>
              <Input
                type="text"
                placeholder="Contoh: Bandara Sultan Syarif Kasim II"
                value={bookingData.dropoffLocation || ''}
                onChange={(e) => setField('dropoffLocation', e.target.value)}
                className="bg-slate-900 border-gray-600 text-white h-12"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Jumlah Penumpang (Auto)</Label>
              <Input
                type="number"
                value={seatCount}
                readOnly
                disabled
                className="bg-slate-900 border-gray-600 text-white h-12 opacity-80 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-2">
                Jumlah penumpang mengikuti seat yang dipilih (maks {MAX_PAX}).
              </p>
            </div>
          </div>

          {/* Origin / Destination + swap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2 flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-gray-400 mb-2 block">Origin</Label>
                <select
                  className="w-full bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none h-12"
                  value={stopDisplaySet.has(bookingData.from) ? bookingData.from : ''}
                  onChange={(e) => handleChangeFrom(e.target.value)}
                  disabled={isLoadingStops}
                >
                  <option value="" disabled>
                    {isLoadingStops ? 'Loading...' : 'Pilih Origin'}
                  </option>
                  {stops.map((s) => (
                    <option key={s.key} value={s.display}>
                      {s.display}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleSwapRoute}
                className="h-12 border-gray-600"
                title="Tukar Origin & Destination"
                disabled={!stops.length}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tukar
              </Button>

              <div className="flex-1">
                <Label className="text-gray-400 mb-2 block">Destination</Label>
                <select
                  className="w-full bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none h-12"
                  value={stopDisplaySet.has(bookingData.to) ? bookingData.to : ''}
                  onChange={(e) => handleChangeTo(e.target.value)}
                  disabled={isLoadingStops}
                >
                  <option value="" disabled>
                    {isLoadingStops ? 'Loading...' : 'Pilih Destination'}
                  </option>
                  {stops.map((s) => (
                    <option key={s.key} value={s.display} disabled={s.display === bookingData.from}>
                      {s.display}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Date</Label>
              <Input
                type="date"
                value={bookingData.date}
                onChange={(e) => {
                  setField('date', e.target.value);
                  resetSeatAndQuote();
                }}
                className="bg-slate-900 border-gray-600 text-white h-12"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Time</Label>
              <select
                className="w-full bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none h-12"
                value={bookingData.time}
                onChange={(e) => {
                  setField('time', e.target.value);
                  resetSeatAndQuote();
                }}
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">*Backend pakai format HH:mm (WIB otomatis dipotong).</p>
            </div>
          </div>

          {/* SeatSelection */}
          <SeatSelection
            selectedSeats={(bookingData.selectedSeats || []).map((s) => String(s).trim().toUpperCase())}
            onSeatSelect={handleSeatSelect}
            pricePerSeat={Number(bookingData.pricePerSeat || 0)}
            disabledSeats={bookedSeats}
            bookedSeats={bookedSeats}
            isLoading={isLoadingSeats}
          />

          {/* Passenger names per seat */}
          {showPassengerNamesList && (
            <div className="mt-6 bg-slate-900/60 border border-gray-700 rounded-xl p-4">
              <div className="text-white font-bold mb-3">Nama Penumpang per Seat</div>
              <div className="space-y-3">
                {(bookingData.passengers || []).map((p, idx) => (
                  <div key={p.seat || idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="md:col-span-1">
                      <Label className="text-gray-400 mb-1 block">Seat</Label>
                      <Input value={p.seat} readOnly disabled className="bg-slate-800 border-gray-700 text-white h-11" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-gray-400 mb-1 block">Nama Penumpang</Label>
                      <Input
                        placeholder="Isi nama penumpang"
                        value={p.name || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateBookingData((prev) => {
                            const arr = Array.isArray(prev.passengers) ? [...prev.passengers] : [];
                            const seat = String(p.seat || '').trim().toUpperCase();
                            const i = arr.findIndex((x) => String(x.seat || '').trim().toUpperCase() === seat);
                            if (i >= 0) arr[i] = { ...arr[i], name: val };
                            return { ...prev, passengers: arr };
                          });
                        }}
                        className="bg-slate-900 border-gray-600 text-white h-11"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                *Nama penumpang wajib diisi sesuai seat yang dipilih. No HP cukup 1 (No HP pemesan).
              </p>
            </div>
          )}

          {submitError ? <div className="mt-4 text-sm text-red-300">{submitError}</div> : null}
        </div>
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-gray-700 shadow-xl sticky top-24">
          <h3 className="text-lg font-bold text-white mb-4">Summary</h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Pemesanan</span>
              <span className="text-white font-medium text-right">
                {bookingData.bookingFor === 'other' ? 'Untuk orang lain' : 'Untuk diri sendiri'}
              </span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>Pemesan</span>
              <span className="text-white font-medium text-right">{bookingData.passengerName || '-'}</span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>No HP</span>
              <span className="text-white font-medium text-right">{bookingData.passengerPhone || '-'}</span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>Penumpang</span>
              <span className="text-white font-medium flex items-center gap-1">
                <Users className="w-4 h-4" />
                {seatCount}
              </span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>Route</span>
              <span className="text-white font-medium text-right">
                {bookingData.routeLabel || `${bookingData.from || '-'} → ${bookingData.to || '-'}`}
              </span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>Seat Dipilih</span>
              <span className="text-white font-medium text-right">
                {seatCount ? (bookingData.selectedSeats || []).join(', ') : '-'}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Total (Backend)</span>
              <span className="text-xl font-bold text-yellow-400">
                {isLoadingQuote ? '...' : `Rp ${Number(bookingData.totalAmount || 0).toLocaleString()}`}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              *Tarif & total selalu dari backend (quote). FE tidak menghitung.
            </p>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={onBack} className="flex-1 border-gray-600" disabled={isSubmitting}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Next'}
            </Button>
          </div>

          {!seatValid && <div className="mt-3 text-xs text-red-300">Pilih seat dulu (maks {MAX_PAX}).</div>}
          {!basicValid && (
            <div className="mt-2 text-xs text-yellow-200/90">
              Lengkapi: pemesan, no HP, pickup, dropoff, origin, destination, tanggal, dan jam.
            </div>
          )}
          {seatValid && basicValid && !passengerNamesValid && (
            <div className="mt-2 text-xs text-yellow-200/90">Isi nama penumpang sesuai seat yang dipilih.</div>
          )}
          {seatValid && basicValid && passengerNamesValid && !quoteValid && (
            <div className="mt-2 text-xs text-red-300">Tarif belum tersedia / quote belum keluar dari backend.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RegulerStep;
