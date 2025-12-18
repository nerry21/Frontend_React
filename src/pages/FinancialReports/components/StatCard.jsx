// src/pages/FinancialReports/components/StatCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { rupiah, toNumber } from '../utils';

export default function StatCard({
  title = '-',
  value = 0,
  icon: Icon,
  colorClass = '',
  subtext,
  className = '',
}) {
  const safeValue = toNumber(value);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={[
        'relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl border border-white/10',
        colorClass,
        className,
      ].join(' ')}
      role="group"
      aria-label={String(title)}
    >
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.25),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.12),transparent_40%)]" />

      {Icon ? (
        <div className="absolute -right-6 -top-6 opacity-15 pointer-events-none select-none">
          <Icon className="w-28 h-28" aria-hidden="true" />
        </div>
      ) : null}

      <div className="relative z-10 flex items-center justify-between mb-3">
        <span className="font-semibold text-white/90">{title}</span>

        {Icon ? (
          <div className="p-2 bg-white/15 rounded-xl backdrop-blur border border-white/10">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        ) : (
          <div className="p-2 bg-white/10 rounded-xl border border-white/10 text-[10px] text-white/70">
            KPI
          </div>
        )}
      </div>

      <p className="relative z-10 text-2xl font-extrabold tracking-tight">
        Rp {rupiah(safeValue)}
      </p>

      {subtext ? (
        <p className="relative z-10 text-xs text-white/70 mt-1">{subtext}</p>
      ) : null}
    </motion.div>
  );
}
