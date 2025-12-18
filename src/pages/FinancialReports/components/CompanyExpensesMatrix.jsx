// src/pages/FinancialReports/components/CompanyExpensesMatrix.jsx
import React, { useMemo } from 'react';
import { MONTHS_ID, COMPANY_EXPENSE_FIELDS } from '../constants';
import { rupiah, toNumber } from '../utils';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';

/**
 * expenses: array of {id?, year, month(1..12), staffFee, officeFee, internetFee, promoFee, flyerFee, legalFee}
 * onOpenMonth: (year, month, existingOrNull) => void
 */
export default function CompanyExpensesMatrix({ year, expenses, onOpenMonth, onAddNew }) {
  const index = useMemo(() => {
    const map = new Map(); // month -> row
    for (const row of expenses || []) {
      if (Number(row.year) !== Number(year)) continue;
      map.set(Number(row.month), row);
    }
    return map;
  }, [expenses, year]);

  const getRow = (month) => index.get(month) || null;

  const getVal = (month, key) => {
    const r = getRow(month);
    return toNumber(r?.[key]);
  };

  const totalYearByKey = (key) =>
    Array.from({ length: 12 }, (_, k) => k + 1).reduce((s, m) => s + getVal(m, key), 0);

  const totalMonth = (month) =>
    COMPANY_EXPENSE_FIELDS.reduce((s, f) => s + getVal(month, f.key), 0);

  const grandTotalYear = Array.from({ length: 12 }, (_, k) => k + 1).reduce((s, m) => s + totalMonth(m), 0);

  return (
    <div className="bg-slate-900/70 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
        <div>
          <div className="text-white font-extrabold text-lg">Biaya Perusahaan Bulanan</div>
          <div className="text-xs text-gray-400">Kategori lengkap + Jan–Des + Total Tahun ({year})</div>
        </div>
        <Button onClick={onAddNew} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Tambah Bulan
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left whitespace-nowrap">
          <thead className="bg-slate-950 text-gray-200 uppercase font-extrabold border-b border-slate-800">
            <tr>
              <th className="p-3 sticky left-0 bg-slate-950 z-10">Kategori</th>
              {MONTHS_ID.map((m, idx) => (
                <th key={m} className="p-3">
                  <div className="flex items-center gap-2">
                    {m.substring(0, 3)}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-blue-300 hover:bg-blue-500/10"
                      title="Edit bulan ini"
                      onClick={() => onOpenMonth?.(year, idx + 1, getRow(idx + 1))}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </th>
              ))}
              <th className="p-3">Total Tahun</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 text-gray-200">
            {COMPANY_EXPENSE_FIELDS.map((f, idx) => (
              <tr
                key={f.key}
                className={`transition-colors hover:bg-slate-800/50 ${idx % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-900/10'}`}
              >
                <td className="p-3 sticky left-0 bg-slate-900/80 backdrop-blur z-10 font-semibold text-gray-100">
                  {f.label}
                </td>

                {Array.from({ length: 12 }, (_, k) => k + 1).map((month) => {
                  const v = getVal(month, f.key);
                  return (
                    <td key={month} className="p-3">
                      <span className={v > 0 ? 'text-white font-mono' : 'text-gray-500'}>
                        Rp {rupiah(v)}
                      </span>
                    </td>
                  );
                })}

                <td className="p-3 font-extrabold text-emerald-200">
                  Rp {rupiah(totalYearByKey(f.key))}
                </td>
              </tr>
            ))}

            {/* total per bulan & total tahun */}
            <tr className="bg-slate-950/60">
              <td className="p-3 sticky left-0 bg-slate-950 z-10 font-extrabold text-yellow-300">
                Total / Bulan
              </td>
              {Array.from({ length: 12 }, (_, k) => k + 1).map((month) => (
                <td key={month} className="p-3 font-extrabold text-yellow-200">
                  Rp {rupiah(totalMonth(month))}
                </td>
              ))}
              <td className="p-3 font-extrabold text-yellow-200">
                Rp {rupiah(grandTotalYear)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-gray-400 bg-slate-950">
        Klik ikon <span className="text-gray-200 font-semibold">pensil</span> di header bulan untuk Edit/CRUD bulan tersebut.
      </div>
    </div>
  );
}
