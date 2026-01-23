import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, User, Users, Phone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { API_HOST } from '@/lib/api';

/**
 * Dual-mode:
 * 1) Inline mode (booking flow): use passengersBySeat + onChange, no submit, just inputs.
 * 2) Legacy API mode (bookingId provided, without passengersBySeat): keeps save-to-backend flow.
 */
const PassengerPerSeatForm = ({
  selectedSeats = [],
  passengersBySeat,
  onChange,
  showErrors = false,
  errorMessage = '',
  bookingId,
  onSuccess,
  onSkip,
}) => {
  const { toast } = useToast();

  const normalizedSeats = useMemo(
    () =>
      Array.from(
        new Set(
          (selectedSeats || [])
            .map((s) => String(s || '').trim().toUpperCase())
            .filter(Boolean)
        )
      ),
    [selectedSeats]
  );

  const isInline = passengersBySeat && typeof onChange === 'function';

  // ===== Inline-only render =====
  if (isInline) {
    if (!normalizedSeats.length) {
      return (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-sm text-gray-300">
          Tidak ada seat yang dipilih.
        </div>
      );
    }

    return (
      <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold">
          <User className="w-4 h-4 text-yellow-400" />
          <span>Data Penumpang per Seat</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {normalizedSeats.map((seatCode) => {
            const row = passengersBySeat[seatCode] || { passengerName: '', passengerPhone: '' };
            const nameEmpty = showErrors && !String(row.passengerName || '').trim();
            const phoneRaw = String(row.passengerPhone || '').trim();
            const phoneInvalid = showErrors && (!phoneRaw || phoneRaw.replace(/[^0-9+]/g, '').length < 6);

            return (
              <div key={seatCode} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-200 font-semibold">
                  <Users className="w-4 h-4 text-yellow-400" />
                  <span>Seat {seatCode}</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">Nama Penumpang</Label>
                  <Input
                    value={row.passengerName}
                    onChange={(e) => onChange(seatCode, 'passengerName', e.target.value)}
                    placeholder="Isi nama"
                    className={`bg-slate-900 text-white h-10 ${nameEmpty ? 'border-red-500' : 'border-slate-700'}`}
                  />
                  {nameEmpty ? <div className="text-xs text-red-300">Nama wajib diisi</div> : null}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-400">No HP</Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                    <Input
                      value={row.passengerPhone}
                      onChange={(e) => onChange(seatCode, 'passengerPhone', e.target.value)}
                    placeholder="0812..."
                    type="text"
                    inputMode="numeric"
                    className={`pl-9 bg-slate-900 text-white h-10 ${
                      phoneInvalid ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                  {phoneInvalid ? (
                    <div className="text-xs text-red-300">No HP minimal 6 digit (angka/+)</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {errorMessage ? <div className="text-sm text-red-300">{errorMessage}</div> : null}
      </div>
    );
  }

  // ===== Legacy API mode (keep previous behavior) =====
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [notAvailable, setNotAvailable] = useState(false);
  const [message, setMessage] = useState('');
  const [prefillLoading, setPrefillLoading] = useState(false);

  useEffect(() => {
    setRows((prev) => {
      const map = new Map(prev.map((r) => [r.seatCode, r]));
      return normalizedSeats.map((seat) => map.get(seat) || { seatCode: seat, passengerName: '', passengerPhone: '' });
    });
    setErrors({});
    setMessage('');
    setNotAvailable(false);
  }, [normalizedSeats]);

  // Prefill dari backend jika bookingId tersedia (auto load tanpa mengetik ulang)
  useEffect(() => {
    if (!bookingId || !normalizedSeats.length) return;
    const controller = new AbortController();
    const fetchPrefill = async () => {
      try {
        setPrefillLoading(true);
        const urlBase = API_HOST;
        const res = await fetch(`${urlBase}/api/bookings/${bookingId}/passengers`, { signal: controller.signal });
        if (!res.ok) {
          if (res.status === 404) setMessage('Fitur belum tersedia');
          return;
        }
        const data = await res.json().catch(() => null);
        if (!data || !Array.isArray(data.passengers)) return;
        const map = new Map();
        data.passengers.forEach((p) => {
          const seat = String(p.seat_code || p.seatCode || '').trim().toUpperCase();
          if (!seat) return;
          map.set(seat, {
            seatCode: seat,
            passengerName: p.passenger_name || p.passengerName || '',
            passengerPhone: p.passenger_phone || p.passengerPhone || '',
          });
        });
        setRows((prev) =>
          normalizedSeats.map((seat) => map.get(seat) || prev.find((r) => r.seatCode === seat) || { seatCode: seat, passengerName: '', passengerPhone: '' })
        );
      } finally {
        setPrefillLoading(false);
      }
    };
    fetchPrefill();
    return () => controller.abort();
  }, [bookingId, normalizedSeats]);

  const setRowValue = (seatCode, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.seatCode === seatCode ? { ...r, [field]: value } : r))
    );
  };

  const validate = () => {
    const nextErrors = {};
    const phoneRegex = /^[0-9+]{8,}$/;

    rows.forEach((r) => {
      const seatErr = {};
      if (!String(r.passengerName || '').trim()) seatErr.passengerName = 'Nama wajib diisi';
      const phone = String(r.passengerPhone || '').trim();
      if (!phone) seatErr.passengerPhone = 'No HP wajib diisi';
      else if (!phoneRegex.test(phone)) seatErr.passengerPhone = 'No HP minimal 8 digit, hanya angka/+';
      if (Object.keys(seatErr).length) nextErrors[r.seatCode] = seatErr;
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!bookingId) {
      setMessage('Booking ID belum tersedia. Buat atau pilih booking terlebih dahulu.');
      return;
    }
    if (!validate()) return;

    const payloadArray = rows.map((r) => ({
      seat_code: r.seatCode,
      passenger_name: String(r.passengerName || '').trim(),
      passenger_phone: String(r.passengerPhone || '').replace(/\s+/g, '').trim(),
    }));

    const urlBase = API_HOST;
    const url = `${urlBase}/api/bookings/${bookingId}/passengers`;

    const sendPayload = async (body) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res;
    };

    setLoading(true);
    setMessage('');
    setNotAvailable(false);

    try {
      // Format utama: { passengers: [...] }
      let res = await sendPayload({ passengers: payloadArray });
      if (!res.ok) {
        // Coba fallback: array langsung
        res = await sendPayload(payloadArray);
      }

      if (res.status === 404 || res.status === 501) {
        setNotAvailable(true);
        setMessage('Fitur belum tersedia');
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.error || `Gagal menyimpan penumpang (HTTP ${res.status})`;
        throw new Error(msg);
      }

      toast({
        title: 'Tersimpan',
        description: 'Data penumpang per seat berhasil disimpan.',
      });
      if (typeof onSuccess === 'function') onSuccess(data);
    } catch (err) {
      setMessage(err?.message || 'Gagal menyimpan penumpang.');
    } finally {
      setLoading(false);
    }
  };

  if (!normalizedSeats.length) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-sm text-gray-300">
        Tidak ada seat yang dipilih.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-white font-semibold">
        <User className="w-4 h-4 text-yellow-400" />
        <span>Data Penumpang per Seat</span>
      </div>

      {notAvailable ? (
        <div className="bg-yellow-500/10 border border-yellow-500/40 text-yellow-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-yellow-100">Fitur belum tersedia</div>
            <div className="text-xs opacity-80">Backend belum menyediakan endpoint penumpang per seat.</div>
            {typeof onSkip === 'function' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 border-yellow-500/60 text-yellow-100"
                onClick={() => onSkip()}
              >
                Lanjutkan tanpa mengisi
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((row) => {
          const seatErr = errors[row.seatCode] || {};
          return (
            <div key={row.seatCode} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-200 font-semibold">
                <Users className="w-4 h-4 text-yellow-400" />
                <span>Seat {row.seatCode}</span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Nama Penumpang</Label>
                <Input
                  value={row.passengerName}
                  onChange={(e) => setRowValue(row.seatCode, 'passengerName', e.target.value)}
                  placeholder="Isi nama"
                  className="bg-slate-900 border-slate-700 text-white h-10"
                />
                {seatErr.passengerName ? (
                  <div className="text-xs text-red-300">{seatErr.passengerName}</div>
                ) : null}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-400">No HP</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <Input
                    value={row.passengerPhone}
                    onChange={(e) => setRowValue(row.seatCode, 'passengerPhone', e.target.value)}
                    placeholder="0812..."
                    type="text"
                    inputMode="numeric"
                    className="pl-9 bg-slate-900 border-slate-700 text-white h-10"
                  />
                </div>
                {seatErr.passengerPhone ? (
                  <div className="text-xs text-red-300">{seatErr.passengerPhone}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {message ? <div className="text-sm text-yellow-200">{message}</div> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
        >
          {loading ? 'Menyimpan...' : 'Simpan Penumpang'}
        </Button>
        {typeof onSkip === 'function' && (
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onSkip()}
            className="border-slate-600 text-gray-200"
          >
            Lewati
          </Button>
        )}
        <div className="text-xs text-gray-400 self-center">
          Simpan sebelum pembayaran untuk memastikan data penumpang tercatat di backend.
        </div>
      </div>
    </div>
  );
};

export default PassengerPerSeatForm;
