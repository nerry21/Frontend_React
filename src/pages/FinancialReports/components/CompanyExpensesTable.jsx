// src/pages/FinancialReports/components/CompanyExpensesTable.jsx
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Save, X, Building2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { MONTHS_ID } from '../constants';
import { rupiah, toNumber } from '../utils';
import { itemV } from '../motionPresets';
import { apiFetch } from '../api';

function monthName(m1to12) {
  return MONTHS_ID[m1to12 - 1] || `Bulan ${m1to12}`;
}

// bikin 12 bulan, id tetap kebawa
function build12(rows) {
  const map = new Map(); // month -> row
  for (const r of rows || []) {
    const m = Number(r.month);
    if (m >= 1 && m <= 12) map.set(m, r);
  }
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const r = map.get(m) || {};
    return {
      id: r.id ?? null,
      month: m,
      staffFee: toNumber(r.staffFee),
      officeFee: toNumber(r.officeFee),
      internetFee: toNumber(r.internetFee),
      promoFee: toNumber(r.promoFee),
      flyerFee: toNumber(r.flyerFee),
      legalFee: toNumber(r.legalFee),
    };
  });
}

export default function CompanyExpensesTable({ year, rows, onReload, toast }) {
  const data12 = useMemo(() => build12(rows || []), [rows]);

  const totals = useMemo(() => {
    const sum = { staff: 0, office: 0, internet: 0, promo: 0, flyer: 0, legal: 0 };
    for (const r of data12) {
      sum.staff += toNumber(r.staffFee);
      sum.office += toNumber(r.officeFee);
      sum.internet += toNumber(r.internetFee);
      sum.promo += toNumber(r.promoFee);
      sum.flyer += toNumber(r.flyerFee);
      sum.legal += toNumber(r.legalFee);
    }
    const totalAll = Object.values(sum).reduce((a, b) => a + b, 0);
    return { ...sum, totalAll };
  }, [data12]);

  const [open, setOpen] = useState(false);
  const [editingMonth, setEditingMonth] = useState(1);

  const [form, setForm] = useState({
    staffFee: 0,
    officeFee: 0,
    internetFee: 0,
    promoFee: 0,
    flyerFee: 0,
    legalFee: 0,
  });

  const totalMonth = (f) =>
    toNumber(f.staffFee) +
    toNumber(f.officeFee) +
    toNumber(f.internetFee) +
    toNumber(f.promoFee) +
    toNumber(f.flyerFee) +
    toNumber(f.legalFee);

  const openEdit = (mRow) => {
    setEditingMonth(Number(mRow.month));
    setForm({
      staffFee: toNumber(mRow.staffFee),
      officeFee: toNumber(mRow.officeFee),
      internetFee: toNumber(mRow.internetFee),
      promoFee: toNumber(mRow.promoFee),
      flyerFee: toNumber(mRow.flyerFee),
      legalFee: toNumber(mRow.legalFee),
    });
    setOpen(true);
  };

  const openAdd = () => {
    setEditingMonth(1);
    setForm({ staffFee: 0, officeFee: 0, internetFee: 0, promoFee: 0, flyerFee: 0, legalFee: 0 });
    setOpen(true);
  };

  const doUpsert = async () => {
    try {
      await apiFetch('/company-expenses', {
        method: 'POST',
        body: JSON.stringify({
          year: Number(year),
          month: Number(editingMonth), // 1..12
          staffFee: Number(form.staffFee || 0),
          officeFee: Number(form.officeFee || 0),
          internetFee: Number(form.internetFee || 0),
          promoFee: Number(form.promoFee || 0),
          flyerFee: Number(form.flyerFee || 0),
          legalFee: Number(form.legalFee || 0),
        }),
      });

      toast?.({ title: 'Pengeluaran perusahaan tersimpan', description: `${monthName(editingMonth)} • ${year}` });
      setOpen(false);
      onReload?.();
    } catch (e) {
      toast?.({ title: 'Gagal simpan pengeluaran perusahaan', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  const doDelete = async (mRow) => {
    const m = Number(mRow.month);
    if (!window.confirm(`Hapus pengeluaran ${monthName(m)}?`)) return;

    // cari id dari rows asli (kalau ada)
    const found = (rows || []).find((x) => Number(x.month) === m);
    const id = found?.id;

    try {
      if (id) {
        await apiFetch(`/company-expenses/${id}`, { method: 'DELETE' }); // ✅ sesuai backend
        toast?.({ title: 'Pengeluaran dihapus', description: `${monthName(m)} • ${year}`, variant: 'destructive' });
        onReload?.();
        return;
      }
    } catch (e) {
      toast?.({ title: 'Gagal hapus', description: String(e?.message || e), variant: 'destructive' });
      return;
    }

    // fallback: reset 0 (kalau belum ada id)
    try {
      await apiFetch('/company-expenses', {
        method: 'POST',
        body: JSON.stringify({
          year: Number(year),
          month: Number(m),
          staffFee: 0,
          officeFee: 0,
          internetFee: 0,
          promoFee: 0,
          flyerFee: 0,
          legalFee: 0,
        }),
      });
      toast?.({ title: 'Pengeluaran direset (0)', description: `${monthName(m)} • ${year}` });
      onReload?.();
    } catch (e) {
      toast?.({ title: 'Gagal reset', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  return (
    <motion.div variants={itemV} className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-yellow-300" />
            <h3 className="text-xl font-extrabold text-white">Pengeluaran Bulanan Perusahaan (12 Bulan)</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Tahun: <span className="text-white font-extrabold">{year}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Tambah / Isi Bulan
          </Button>

          <div className="text-right text-xs text-gray-300">
            <div>Staff: <span className="text-white font-extrabold">Rp {rupiah(totals.staff)}</span></div>
            <div>Kantor: <span className="text-white font-extrabold">Rp {rupiah(totals.office)}</span></div>
            <div>Internet: <span className="text-white font-extrabold">Rp {rupiah(totals.internet)}</span></div>
            <div>Promo: <span className="text-white font-extrabold">Rp {rupiah(totals.promo)}</span></div>
            <div>Flyer: <span className="text-white font-extrabold">Rp {rupiah(totals.flyer)}</span></div>
            <div>Legal: <span className="text-white font-extrabold">Rp {rupiah(totals.legal)}</span></div>
            <div className="mt-1 text-yellow-300 font-extrabold">Total Tahun: Rp {rupiah(totals.totalAll)}</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-slate-950 text-gray-200 uppercase font-extrabold border-b border-slate-800">
            <tr>
              <th className="p-3">Aksi</th>
              <th className="p-3">Bulan</th>
              <th className="p-3">Gaji Admin/Staff</th>
              <th className="p-3">Beban Kantor</th>
              <th className="p-3">Internet & Komunikasi</th>
              <th className="p-3">Promosi & Iklan</th>
              <th className="p-3">Cetak & Desain Flyer</th>
              <th className="p-3">Perizinan & Legalitas</th>
              <th className="p-3">Total Bulan</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800 text-gray-200">
            {data12.map((r) => {
              const m = Number(r.month);
              const t = totalMonth(r);

              return (
                <tr key={m} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-300 hover:bg-blue-500/10" onClick={() => openEdit(r)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-300 hover:bg-rose-500/10" onClick={() => doDelete(r)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3 font-extrabold text-white">{monthName(m)}</td>
                  <td className="p-3">Rp {rupiah(r.staffFee)}</td>
                  <td className="p-3">Rp {rupiah(r.officeFee)}</td>
                  <td className="p-3">Rp {rupiah(r.internetFee)}</td>
                  <td className="p-3">Rp {rupiah(r.promoFee)}</td>
                  <td className="p-3">Rp {rupiah(r.flyerFee)}</td>
                  <td className="p-3">Rp {rupiah(r.legalFee)}</td>
                  <td className="p-3 text-emerald-200 font-extrabold">Rp {rupiah(t)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT/ADD */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              Input Pengeluaran • {year}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Bulan</Label>
                <select
                  className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                  value={editingMonth}
                  onChange={(e) => setEditingMonth(Number(e.target.value))}
                >
                  {MONTHS_ID.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {idx + 1} — {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Gaji Admin/Staff</Label>
                <Input type="number" value={form.staffFee}
                  onChange={(e) => setForm((p) => ({ ...p, staffFee: Number(e.target.value) }))}
                  className="bg-slate-950 border-slate-700 rounded-xl" />
              </div>
              <div>
                <Label>Beban Kantor</Label>
                <Input type="number" value={form.officeFee}
                  onChange={(e) => setForm((p) => ({ ...p, officeFee: Number(e.target.value) }))}
                  className="bg-slate-950 border-slate-700 rounded-xl" />
              </div>
              <div>
                <Label>Internet & Komunikasi</Label>
                <Input type="number" value={form.internetFee}
                  onChange={(e) => setForm((p) => ({ ...p, internetFee: Number(e.target.value) }))}
                  className="bg-slate-950 border-slate-700 rounded-xl" />
              </div>

              <div>
                <Label>Promosi & Iklan</Label>
                <Input type="number" value={form.promoFee}
                  onChange={(e) => setForm((p) => ({ ...p, promoFee: Number(e.target.value) }))}
                  className="bg-slate-950 border-slate-700 rounded-xl" />
              </div>
              <div>
                <Label>Cetak & Desain Flyer</Label>
                <Input type="number" value={form.flyerFee}
                  onChange={(e) => setForm((p) => ({ ...p, flyerFee: Number(e.target.value) }))}
                  className="bg-slate-950 border-slate-700 rounded-xl" />
              </div>
              <div>
                <Label>Perizinan & Legalitas</Label>
                <Input type="number" value={form.legalFee}
                  onChange={(e) => setForm((p) => ({ ...p, legalFee: Number(e.target.value) }))}
                  className="bg-slate-950 border-slate-700 rounded-xl" />
              </div>
            </div>

            <div className="text-xs text-gray-400">
              Total bulan ini: <span className="text-white font-extrabold">Rp {rupiah(totalMonth(form))}</span>
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
