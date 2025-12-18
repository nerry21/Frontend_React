// src/pages/FinancialReports/components/CompanyExpensesManager.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Save, Trash2, PencilLine } from 'lucide-react';
import { apiFetch } from '../api';
import { rupiah, toNumber } from '../utils';

function build12MonthRows(MONTHS_ID, existing = []) {
  // existing month format assumed 1..12 (backend)
  const byMonth = new Map();
  for (const r of existing || []) {
    const m = Number(r.month); // 1..12
    if (Number.isFinite(m)) byMonth.set(m, r);
  }

  return MONTHS_ID.map((name, idx) => {
    const month = idx + 1;
    const row = byMonth.get(month) || {};
    return {
      id: row.id ?? null,
      month,
      monthName: name,
      staffFee: toNumber(row.staffFee),
      officeFee: toNumber(row.officeFee),
      internetFee: toNumber(row.internetFee),
      promoFee: toNumber(row.promoFee),
      flyerFee: toNumber(row.flyerFee),
      legalFee: toNumber(row.legalFee),
    };
  });
}

export default function CompanyExpensesManager({ open, onOpenChange, year, MONTHS_ID, YEARS }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingMonth, setSavingMonth] = useState(null);
  const [rows, setRows] = useState(() => build12MonthRows(MONTHS_ID, []));
  const [yearSummary, setYearSummary] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const totals = useMemo(() => {
    const sum = {
      staff: rows.reduce((s, r) => s + toNumber(r.staffFee), 0),
      office: rows.reduce((s, r) => s + toNumber(r.officeFee), 0),
      internet: rows.reduce((s, r) => s + toNumber(r.internetFee), 0),
      promo: rows.reduce((s, r) => s + toNumber(r.promoFee), 0),
      flyer: rows.reduce((s, r) => s + toNumber(r.flyerFee), 0),
      legal: rows.reduce((s, r) => s + toNumber(r.legalFee), 0),
    };
    return { ...sum, total: Object.values(sum).reduce((a, b) => a + b, 0) };
  }, [rows]);

  useEffect(() => {
    if (!open) return;

    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const data = await apiFetch(`/company-expenses?year=${encodeURIComponent(year)}`);
        if (!alive) return;
        const arr = Array.isArray(data) ? data : [];
        setRows(build12MonthRows(MONTHS_ID, arr));
      } catch (e) {
        if (!alive) return;
        setRows(build12MonthRows(MONTHS_ID, []));
        toast({
          title: 'Gagal ambil biaya perusahaan',
          description: String(e?.message || e),
          variant: 'destructive',
        });
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [open, year, MONTHS_ID, toast]);

  useEffect(() => {
    if (!open) return;

    let alive = true;

    async function loadYearSummary() {
      try {
        const all = await Promise.all(
          YEARS.map(async (y) => {
            try {
              const data = await apiFetch(`/company-expenses?year=${encodeURIComponent(y)}`);
              const arr = Array.isArray(data) ? data : [];
              const staff = arr.reduce((s, r) => s + toNumber(r.staffFee), 0);
              const office = arr.reduce((s, r) => s + toNumber(r.officeFee), 0);
              const internet = arr.reduce((s, r) => s + toNumber(r.internetFee), 0);
              const promo = arr.reduce((s, r) => s + toNumber(r.promoFee), 0);
              const flyer = arr.reduce((s, r) => s + toNumber(r.flyerFee), 0);
              const legal = arr.reduce((s, r) => s + toNumber(r.legalFee), 0);
              const total = staff + office + internet + promo + flyer + legal;
              return { year: y, staff, office, internet, promo, flyer, legal, total };
            } catch {
              return { year: y, staff: 0, office: 0, internet: 0, promo: 0, flyer: 0, legal: 0, total: 0, failed: true };
            }
          })
        );
        if (!alive) return;
        setYearSummary(all);
      } catch {
        if (!alive) return;
        setYearSummary([]);
      }
    }

    loadYearSummary();
    return () => {
      alive = false;
    };
  }, [open, YEARS]);

  const saveRow = async (r) => {
    setSavingMonth(r.month);
    try {
      const payload = {
        year: Number(year),
        month: Number(r.month), // 1..12
        staffFee: Number(r.staffFee || 0),
        officeFee: Number(r.officeFee || 0),
        internetFee: Number(r.internetFee || 0),
        promoFee: Number(r.promoFee || 0),
        flyerFee: Number(r.flyerFee || 0),
        legalFee: Number(r.legalFee || 0),
      };

      await apiFetch('/company-expenses', { method: 'POST', body: JSON.stringify(payload) });
      toast({ title: 'Biaya perusahaan tersimpan', description: `Bulan ${r.month} (${r.monthName})` });
    } catch (e) {
      toast({
        title: 'Gagal simpan biaya perusahaan',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    } finally {
      setSavingMonth(null);
    }
  };

  const deleteRow = async (r) => {
    if (!window.confirm(`Hapus biaya perusahaan bulan ${r.month} (${r.monthName})?`)) return;

    try {
      if (r.id) {
        await apiFetch(`/company-expenses/${r.id}`, { method: 'DELETE' });
      } else {
        // fallback: clear by upsert zeros
        await apiFetch('/company-expenses', {
          method: 'POST',
          body: JSON.stringify({
            year: Number(year),
            month: Number(r.month),
            staffFee: 0,
            officeFee: 0,
            internetFee: 0,
            promoFee: 0,
            flyerFee: 0,
            legalFee: 0,
          }),
        });
      }

      setRows((prev) =>
        prev.map((x) =>
          x.month === r.month
            ? { ...x, id: null, staffFee: 0, officeFee: 0, internetFee: 0, promoFee: 0, flyerFee: 0, legalFee: 0 }
            : x
        )
      );
      toast({ title: 'Biaya perusahaan dihapus/di-clear', variant: 'destructive' });
    } catch (e) {
      toast({
        title: 'Gagal hapus biaya perusahaan',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    }
  };

  const openEdit = (r) => {
    setEditRow({ ...r });
    setEditOpen(true);
  };

  const commitEdit = async () => {
    const r = editRow;
    if (!r) return;
    await saveRow(r);
    setRows((prev) => prev.map((x) => (x.month === r.month ? { ...x, ...r } : x)));
    setEditOpen(false);
    setEditRow(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Biaya Bulanan Perusahaan — {year}</DialogTitle>
          </DialogHeader>

          <div className="text-xs text-gray-400">
            Kolom: Gaji Admin/Staff, Beban Kantor, Internet/Komunikasi, Promosi/Iklan, Cetak/Desain Flyer, Perizinan/Legal — per bulan (12) dan ringkasan per tahun (2025–2030).
          </div>

          <div className="mt-4 bg-slate-950/40 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="text-xs uppercase bg-slate-950 border-b border-slate-800 text-gray-200">
                <tr>
                  <th className="p-3">Bulan</th>
                  <th className="p-3">Gaji Admin/Staff</th>
                  <th className="p-3">Beban Kantor</th>
                  <th className="p-3">Internet/Komunikasi</th>
                  <th className="p-3">Promosi/Iklan</th>
                  <th className="p-3">Cetak/Desain Flyer</th>
                  <th className="p-3">Perizinan/Legal</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.month} className="hover:bg-slate-800/40">
                    <td className="p-3 text-gray-200">{r.month} — {r.monthName}</td>
                    <td className="p-3 text-gray-200">Rp {rupiah(r.staffFee)}</td>
                    <td className="p-3 text-gray-200">Rp {rupiah(r.officeFee)}</td>
                    <td className="p-3 text-gray-200">Rp {rupiah(r.internetFee)}</td>
                    <td className="p-3 text-gray-200">Rp {rupiah(r.promoFee)}</td>
                    <td className="p-3 text-gray-200">Rp {rupiah(r.flyerFee)}</td>
                    <td className="p-3 text-gray-200">Rp {rupiah(r.legalFee)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700 text-gray-200"
                          onClick={() => openEdit(r)}
                        >
                          <PencilLine className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-300 hover:bg-red-950"
                          onClick={() => deleteRow(r)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                        <Button
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold"
                          onClick={() => saveRow(r)}
                          disabled={savingMonth === r.month}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {savingMonth === r.month ? 'Saving...' : 'Quick Save'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                <tr className="bg-slate-900/50">
                  <td className="p-3 font-extrabold text-gray-100">TOTAL (tahun {year})</td>
                  <td className="p-3 font-extrabold text-gray-100">Rp {rupiah(totals.staff)}</td>
                  <td className="p-3 font-extrabold text-gray-100">Rp {rupiah(totals.office)}</td>
                  <td className="p-3 font-extrabold text-gray-100">Rp {rupiah(totals.internet)}</td>
                  <td className="p-3 font-extrabold text-gray-100">Rp {rupiah(totals.promo)}</td>
                  <td className="p-3 font-extrabold text-gray-100">Rp {rupiah(totals.flyer)}</td>
                  <td className="p-3 font-extrabold text-gray-100">Rp {rupiah(totals.legal)}</td>
                  <td className="p-3 font-extrabold text-yellow-300">Rp {rupiah(totals.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <div className="text-sm font-extrabold text-white mb-2">Ringkasan Biaya per Tahun (2025–2030)</div>
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="text-xs uppercase bg-slate-950 border-b border-slate-800 text-gray-200">
                  <tr>
                    <th className="p-3">Tahun</th>
                    <th className="p-3">Staff</th>
                    <th className="p-3">Kantor</th>
                    <th className="p-3">Internet</th>
                    <th className="p-3">Promo</th>
                    <th className="p-3">Flyer</th>
                    <th className="p-3">Legal</th>
                    <th className="p-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {yearSummary.map((y) => (
                    <tr key={y.year} className="hover:bg-slate-800/40">
                      <td className="p-3 text-gray-200 font-extrabold">{y.year}</td>
                      <td className="p-3 text-gray-200">Rp {rupiah(y.staff)}</td>
                      <td className="p-3 text-gray-200">Rp {rupiah(y.office)}</td>
                      <td className="p-3 text-gray-200">Rp {rupiah(y.internet)}</td>
                      <td className="p-3 text-gray-200">Rp {rupiah(y.promo)}</td>
                      <td className="p-3 text-gray-200">Rp {rupiah(y.flyer)}</td>
                      <td className="p-3 text-gray-200">Rp {rupiah(y.legal)}</td>
                      <td className="p-3 text-yellow-300 font-extrabold">Rp {rupiah(y.total)}</td>
                    </tr>
                  ))}
                  {yearSummary.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-gray-500">Tidak ada ringkasan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-slate-700 text-gray-200" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {loading && <div className="text-xs text-gray-400">Memuat...</div>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal per-bulan */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              Edit Biaya Perusahaan — {year} / Bulan {editRow?.month} ({editRow?.monthName})
            </DialogTitle>
          </DialogHeader>

          {editRow && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Gaji Admin/Staff</div>
                  <Input
                    type="number"
                    value={editRow.staffFee}
                    onChange={(e) => setEditRow((p) => ({ ...p, staffFee: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Beban Kantor</div>
                  <Input
                    type="number"
                    value={editRow.officeFee}
                    onChange={(e) => setEditRow((p) => ({ ...p, officeFee: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Internet/Komunikasi</div>
                  <Input
                    type="number"
                    value={editRow.internetFee}
                    onChange={(e) => setEditRow((p) => ({ ...p, internetFee: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Promosi/Iklan</div>
                  <Input
                    type="number"
                    value={editRow.promoFee}
                    onChange={(e) => setEditRow((p) => ({ ...p, promoFee: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Cetak/Desain Flyer</div>
                  <Input
                    type="number"
                    value={editRow.flyerFee}
                    onChange={(e) => setEditRow((p) => ({ ...p, flyerFee: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Perizinan/Legal</div>
                  <Input
                    type="number"
                    value={editRow.legalFee}
                    onChange={(e) => setEditRow((p) => ({ ...p, legalFee: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="border-slate-700 text-gray-200" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold" onClick={commitEdit}>
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
