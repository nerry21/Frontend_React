// src/pages/FinancialReports/components/VehicleCostModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Trash2 } from 'lucide-react';
import { CAR_CODES, DRIVERS, MONTHS_ID, YEARS } from '../constants';
import { toNumber } from '../utils';

export default function VehicleCostModal({ open, onOpenChange, initialValue, onSave, onDelete }) {
  const [v, setV] = useState(initialValue || null);

  useEffect(() => {
    setV(initialValue || null);
  }, [initialValue]);

  const canDelete = useMemo(() => Boolean(v?.id), [v?.id]);

  if (!v) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {v?.id ? 'Edit Biaya Mobil (Bulanan)' : 'Tambah Biaya Mobil (Bulanan)'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
            <div>
              <Label>Tahun</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={v.year}
                onChange={(e) => setV((p) => ({ ...p, year: Number(e.target.value) }))}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Bulan</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={v.month}
                onChange={(e) => setV((p) => ({ ...p, month: Number(e.target.value) }))}
              >
                {MONTHS_ID.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Kode Mobil</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={v.carCode}
                onChange={(e) => setV((p) => ({ ...p, carCode: e.target.value }))}
              >
                {CAR_CODES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Driver</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={v.driverName}
                onChange={(e) => setV((p) => ({ ...p, driverName: e.target.value }))}
              >
                {DRIVERS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Biaya Pemeliharaan</Label>
              <Input
                type="number"
                className="bg-slate-950 border-slate-700 rounded-xl"
                value={v.maintenanceFee}
                onChange={(e) => setV((p) => ({ ...p, maintenanceFee: toNumber(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Biaya Asuransi</Label>
              <Input
                type="number"
                className="bg-slate-950 border-slate-700 rounded-xl"
                value={v.insuranceFee}
                onChange={(e) => setV((p) => ({ ...p, insuranceFee: toNumber(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Cicilan Mobil</Label>
              <Input
                type="number"
                className="bg-slate-950 border-slate-700 rounded-xl"
                value={v.installmentFee}
                onChange={(e) => setV((p) => ({ ...p, installmentFee: toNumber(e.target.value) }))}
              />
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Save akan melakukan <span className="text-gray-200 font-semibold">upsert</span> ke endpoint{' '}
            <span className="text-gray-200 font-semibold">/api/vehicle-costs</span>.
          </div>
        </div>

        <DialogFooter className="gap-2">
          {canDelete && (
            <Button type="button" variant="outline" className="border-rose-700 text-rose-200" onClick={() => onDelete?.(v)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}

          <Button type="button" variant="outline" className="border-slate-700 text-gray-200" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button type="button" className="bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold" onClick={() => onSave?.(v)}>
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
