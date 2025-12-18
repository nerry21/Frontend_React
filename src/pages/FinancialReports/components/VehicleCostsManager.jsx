// src/pages/FinancialReports/components/VehicleCostsManager.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Save, Trash2, PencilLine } from 'lucide-react';
import { apiFetch } from '../api';
import { rupiah, toNumber } from '../utils';

function build12MonthRows(MONTHS_ID, existing = []) {
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
      carCode: row.carCode ?? '',
      driverName: row.driverName ?? '',
      maintenanceFee: toNumber(row.maintenanceFee),
      insuranceFee: toNumber(row.insuranceFee),
      installmentFee: toNumber(row.installmentFee),
    };
  });
}

export default function VehicleCostsManager({ open, onOpenChange, carCode, year, MONTHS_ID, YEARS, DRIVERS }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingMonth, setSavingMonth] = useState(null);
  const [rows, setRows] = useState(() => build12MonthRows(MONTHS_ID, []));
  const [yearSummary, setYearSummary] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const totals = useMemo(() => {
    const maintenance = rows.reduce((s, r) => s + toNumber(r.maintenanceFee), 0);
    const insurance = rows.reduce((s, r) => s + toNumber(r.insuranceFee), 0);
    const installment = rows.reduce((s, r) => s + toNumber(r.installmentFee), 0);
    return { maintenance, insurance, installment, total: maintenance + insurance + installment };
  }, [rows]);

  useEffect(() => {
    if (!open) return;
    if (!carCode || carCode === 'ALL') return;

    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/vehicle-costs?carCode=${encodeURIComponent(carCode)}&year=${encodeURIComponent(year)}`);
        if (!alive) return;
        const arr = Array.isArray(data) ? data : [];
        setRows(build12MonthRows(MONTHS_ID, arr));
      } catch (e) {
        if (!alive) return;
        setRows(build12MonthRows(MONTHS_ID, []));
        toast({
          title: 'Gagal ambil biaya mobil',
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
  }, [open, carCode, year, MONTHS_ID, toast]);

  useEffect(() => {
    if (!open) return;
    if (!carCode || carCode === 'ALL') return;

    let alive = true;
    async function loadYearSummary() {
      try {
        const all = await Promise.all(
          YEARS.map(async (y) => {
            try {
              const data = await apiFetch(`/api/vehicle-costs?carCode=${encodeURIComponent(carCode)}&year=${encodeURIComponent(y)}`);
              const arr = Array.isArray(data) ? data : [];
              const maintenance = arr.reduce((s, r) => s + toNumber(r.maintenanceFee), 0);
              const insurance = arr.reduce((s, r) => s + toNumber(r.insuranceFee), 0);
              const installment = arr.reduce((s, r) => s + toNumber(r.installmentFee), 0);
              return { year: y, maintenance, insurance, installment, total: maintenance + insurance + installment };
            } catch {
              return { year: y, maintenance: 0, insurance: 0, installment: 0, total: 0, failed: true };
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
  }, [open, carCode, YEARS]);

  const saveRow = async (r) => {
    setSavingMonth(r.month);
    try {
      const payload = {
        carCode: String(carCode || '').trim(),
        driverName: String(r.driverName || '').trim(),
        year: Number(year),
        month: Number(r.month), // 1..12
        maintenanceFee: Number(r.maintenanceFee || 0),
        insuranceFee: Number(r.insuranceFee || 0),
        installmentFee: Number(r.installmentFee || 0),
      };

      await apiFetch('/api/vehicle-costs', { method: 'POST', body: JSON.stringify(payload) });

      toast({ title: 'Biaya mobil tersimpan', description: `Bulan ${r.month} (${r.monthName})` });
    } catch (e) {
      toast({
        title: 'Gagal simpan biaya mobil',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    } finally {
      setSavingMonth(null);
    }
  };

  const deleteRow = async (r) => {
    if (!window.confirm(`Hapus biaya mobil bulan ${r.month} (${r.monthName})?`)) return;

    try {
      if (r.id) {
        await apiFetch(`/api/vehicle-costs/${r.id}`, { method: 'DELETE' });
      } else {
        // fallback: clear by upsert zeros
        await apiFetch('/api/vehicle-costs', {
          method: 'POST',
          body: JSON.stringify({
            carCode: String(carCode || '').trim(),
            driverName: String(r.driverName || '').trim(),
            year: Number(year),
            month: Number(r.month),
            maintenanceFee: 0,
            insuranceFee: 0,
            installmentFee: 0,
          }),
        });
      }

      setRows((prev) =>
        prev.map((x) =>
          x.month === r.month ? { ...x, id: null, maintenanceFee: 0, insuranceFee: 0, installmentFee: 0 } : x
        )
      );
      toast({ title: 'Biaya mobil dihapus/di-clear', variant: 'destructive' });
    } catch (e) {
      toast({
        title: 'Gagal hapus biaya mobil',
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
            <DialogTitle className="text-2xl font-extrabold">
              Biaya Bulanan Mobil — {carCode} / {year}
            </DialogTitle>
          </DialogHeader>

          <div className="text-xs text-gray-400">
            Kolom: Kode Mobil, Driver, Pemeliharaan, Asuransi, Cicilan — per bulan (12) dan ringkasan per tahun (2025–2030).
          </div>

          <div className="mt-4 bg-slate-950/40 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="text-xs uppercase bg-slate-950 border-b border-slate-800 text-gray-200">
                <tr>
                  <th className="p-3">Bulan</th>
                  <th className="p-3">Kode Mobil</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Pemeliharaan</th>
                  <th className="p-3">Asuransi</th>
                  <th className="p-3">Cicilan</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.month} className="hover:bg-slate-800/40">
                    <td className="p-3 text-gray-200">{r.month} — {r.monthName}</td>
                    <td className="p-3 text-yellow-300 font-extrabold">{carCode}</td>
                    <td className="p-3 text-gray-200">{r.driverName || '-'}</td>
                    <td className="p-3 text-gray-200">Rp {rupiah(r.maintenanceFee)}</td>
                    <td className="p-3 text-gray-200">Rp {rupiah(r.insuranceFee)}</td>
                    <td className="p-3 text-gray-200">Rp {rupiah(r.installmentFee)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-slate-700 text-gray-200" onClick={() => openEdit(r)}>
                          <PencilLine className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/40 text-red-300 hover:bg-red-950" onClick={() => deleteRow(r)}>
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
                  <td className="p-3 font-extrabold text-gray-100" colSpan={3}>TOTAL (tahun {year})</td>
                  <td className="p-3 font-extrabold text-gray-100">Rp {rupiah(totals.maintenance)}</td>
                  <td className="p-3 font-extrabold text-gray-100">Rp {rupiah(totals.insurance)}</td>
                  <td className="p-3 font-extrabold text-gray-100">Rp {rupiah(totals.installment)}</td>
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
                    <th className="p-3">Pemeliharaan</th>
                    <th className="p-3">Asuransi</th>
                    <th className="p-3">Cicilan</th>
                    <th className="p-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {yearSummary.map((y) => (
                    <tr key={y.year} className="hover:bg-slate-800/40">
                      <td className="p-3 text-gray-200 font-extrabold">{y.year}</td>
                      <td className="p-3 text-gray-200">Rp {rupiah(y.maintenance)}</td>
                      <td className="p-3 text-gray-200">Rp {rupiah(y.insurance)}</td>
                      <td className="p-3 text-gray-200">Rp {rupiah(y.installment)}</td>
                      <td className="p-3 text-yellow-300 font-extrabold">Rp {rupiah(y.total)}</td>
                    </tr>
                  ))}
                  {yearSummary.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-gray-500">Tidak ada ringkasan.</td>
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
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">
              Edit Biaya Mobil — {carCode} / {year} / Bulan {editRow?.month} ({editRow?.monthName})
            </DialogTitle>
          </DialogHeader>

          {editRow && (
            <div className="space-y-3">
              <div className="text-xs text-gray-400">Isi biaya per bulan, lalu Save.</div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Driver</div>
                <select
                  className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                  value={editRow.driverName || ''}
                  onChange={(e) => setEditRow((p) => ({ ...p, driverName: e.target.value }))}
                >
                  <option value="">-- pilih driver --</option>
                  {DRIVERS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Pemeliharaan</div>
                  <Input
                    type="number"
                    value={editRow.maintenanceFee}
                    onChange={(e) => setEditRow((p) => ({ ...p, maintenanceFee: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Asuransi</div>
                  <Input
                    type="number"
                    value={editRow.insuranceFee}
                    onChange={(e) => setEditRow((p) => ({ ...p, insuranceFee: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Cicilan</div>
                  <Input
                    type="number"
                    value={editRow.installmentFee}
                    onChange={(e) => setEditRow((p) => ({ ...p, installmentFee: Number(e.target.value) }))}
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
