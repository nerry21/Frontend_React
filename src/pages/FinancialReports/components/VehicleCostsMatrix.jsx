// src/pages/FinancialReports/components/VehicleCostsMatrix.jsx
import React, { useMemo } from 'react';
import { MONTHS_ID, VEHICLE_COST_TYPES } from '../constants';
import { rupiah, toNumber } from '../utils';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';

/**
 * costs: array of {id?, carCode, driverName, year, month(1..12), maintenanceFee, insuranceFee, installmentFee}
 * onOpenMonth: (carCode, year, month, existingRowOrNull) => void
 */
export default function VehicleCostsMatrix({ year, carCodes, costs, onOpenMonth, onAddNew }) {
  // Index by carCode -> month -> record
  const index = useMemo(() => {
    const map = new Map();
    for (const row of costs || []) {
      if (Number(row.year) !== Number(year)) continue;
      const car = String(row.carCode || '');
      const m = Number(row.month);
      if (!map.has(car)) map.set(car, new Map());
      map.get(car).set(m, row);
    }
    return map;
  }, [costs, year]);

  const guessDriver = (carCode) => {
    const months = index.get(carCode);
    if (!months) return '-';
    for (let m = 1; m <= 12; m++) {
      const r = months.get(m);
      if (r?.driverName) return r.driverName;
    }
    // fallback: last month
    for (let m = 12; m >= 1; m--) {
      const r = months.get(m);
      if (r?.driverName) return r.driverName;
    }
    return '-';
  };

  const getValue = (carCode, month, key) => {
    const months = index.get(carCode);
    const r = months?.get(month);
    return toNumber(r?.[key]);
  };

  const getExisting = (carCode, month) => {
    const months = index.get(carCode);
    return months?.get(month) || null;
  };

  return (
    <div className="bg-slate-900/70 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
        <div>
          <div className="text-white font-extrabold text-lg">Biaya Mobil Bulanan</div>
          <div className="text-xs text-gray-400">Format: Kode Mobil + Driver + Jenis Biaya, kolom Jan–Des + Total Tahun ({year})</div>
        </div>
        <Button onClick={onAddNew} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Tambah Bulan
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left whitespace-nowrap">
          <thead className="bg-slate-950 text-gray-200 uppercase font-extrabold border-b border-slate-800">
            <tr>
              <th className="p-3 sticky left-0 bg-slate-950 z-10">Kode Mobil</th>
              <th className="p-3 sticky left-[100px] bg-slate-950 z-10">Driver</th>
              <th className="p-3 sticky left-[260px] bg-slate-950 z-10">Jenis Biaya</th>
              {MONTHS_ID.map((m) => (
                <th key={m} className="p-3">{m.substring(0, 3)}</th>
              ))}
              <th className="p-3">Total Tahun</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 text-gray-200">
            {(carCodes || []).map((carCode) => {
              const driverName = guessDriver(carCode);
              return VEHICLE_COST_TYPES.map((t, i) => {
                const yearlyTotal = Array.from({ length: 12 }, (_, k) => k + 1).reduce(
                  (s, month) => s + getValue(carCode, month, t.key),
                  0
                );

                return (
                  <tr
                    key={`${carCode}-${t.key}`}
                    className={`transition-colors hover:bg-slate-800/50 ${i % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-900/10'}`}
                  >
                    <td className="p-3 sticky left-0 bg-slate-900/80 backdrop-blur z-10 font-extrabold text-yellow-300 w-[100px]">
                      {carCode}
                    </td>
                    <td className="p-3 sticky left-[100px] bg-slate-900/80 backdrop-blur z-10 w-[160px]">
                      {driverName}
                    </td>
                    <td className="p-3 sticky left-[260px] bg-slate-900/80 backdrop-blur z-10 w-[220px] text-gray-100 font-semibold">
                      {t.label}
                    </td>

                    {Array.from({ length: 12 }, (_, k) => k + 1).map((month) => {
                      const existing = getExisting(carCode, month);
                      const val = getValue(carCode, month, t.key);
                      const hasAny =
                        toNumber(existing?.maintenanceFee) ||
                        toNumber(existing?.insuranceFee) ||
                        toNumber(existing?.installmentFee);

                      return (
                        <td key={month} className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={val > 0 ? 'text-white font-mono' : 'text-gray-500'}>
                              Rp {rupiah(val)}
                            </span>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-blue-300 hover:bg-blue-500/10"
                              title={hasAny ? 'Edit bulan ini' : 'Isi bulan ini'}
                              onClick={() => onOpenMonth?.(carCode, year, month, existing)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      );
                    })}

                    <td className="p-3 font-extrabold text-emerald-200">
                      Rp {rupiah(yearlyTotal)}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
