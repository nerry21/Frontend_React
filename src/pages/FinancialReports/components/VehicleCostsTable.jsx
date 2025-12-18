// src/pages/FinancialReports/components/VehicleCostsTable.jsx
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Save, X, Car } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { MONTHS_ID } from '../constants';
import { ensure12MonthsFromApiRows, rupiah, toNumber } from '../utils';
import { itemV } from '../motionPresets';
import { apiFetch } from '../api';

function monthName(m1to12) {
  return MONTHS_ID[m1to12 - 1] || `Bulan ${m1to12}`;
}

export default function VehicleCostsTable({ carCode, driverName, year, rows, onReload, toast }) {
  const data12 = useMemo(() => ensure12MonthsFromApiRows(rows || [], (r) => Number(r.month)), [rows]);

  const totalMaintenance = data12.reduce((s, r) => s + toNumber(r.maintenanceFee), 0);
  const totalInsurance = data12.reduce((s, r) => s + toNumber(r.insuranceFee), 0);
  const totalInstallment = data12.reduce((s, r) => s + toNumber(r.installmentFee), 0);
  const totalAll = totalMaintenance + totalInsurance + totalInstallment;

  const [open, setOpen] = useState(false);
  const [editingMonth, setEditingMonth] = useState(null);
  const [editingRow, setEditingRow] = useState(null); // simpan row yg diedit (biar bisa delete by id)

  const [form, setForm] = useState({
    maintenanceFee: 0,
    insuranceFee: 0,
    installmentFee: 0,
  });

  const openEdit = (mRow) => {
    setEditingMonth(Number(mRow.month));
    setEditingRow(mRow);
    setForm({
      maintenanceFee: toNumber(mRow.maintenanceFee),
      insuranceFee: toNumber(mRow.insuranceFee),
      installmentFee: toNumber(mRow.installmentFee),
    });
    setOpen(true);
  };

  const doUpsert = async () => {
    try {
      await apiFetch('/api/vehicle-costs', {
        method: 'POST',
        body: JSON.stringify({
          carCode,
          driverName,
          year: Number(year),
          month: Number(editingMonth), // 1..12
          maintenanceFee: Number(form.maintenanceFee || 0),
          insuranceFee: Number(form.insuranceFee || 0),
          installmentFee: Number(form.installmentFee || 0),
        }),
      });

      toast?.({ title: 'Biaya mobil tersimpan', description: `${carCode} • ${monthName(editingMonth)} • ${year}` });
      setOpen(false);
      setEditingMonth(null);
      setEditingRow(null);
      onReload?.();
    } catch (e) {
      toast?.({ title: 'Gagal simpan biaya mobil', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  const doDeleteOrReset = async (mRow) => {
    const m = Number(mRow.month);
    if (!window.confirm(`Hapus/Reset biaya bulan ${monthName(m)}?`)) return;

    // ✅ kalau ada id -> DELETE /api/vehicle-costs/:id
    try {
      if (mRow.id) {
        await apiFetch(`/api/vehicle-costs/${mRow.id}`, { method: 'DELETE' });
        toast?.({ title: 'Biaya mobil dihapus', description: `${carCode} • ${monthName(m)} • ${year}` });
        onReload?.();
        return;
      }
    } catch (e) {
      // fallback reset 0
    }

    // fallback: upsert 0
    try {
      await apiFetch('/api/vehicle-costs', {
        method: 'POST',
        body: JSON.stringify({
          carCode,
          driverName,
          year: Number(year),
          month: Number(m),
          maintenanceFee: 0,
          insuranceFee: 0,
          installmentFee: 0,
        }),
      });
      toast?.({ title: 'Biaya mobil direset (0)', description: `${carCode} • ${monthName(m)} • ${year}` });
      onReload?.();
    } catch (e) {
      toast?.({ title: 'Gagal reset biaya mobil', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  return (
    <motion.div variants={itemV} className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-300" />
            <h3 className="text-xl font-extrabold text-white">Biaya Bulanan Mobil (12 Bulan)</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Kode Mobil: <span className="text-white font-extrabold">{carCode}</span> • Driver:{' '}
            <span className="text-white font-extrabold">{driverName || '-'}</span> • Tahun:{' '}
            <span className="text-white font-extrabold">{year}</span>
          </p>
        </div>

        <div className="text-right text-xs text-gray-300">
          <div>Total Pemeliharaan: <span className="text-white font-extrabold">Rp {rupiah(totalMaintenance)}</span></div>
          <div>Total Asuransi: <span className="text-white font-extrabold">Rp {rupiah(totalInsurance)}</span></div>
          <div>Total Cicilan: <span className="text-white font-extrabold">Rp {rupiah(totalInstallment)}</span></div>
          <div className="mt-1 text-yellow-300 font-extrabold">Total Tahun: Rp {rupiah(totalAll)}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-slate-950 text-gray-200 uppercase font-extrabold border-b border-slate-800">
            <tr>
              <th className="p-3">Aksi</th>
              <th className="p-3">Bulan</th>
              <th className="p-3">Kode Mobil</th>
              <th className="p-3">Driver</th>
              <th className="p-3">Pemeliharaan</th>
              <th className="p-3">Asuransi</th>
              <th className="p-3">Cicilan</th>
              <th className="p-3">Total Bulan</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 text-gray-200">
            {data12.map((r) => {
              const m = Number(r.month);
              const a = toNumber(r.maintenanceFee);
              const b = toNumber(r.insuranceFee);
              const c = toNumber(r.installmentFee);
              const total = a + b + c;

              return (
                <tr key={m} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-300 hover:bg-blue-500/10" onClick={() => openEdit(r)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-300 hover:bg-rose-500/10" onClick={() => doDeleteOrReset(r)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3 font-extrabold text-white">{monthName(m)}</td>
                  <td className="p-3 text-yellow-300 font-extrabold">{carCode}</td>
                  <td className="p-3">{driverName || '-'}</td>
                  <td className="p-3">Rp {rupiah(a)}</td>
                  <td className="p-3">Rp {rupiah(b)}</td>
                  <td className="p-3">Rp {rupiah(c)}</td>
                  <td className="p-3 text-emerald-200 font-extrabold">Rp {rupiah(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              Edit Biaya Mobil • {carCode} • {monthName(editingMonth || 1)} • {year}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Pemeliharaan</Label>
                <Input
                  type="number"
                  value={form.maintenanceFee}
                  onChange={(e) => setForm((p) => ({ ...p, maintenanceFee: Number(e.target.value) }))}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <Label>Asuransi</Label>
                <Input
                  type="number"
                  value={form.insuranceFee}
                  onChange={(e) => setForm((p) => ({ ...p, insuranceFee: Number(e.target.value) }))}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <Label>Cicilan</Label>
                <Input
                  type="number"
                  value={form.installmentFee}
                  onChange={(e) => setForm((p) => ({ ...p, installmentFee: Number(e.target.value) }))}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="text-xs text-gray-400">
              Total bulan ini:{' '}
              <span className="text-white font-extrabold">
                Rp {rupiah(toNumber(form.maintenanceFee) + toNumber(form.insuranceFee) + toNumber(form.installmentFee))}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-700 text-gray-200">
              <X className="w-4 h-4 mr-2" /> Batal
            </Button>
            <Button onClick={doUpsert} className="bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold">
              <Save className="w-4 h-4 mr-2" /> Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
