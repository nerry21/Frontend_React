import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SeatSelector = ({
  selectedSeats = [],
  onSeatSelect,
  bookedSeats = [],
  pricePerSeat = 0,
  maxSeats = 6,
}) => {
  // Layout: 1 (front-left), driver (front-right), 2-3, 4-5
  const seats = useMemo(
    () => [
      { id: '1', row: 1, col: 'left', label: '1' },
      { id: 'driver', row: 1, col: 'right', label: '', isDriver: true },
      { id: '2', row: 2, col: 'left', label: '2' },
      { id: '3', row: 2, col: 'right', label: '3' },
      { id: '4', row: 3, col: 'left', label: '4' },
      { id: '5', row: 3, col: 'right', label: '5' },
    ],
    []
  );

  const normalizedSelected = useMemo(
    () => selectedSeats.map((s) => String(s).trim().toUpperCase()).filter(Boolean),
    [selectedSeats]
  );
  const normalizedBooked = useMemo(
    () => bookedSeats.map((s) => String(s).trim().toUpperCase()).filter(Boolean),
    [bookedSeats]
  );

  const totalPrice = (normalizedSelected.length || 0) * (Number(pricePerSeat) || 0);

  // ======= Seat SVG (lebih 3D) =======
  const SeatShape = ({ state = 'available' }) => {
    // state: available | selected | booked
    const fill =
      state === 'selected' ? '#2563eb' : state === 'booked' ? '#e2e8f0' : '#eff6ff';
    const stroke =
      state === 'selected' ? '#1d4ed8' : state === 'booked' ? '#94a3b8' : '#93c5fd';

    const shine =
      state === 'selected' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.55)';
    const shadow =
      state === 'booked' ? 'rgba(15,23,42,0.06)' : 'rgba(15,23,42,0.14)';

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* drop shadow */}
        <path
          d="M26,36 Q26,14 60,14 Q94,14 94,36 L94,86 Q94,104 60,104 Q26,104 26,86 Z"
          fill={shadow}
          transform="translate(2 3)"
        />
        {/* main seat */}
        <path
          d="M26,36 Q26,14 60,14 Q94,14 94,36 L94,86 Q94,104 60,104 Q26,104 26,86 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
        />
        {/* side arms */}
        <path
          d="M26,46 Q14,46 14,62 L14,78 Q14,90 26,90"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M94,46 Q106,46 106,62 L106,78 Q106,90 94,90"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* inner contour */}
        <path
          d="M36,46 Q60,58 84,46"
          stroke={shine}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M40,78 Q60,88 80,78"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* highlight */}
        <path
          d="M34,28 Q40,22 54,20"
          stroke={shine}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    );
  };

  const SteeringWheel = () => (
    <div className="w-[72px] h-[72px] relative flex items-center justify-center opacity-70">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="wheelG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#94a3b8" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill="none" stroke="url(#wheelG)" strokeWidth="8" />
        <circle cx="50" cy="50" r="10" fill="#475569" />
        <line x1="50" y1="50" x2="50" y2="8" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
        <line x1="50" y1="50" x2="18" y2="80" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
        <line x1="50" y1="50" x2="82" y2="80" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </div>
  );

  const canPickMore = normalizedSelected.length < maxSeats;

  const renderSeat = (seat) => {
    if (seat.isDriver) {
      return (
        <div key={seat.id} className="relative w-20 h-20 flex items-center justify-center">
          <SteeringWheel />
          <div className="absolute -bottom-4 text-[10px] text-slate-400 font-semibold">Driver</div>
        </div>
      );
    }

    const seatId = String(seat.id).trim().toUpperCase();
    const isBooked = normalizedBooked.includes(seatId);
    const isSelected = normalizedSelected.includes(seatId);

    const state = isBooked ? 'booked' : isSelected ? 'selected' : 'available';

    return (
      <motion.button
        key={seat.id}
        type="button"
        whileHover={!isBooked ? { scale: 1.04, y: -1 } : {}}
        whileTap={!isBooked ? { scale: 0.97 } : {}}
        onClick={() => {
          if (isBooked) return;

          // optional: blok kalau melebihi maxSeats
          if (!isSelected && !canPickMore) return;

          onSeatSelect?.(seatId);
        }}
        disabled={isBooked}
        className={cn(
          'relative w-20 h-20 flex items-center justify-center focus:outline-none',
          !isBooked && 'cursor-pointer',
          isBooked && 'cursor-not-allowed opacity-80'
        )}
        title={isBooked ? 'Seat tidak tersedia' : isSelected ? 'Klik untuk batal' : 'Klik untuk pilih'}
      >
        <SeatShape state={state} />

        {/* number */}
        <span
          className={cn(
            'absolute font-extrabold text-lg z-10 drop-shadow-sm',
            isBooked ? 'text-slate-500' : isSelected ? 'text-white' : 'text-slate-700'
          )}
        >
          {seat.label}
        </span>

        {/* badge */}
        {!isBooked && isSelected ? (
          <span className="absolute -top-2 -right-2 bg-white rounded-full shadow-md">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </span>
        ) : null}
        {isBooked ? (
          <span className="absolute -top-2 -right-2 bg-white rounded-full shadow-md">
            <XCircle className="w-5 h-5 text-slate-500" />
          </span>
        ) : null}
      </motion.button>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-[2rem] p-6 shadow-2xl overflow-hidden border border-slate-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Pilih Kursi</h3>
          <p className="text-sm text-slate-500">Travel • Layout 1-2-2</p>
        </div>

        <div className="text-right bg-blue-50 px-3 py-2 rounded-2xl border border-blue-100">
          <p className="text-[11px] text-blue-700/70 font-semibold leading-tight">Harga per kursi</p>
          <p className="text-lg font-extrabold text-blue-700">
            Rp {(Number(pricePerSeat) || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mb-6 text-xs font-semibold">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-slate-700">
          <span className="w-3.5 h-3.5 rounded bg-blue-600 border border-blue-700" />
          Dipilih
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-700">
          <span className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200" />
          Tersedia
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500">
          <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300" />
          Penuh
        </span>
      </div>

      {/* Car Diagram */}
      <div className="relative w-full h-[500px] mx-auto mb-4 flex justify-center">
        {/* Car body */}
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <svg viewBox="0 0 320 640" className="h-full">
            <defs>
              <linearGradient id="carBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e2e8f0" />
                <stop offset="1" stopColor="#f8fafc" />
              </linearGradient>
              <linearGradient id="carInner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
              </linearGradient>
              <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.12" />
              </filter>
            </defs>

            {/* outer */}
            <path
              d="M72,130
                 C72,55 115,26 160,26
                 C205,26 248,55 248,130
                 L255,510
                 C255,580 205,612 160,612
                 C115,612 65,580 65,510
                 Z"
              fill="url(#carBody)"
              stroke="#cbd5e1"
              strokeWidth="3"
              filter="url(#softShadow)"
            />

            {/* inner cabin */}
            <path
              d="M95,150
                 C95,85 125,60 160,60
                 C195,60 225,85 225,150
                 L231,495
                 C231,545 195,572 160,572
                 C125,572 89,545 89,495
                 Z"
              fill="url(#carInner)"
              stroke="#e2e8f0"
              strokeWidth="2"
              opacity="0.95"
            />

            {/* windshield lines */}
            <path d="M102,165 Q160,140 218,165" stroke="#cbd5e1" strokeWidth="2" fill="none" />
            <path d="M100,470 Q160,495 220,470" stroke="#cbd5e1" strokeWidth="2" fill="none" />

            {/* mirrors */}
            <path d="M74,190 L50,184 Q44,198 50,212 L74,206" stroke="#cbd5e1" strokeWidth="2" fill="#fff" />
            <path d="M246,190 L270,184 Q276,198 270,212 L246,206" stroke="#cbd5e1" strokeWidth="2" fill="#fff" />

            {/* front/back labels */}
            <text x="160" y="95" textAnchor="middle" fontSize="12" fill="#94a3b8" fontWeight="700">
              FRONT
            </text>
            <text x="160" y="600" textAnchor="middle" fontSize="12" fill="#94a3b8" fontWeight="700">
              BACK
            </text>
          </svg>
        </div>

        {/* Seats */}
        <div className="relative z-10 w-full flex justify-center">
          <div className="pt-[155px] w-[240px] space-y-10">
            {/* row 1 */}
            <div className="flex justify-between">
              {renderSeat(seats[0])}
              {renderSeat(seats[1])}
            </div>

            {/* row 2 */}
            <div className="flex justify-between">
              {renderSeat(seats[2])}
              {renderSeat(seats[3])}
            </div>

            {/* row 3 */}
            <div className="flex justify-between">
              {renderSeat(seats[4])}
              {renderSeat(seats[5])}
            </div>

            {!canPickMore ? (
              <div className="text-center text-xs text-red-500 font-semibold -mt-2">
                Maksimal pilih {maxSeats} kursi.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <Info className="w-4 h-4 text-slate-400" />
        <p className="text-xs text-slate-500">Anak umur 4 tahun dikenakan tiket</p>
      </div>

      {/* Bottom action bar (display only) */}
      <motion.div
        layout
        className="rounded-2xl p-4 flex items-center justify-between shadow-lg border border-blue-100"
        style={{
          background:
            'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(59,130,246,1) 60%, rgba(99,102,241,1) 100%)',
        }}
      >
        <div className="text-white">
          <div className="font-extrabold text-lg leading-tight">Konfirmasi</div>
          <div className="text-blue-100 text-xs font-semibold">
            {normalizedSelected.length} kursi dipilih
          </div>
        </div>

        <div className="text-right text-white">
          <div className="text-[11px] text-blue-100 font-semibold">Total</div>
          <div className="font-extrabold text-xl">Rp {totalPrice.toLocaleString()}</div>
        </div>
      </motion.div>
    </div>
  );
};

export default SeatSelector;
