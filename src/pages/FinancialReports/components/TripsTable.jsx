// src/pages/FinancialReports/components/TripsTable.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getMonthName, rupiah, toNumber } from '../utils';
import { itemV } from '../motionPresets';

const fmtPct = (v) => {
  const n = toNumber(v);
  // tampilkan 2 angka desimal biar rapi
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

export default function TripsTable({
  paginated,
  filteredCount,
  page,
  totalPages,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}) {
  return (
    <motion.div variants={itemV} className="bg-slate-900/70 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left whitespace-nowrap">
          <thead className="bg-slate-950 text-gray-200 uppercase font-extrabold border-b border-slate-800">
            <tr>
              <th className="p-3 sticky left-0 bg-slate-950 z-10">Action</th>

              <th className="p-3">Tanggal</th>
              <th className="p-3">Bulan</th>
              <th className="p-3">Tahun</th>

              <th className="p-3">Kode Mobil</th>
              <th className="p-3">Kendaraan</th>
              <th className="p-3">Nama Driver</th>
              <th className="p-3">No Order</th>

              <th className="p-3">Lokasi Asal</th>
              <th className="p-3">Destinasi</th>

              <th className="p-3">Kategori Keberangkatan</th>
              <th className="p-3">Jml Penumpang (Dept)</th>
              <th className="p-3">Tarif Penumpang (Dept)</th>
              <th className="p-3">Jml Paket (Dept)</th>
              <th className="p-3">Tarif Paket (Dept)</th>
              <th className="p-3">ADM % (Dept)</th>
              <th className="p-3">ADM Reguler (Dept)</th>
              <th className="p-3">ADM Rent/Drop (Dept)</th>
              <th className="p-3">Total Admin Dept</th>

              <th className="p-3">Kategori Kepulangan</th>
              <th className="p-3">Jml Penumpang (Ret)</th>
              <th className="p-3">Tarif Penumpang (Ret)</th>
              <th className="p-3">Jml Paket (Ret)</th>
              <th className="p-3">Tarif Paket (Ret)</th>
              <th className="p-3">ADM % (Ret)</th>
              <th className="p-3">ADM Reguler (Ret)</th>
              <th className="p-3">ADM Rent/Drop (Ret)</th>
              <th className="p-3">Total Admin Ret</th>

              <th className="p-3">Total Nominal</th>
              <th className="p-3">Administrasi</th>

              <th className="p-3">BBM Fee</th>
              <th className="p-3">Makan Fee</th>
              <th className="p-3">Fee Kurir</th>
              <th className="p-3">Fee Supir</th>

              <th className="p-3">Profit Netto</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 text-gray-200">
            {paginated.map((t, i) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, type: 'spring', stiffness: 220, damping: 22 }}
                className={`transition-colors hover:bg-slate-800/50 ${i % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-900/10'}`}
              >
                <td className="p-3 sticky left-0 bg-slate-900/80 backdrop-blur z-10">
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-300 hover:bg-blue-500/10" onClick={() => onEdit(t)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-300 hover:bg-rose-500/10" onClick={() => onDelete(t.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>

                <td className="p-3">{t.day}</td>
                <td className="p-3">{getMonthName(t.month)}</td>
                <td className="p-3">{t.year}</td>

                <td className="p-3 font-extrabold text-yellow-300">{t.carCode}</td>
                <td className="p-3">{t.vehicleName || '-'}</td>
                <td className="p-3">{t.driverName}</td>
                <td className="p-3">{t.orderNo}</td>

                <td className="p-3">{t.deptOrigin}</td>
                <td className="p-3">{t.deptDest}</td>

                <td className="p-3">{t.deptCategory}</td>
                <td className="p-3">{t.deptPassengerCount}</td>
                <td className="p-3">Rp {rupiah(t.deptPassengerFare)}</td>
                <td className="p-3">{t.deptPackageCount}</td>
                <td className="p-3">Rp {rupiah(t.deptPackageFare)}</td>
                <td className="p-3">{fmtPct(t.calc_deptAdminPercent)}%</td>
                <td className="p-3 text-rose-200">Rp {rupiah(t.calc_deptAdminReg)}</td>
                <td className="p-3 text-rose-200">Rp {rupiah(t.calc_deptAdminRentDrop)}</td>
                <td className="p-3 text-rose-200 font-extrabold">Rp {rupiah(t.calc_totalAdminKeberangkatan)}</td>

                <td className="p-3">{t.retCategory}</td>
                <td className="p-3">{t.retPassengerCount}</td>
                <td className="p-3">Rp {rupiah(t.retPassengerFare)}</td>
                <td className="p-3">{t.retPackageCount}</td>
                <td className="p-3">Rp {rupiah(t.retPackageFare)}</td>
                <td className="p-3">{fmtPct(t.calc_retAdminPercent)}%</td>
                <td className="p-3 text-rose-200">Rp {rupiah(t.calc_retAdminReg)}</td>
                <td className="p-3 text-rose-200">Rp {rupiah(t.calc_retAdminRentDrop)}</td>
                <td className="p-3 text-rose-200 font-extrabold">Rp {rupiah(t.calc_totalAdminKepulangan)}</td>

                <td className="p-3 font-extrabold text-white">Rp {rupiah(t.calc_totalNominal)}</td>
                <td className="p-3 text-rose-200 font-extrabold">Rp {rupiah(t.calc_totalAdmin)}</td>

                <td className="p-3 text-rose-200">Rp {rupiah(t.bbmFee)}</td>
                <td className="p-3 text-rose-200">Rp {rupiah(t.mealFee)}</td>
                <td className="p-3 text-rose-200">Rp {rupiah(t.courierFee)}</td>
                <td className="p-3 text-emerald-200 font-extrabold">Rp {rupiah(t.calc_driverSalary)}</td>

                <td className="p-3 text-yellow-300 font-extrabold text-base">Rp {rupiah(t.calc_netProfit)}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-extrabold border ${
                      t.paymentStatus === 'Lunas'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {t.paymentStatus}
                  </span>
                </td>
              </motion.tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={999} className="p-10 text-center text-gray-500">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredCount > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-800 bg-slate-950">
          <div className="text-sm text-gray-400">
            Page <span className="text-white font-extrabold">{page}</span> /{' '}
            <span className="text-white font-extrabold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-slate-700 text-gray-200" onClick={onPrev} disabled={page <= 1}>
              Prev
            </Button>
            <Button variant="outline" className="border-slate-700 text-gray-200" onClick={onNext} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
