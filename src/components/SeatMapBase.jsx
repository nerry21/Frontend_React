import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Base seat map component (1-2-2 layout + driver) used by SeatSelection & SeatSelector.
 * Keeps existing layout/UX while allowing themed variants.
 */
const SeatMapBase = ({
  seatIds = ['1A', '2A', '3A', '4A', '5A'],
  selectedSeats = [],
  bookedSeats = [],
  onSeatSelect,
  pricePerSeat = 0,
  maxSeats = 6,
  theme = {},
  headerSubtitle = 'Layout 1-2-2',
  noteText = '',
  totalBarStyle = {},
  seatColumnWidth = 150,
}) => {
  // defaults (yellow theme)
  const {
    primary = '#ca8a04',
    primaryBorder = '#eab308',
    headerBg = '#fff7ed',
    headerBorder = '#fef3c7',
    legendSelectedBg = '#fef9c3',
    legendSelectedBorder = '#fef08a',
    badgeColor = '#f59e0b',
    textPrimary = '#0f172a',
    secondaryText = '#475569',
    availableFill = '#eff6ff',
    availableStroke = '#60a5fa',
    bookedFill = '#e2e8f0',
    bookedStroke = '#94a3b8',
  } = theme || {};

  const normalizedSeats = useMemo(
    () => (seatIds || []).map((s) => String(s || '').trim().toUpperCase()).filter(Boolean),
    [seatIds]
  );

  const normalizedSelected = useMemo(
    () => (selectedSeats || []).map((s) => String(s || '').trim().toUpperCase()).filter(Boolean),
    [selectedSeats]
  );
  const normalizedBooked = useMemo(
    () => (bookedSeats || []).map((s) => String(s || '').trim().toUpperCase()).filter(Boolean),
    [bookedSeats]
  );

  const seats = useMemo(() => {
    // build layout 1-2-2 + driver
    const s = normalizedSeats;
    return [
      { id: s[0] || '1A', row: 1, col: 'left', label: s[0] || '1A' },
      { id: 'driver', row: 1, col: 'right', label: 'Driver', isDriver: true },
      { id: s[1] || '2A', row: 2, col: 'left', label: s[1] || '2A' },
      { id: s[2] || '3A', row: 2, col: 'right', label: s[2] || '3A' },
      { id: s[3] || '4A', row: 3, col: 'left', label: s[3] || '4A' },
      { id: s[4] || '5A', row: 3, col: 'right', label: s[4] || '5A' },
    ];
  }, [normalizedSeats]);

  const canPickMore = normalizedSelected.length < maxSeats;
  const totalPrice = (normalizedSelected.length || 0) * (Number(pricePerSeat) || 0);

  // Seat SVG
  const SeatShape = ({ state = 'available' }) => {
    const fill = state === 'selected' ? primary : state === 'booked' ? bookedFill : availableFill;
    const stroke = state === 'selected' ? primaryBorder : state === 'booked' ? bookedStroke : availableStroke;
    const shine = state === 'selected' ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.60)';
    const shadow = state === 'booked' ? 'rgba(15,23,42,0.06)' : 'rgba(15,23,42,0.14)';

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <path
          d="M24,34 Q24,14 60,14 Q96,14 96,34 L96,88 Q96,104 60,104 Q24,104 24,88 Z"
          fill={shadow}
          transform="translate(2 3)"
        />
        <path
          d="M24,34 Q24,14 60,14 Q96,14 96,34 L96,88 Q96,104 60,104 Q24,104 24,88 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="4"
        />
        <path
          d="M24,48 Q14,48 14,62 L14,78 Q14,90 24,90"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M96,48 Q106,48 106,62 L106,78 Q106,90 96,90"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
        />
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
        <path
          d="M34,28 Q42,20 56,20"
          stroke={shine}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    );
  };

  const SteeringWheel = () => (
    <div className="w-[70px] h-[70px] relative flex items-center justify-center opacity-70">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="wheelG2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#94a3b8" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#wheelG2)" strokeWidth="8" />
        <circle cx="50" cy="50" r="10" fill="#475569" />
        <line x1="50" y1="50" x2="50" y2="10" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
        <line x1="50" y1="50" x2="20" y2="80" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
        <line x1="50" y1="50" x2="80" y2="80" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </div>
  );

  const renderSeat = (seat) => {
    if (seat.isDriver) {
      return (
        <div key={seat.id} className="relative w-20 h-20 flex flex-col items-center justify-center">
          <SteeringWheel />
          <span className="absolute -bottom-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Driver
          </span>
        </div>
      );
    }

    const id = String(seat.id).trim().toUpperCase();
    const isBooked = normalizedBooked.includes(id);
    const isSelected = normalizedSelected.includes(id);
    const state = isBooked ? 'booked' : isSelected ? 'selected' : 'available';

    return (
      <motion.button
        key={seat.id}
        type="button"
        onClick={() => {
          if (isBooked) return;
          if (!isSelected && !canPickMore) return;
          onSeatSelect?.(id);
        }}
        disabled={isBooked}
        whileHover={!isBooked ? { scale: 1.05, y: -1 } : {}}
        whileTap={!isBooked ? { scale: 0.97 } : {}}
        className={cn(
          'relative w-20 h-20 flex items-center justify-center focus:outline-none',
          !isBooked ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
        )}
        title={isBooked ? 'Seat tidak tersedia' : isSelected ? 'Klik untuk batal' : 'Klik untuk pilih'}
      >
        <SeatShape state={state} />

        <span
          className={cn(
            'absolute font-extrabold text-lg z-10 drop-shadow-sm',
            isBooked ? 'text-slate-500' : isSelected ? 'text-white' : 'text-blue-700'
          )}
        >
          {seat.label}
        </span>

        {!isBooked && isSelected ? (
          <span className="absolute -top-2 -right-2 bg-white rounded-full shadow-md">
            <CheckCircle2 className="w-5 h-5" style={{ color: badgeColor }} />
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

  const renderTotalBar = () => {
    if (totalBarStyle?.variant === 'gradient') {
      return (
        <motion.div
          layout
          className={cn(
            'rounded-2xl p-4 flex items-center justify-between shadow-lg border border-blue-100',
            totalBarStyle.className
          )}
          style={{
            background:
              totalBarStyle.gradient ||
              'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(59,130,246,1) 60%, rgba(99,102,241,1) 100%)',
            ...(totalBarStyle.style || {}),
          }}
        >
          <div className="text-white">
            <div className="font-extrabold text-lg leading-tight">
              {totalBarStyle.title || 'Konfirmasi'}
            </div>
            <div className="text-blue-100 text-xs font-semibold">
              {normalizedSelected.length} kursi dipilih
            </div>
          </div>

          <div className="text-right text-white">
            <div className="text-[11px] text-blue-100 font-semibold">
              {totalBarStyle.subtitle || 'Total'}
            </div>
            <div className="font-extrabold text-xl">Rp {totalPrice.toLocaleString()}</div>
          </div>
        </motion.div>
      );
    }

    // default simple bar
    return (
      <div className="mt-5 rounded-2xl p-4 border border-yellow-100 bg-yellow-50 flex items-center justify-between">
        <div className="text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Kursi dipilih</div>
          <div className="font-extrabold">{normalizedSelected.length}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-slate-500">Total (display)</div>
          <div className="font-extrabold text-slate-900">Rp {totalPrice.toLocaleString()}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-extrabold" style={{ color: textPrimary }}>
            Pilih Kursi
          </h3>
          <p className="text-sm" style={{ color: secondaryText }}>
            {headerSubtitle}
          </p>
        </div>

        <div
          className="text-right px-3 py-2 rounded-2xl"
          style={{
            backgroundColor: headerBg,
            border: `1px solid ${headerBorder}`,
          }}
        >
          <p className="text-[11px] font-semibold leading-tight" style={{ color: secondaryText }}>
            Harga per kursi
          </p>
          <p className="text-lg font-extrabold" style={{ color: primary }}>
            Rp {(Number(pricePerSeat) || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mb-6 text-xs font-semibold">
        <span
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-700"
          style={{ backgroundColor: legendSelectedBg, border: `1px solid ${legendSelectedBorder}` }}
        >
          <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: primary, border: `1px solid ${primaryBorder}` }} />
          Dipilih
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-700">
          <span className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200" />
          Tersedia
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500">
          <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300" />
          Booked
        </span>
      </div>

      {/* Car Diagram */}
      <div className="relative w-full h-[500px] mx-auto mb-6 flex justify-center">
        {/* Car Body */}
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <svg viewBox="0 0 320 640" className="h-full">
            <defs>
              <linearGradient id="carBodyY" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e2e8f0" />
                <stop offset="1" stopColor="#f8fafc" />
              </linearGradient>
              <linearGradient id="carInnerY" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.25" />
              </linearGradient>
              <filter id="softShadowY" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.12" />
              </filter>
            </defs>

            <path
              d="M72,130
                 C72,55 115,26 160,26
                 C205,26 248,55 248,130
                 L255,510
                 C255,580 205,612 160,612
                 C115,612 65,580 65,510
                 Z"
              fill="url(#carBodyY)"
              stroke="#cbd5e1"
              strokeWidth="3"
              filter="url(#softShadowY)"
            />

            <path
              d="M95,150
                 C95,85 125,60 160,60
                 C195,60 225,85 225,150
                 L231,495
                 C231,545 195,572 160,572
                 C125,572 89,545 89,495
                 Z"
              fill="url(#carInnerY)"
              stroke="#e2e8f0"
              strokeWidth="2"
              opacity="0.95"
            />

            <path d="M102,165 Q160,140 218,165" stroke="#cbd5e1" strokeWidth="2" fill="none" />
            <path d="M100,470 Q160,495 220,470" stroke="#cbd5e1" strokeWidth="2" fill="none" />
            <path d="M74,190 L50,184 Q44,198 50,212 L74,206" stroke="#cbd5e1" strokeWidth="2" fill="#fff" />
            <path d="M246,190 L270,184 Q276,198 270,212 L246,206" stroke="#cbd5e1" strokeWidth="2" fill="#fff" />
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
          <div
            className="pt-[155px] space-y-10 mx-auto"
            style={{ width: `${seatColumnWidth}px` }}
          >
            <div className="flex justify-between">
              {renderSeat(seats[0])}
              {renderSeat(seats[1])}
            </div>

            <div className="flex justify-between">
              {renderSeat(seats[2])}
              {renderSeat(seats[3])}
            </div>

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

      {/* Note */}
      <div className="flex items-center justify-center gap-2 opacity-85">
        <Info className="w-4 h-4 text-slate-400" />
        <p className="text-xs text-slate-500">{noteText}</p>
      </div>

      {/* Total Bar */}
      {renderTotalBar()}
    </div>
  );
};

export default SeatMapBase;
