// src/pages/FinancialReports/components/SuperSlideshow.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { itemV } from '../motionPresets';

export default function SuperSlideshow({
  slides = [],
  intervalMs = 4200,
  title = 'Ringkasan',
}) {
  const safeSlides = Array.isArray(slides) ? slides : [];
  const len = safeSlides.length;

  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  // Pastikan idx selalu valid kalau slides berubah panjang
  useEffect(() => {
    if (len === 0) {
      setIdx(0);
      return;
    }
    setIdx((prev) => (prev >= len ? 0 : prev));
  }, [len]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const next = useCallback(() => {
    if (len === 0) return;
    setIdx((p) => (p + 1) % len);
  }, [len]);

  const prev = useCallback(() => {
    if (len === 0) return;
    setIdx((p) => (p - 1 + len) % len);
  }, [len]);

  // Auto-rotate
  useEffect(() => {
    clearTimer();

    if (len === 0) return;
    const ms = Number(intervalMs);
    if (!Number.isFinite(ms) || ms <= 0) return;

    timerRef.current = setInterval(() => {
      setIdx((p) => (p + 1) % len);
    }, ms);

    return clearTimer;
  }, [len, intervalMs, clearTimer]);

  const canNavigate = len > 1;

  return (
    <motion.div
      variants={itemV}
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(250,204,21,0.14),transparent_40%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.14),transparent_45%),radial-gradient(circle_at_60%_80%,rgba(59,130,246,0.12),transparent_40%)]" />

      <div className="relative p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white font-extrabold">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            {title}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-gray-200"
              size="icon"
              onClick={prev}
              disabled={!canNavigate}
              aria-label="Prev slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              className="border-slate-700 text-gray-200"
              size="icon"
              onClick={next}
              disabled={!canNavigate}
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-[120px] md:h-[110px]">
          {len === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              Tidak ada data ringkasan.
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 26, filter: 'blur(6px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -26, filter: 'blur(6px)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="absolute inset-0"
              >
                {safeSlides[idx]}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {len > 0 && (
          <div className="mt-4 flex items-center gap-2">
            {safeSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === idx
                    ? 'w-10 bg-yellow-400'
                    : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
