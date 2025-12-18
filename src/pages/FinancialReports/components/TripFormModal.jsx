// src/pages/FinancialReports/components/TripFormModal.jsx

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Calculator, Save, DollarSign, Car, MapPin } from 'lucide-react';

export default function TripFormModal({
  open,
  onOpenChange,
  editingId,
  formData,
  setFormData,
  onSubmit,
  DAYS,
  MONTHS_ID,
  YEARS,
  CAR_CODES,
  DRIVERS,
  CATEGORIES,
  routes,
}) {
  const routeOptions = useMemo(() => {
    return (routes || []).map((r) => ({
      id: r.id,
      label: `${r.origin} → ${r.destination} (${r.service_type_name || r.service_type_code || '-'})`,
      origin: r.origin,
      destination: r.destination,
    }));
  }, [routes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-yellow-400" />
            {editingId ? 'Edit Financial Record' : 'New Financial Entry'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
            <div>
              <Label>Tanggal (1-31)</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Bulan</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
              >
                {MONTHS_ID.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Tahun (2025-2030)</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Status</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
              >
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </select>
            </div>

            <div>
              <Label>Kode Mobil</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={formData.carCode}
                onChange={(e) => setFormData({ ...formData, carCode: e.target.value })}
              >
                {CAR_CODES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Kendaraan (Nama/Unit)</Label>
              <Input
                value={formData.vehicleName}
                onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                className="bg-slate-950 border-slate-700 rounded-xl"
                placeholder="Contoh: Avanza Putih / Unit 01"
              />
            </div>

            <div>
              <Label>Nama Driver</Label>
              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              >
                {DRIVERS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>No Order</Label>
              <Input
                required
                value={formData.orderNo}
                onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                className="bg-slate-950 border-slate-700 rounded-xl"
                placeholder="ORD-001"
              />
            </div>

            {/* OPTIONAL ROUTE QUICK PICK */}
            {routeOptions.length > 0 && (
              <div className="md:col-span-4">
                <Label className="text-gray-300">Quick Pick Route (opsional)</Label>
                <select
                  className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                  defaultValue=""
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const r = routeOptions.find((x) => x.id === id);
                    if (!r) return;
                    setFormData((p) => ({
                      ...p,
                      deptOrigin: r.origin,
                      deptDest: r.destination,
                    }));
                  }}
                >
                  <option value="">-- Pilih Route untuk set Keberangkatan (Origin/Dest) --</option>
                  {routeOptions.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                <div className="text-[11px] text-gray-500 mt-1">
                  Ini hanya bantu isi origin/destination. Tarif tetap kamu input manual.
                </div>
              </div>
            )}
          </div>

          {/* KEBERANGKATAN + KEPULANGAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Keberangkatan */}
            <div className="p-4 bg-blue-900/10 rounded-2xl border border-blue-900/30 space-y-3">
              <h3 className="font-extrabold text-blue-300 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Keberangkatan
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Lokasi Asal"
                  value={formData.deptOrigin}
                  onChange={(e) => setFormData({ ...formData, deptOrigin: e.target.value })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
                <Input
                  placeholder="Destinasi"
                  value={formData.deptDest}
                  onChange={(e) => setFormData({ ...formData, deptDest: e.target.value })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>

              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={formData.deptCategory}
                onChange={(e) => setFormData({ ...formData, deptCategory: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Jumlah Penumpang</Label>
                  <Input
                    type="number"
                    value={formData.deptPassengerCount}
                    onChange={(e) => setFormData({ ...formData, deptPassengerCount: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Total Tarif Penumpang</Label>
                  <Input
                    type="number"
                    value={formData.deptPassengerFare}
                    onChange={(e) => setFormData({ ...formData, deptPassengerFare: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Jumlah Paket</Label>
                  <Input
                    type="number"
                    value={formData.deptPackageCount}
                    onChange={(e) => setFormData({ ...formData, deptPackageCount: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Total Tarif Paket</Label>
                  <Input
                    type="number"
                    value={formData.deptPackageFare}
                    onChange={(e) => setFormData({ ...formData, deptPackageFare: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Override ADM % (optional)</Label>
                  <Input
                    type="number"
                    value={formData.deptAdminPercentOverride ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deptAdminPercentOverride: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="bg-slate-950 border-slate-700 rounded-xl"
                    placeholder="contoh: 12.5"
                  />
                </div>
                <div className="text-[11px] text-gray-500 flex items-end pb-2">
                  Kosongkan untuk default server (Reguler 15% / Non-Reguler 10%).
                </div>
              </div>
            </div>

            {/* Kepulangan */}
            <div className="p-4 bg-purple-900/10 rounded-2xl border border-purple-900/30 space-y-3">
              <h3 className="font-extrabold text-purple-300 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Kepulangan
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Lokasi Asal"
                  value={formData.retOrigin}
                  onChange={(e) => setFormData({ ...formData, retOrigin: e.target.value })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
                <Input
                  placeholder="Destinasi"
                  value={formData.retDest}
                  onChange={(e) => setFormData({ ...formData, retDest: e.target.value })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>

              <select
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3"
                value={formData.retCategory}
                onChange={(e) => setFormData({ ...formData, retCategory: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Jumlah Penumpang</Label>
                  <Input
                    type="number"
                    value={formData.retPassengerCount}
                    onChange={(e) => setFormData({ ...formData, retPassengerCount: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Total Tarif Penumpang</Label>
                  <Input
                    type="number"
                    value={formData.retPassengerFare}
                    onChange={(e) => setFormData({ ...formData, retPassengerFare: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Jumlah Paket</Label>
                  <Input
                    type="number"
                    value={formData.retPackageCount}
                    onChange={(e) => setFormData({ ...formData, retPackageCount: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Total Tarif Paket</Label>
                  <Input
                    type="number"
                    value={formData.retPackageFare}
                    onChange={(e) => setFormData({ ...formData, retPackageFare: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">Override ADM % (optional)</Label>
                  <Input
                    type="number"
                    value={formData.retAdminPercentOverride ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        retAdminPercentOverride: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="bg-slate-950 border-slate-700 rounded-xl"
                    placeholder="contoh: 10"
                  />
                </div>
                <div className="text-[11px] text-gray-500 flex items-end pb-2">Kosongkan untuk default server.</div>
              </div>
            </div>
          </div>

          {/* Pendapatan lain-lain */}
          <div className="p-4 bg-emerald-900/10 rounded-2xl border border-emerald-900/30">
            <h3 className="font-extrabold text-emerald-300 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Pendapatan Lain-lain
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nominal</Label>
                <Input
                  type="number"
                  value={formData.otherIncome}
                  onChange={(e) => setFormData({ ...formData, otherIncome: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="p-4 bg-rose-900/10 rounded-2xl border border-rose-900/30">
            <h3 className="font-extrabold text-rose-300 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Pengeluaran Operasional (Trip)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>BBM Fee</Label>
                <Input
                  type="number"
                  value={formData.bbmFee}
                  onChange={(e) => setFormData({ ...formData, bbmFee: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <Label>Makan Fee</Label>
                <Input
                  type="number"
                  value={formData.mealFee}
                  onChange={(e) => setFormData({ ...formData, mealFee: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <Label>Fee Kurir</Label>
                <Input
                  type="number"
                  value={formData.courierFee}
                  onChange={(e) => setFormData({ ...formData, courierFee: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <Label>Tol & Parkir</Label>
                <Input
                  type="number"
                  value={formData.tolParkirFee}
                  onChange={(e) => setFormData({ ...formData, tolParkirFee: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Monthly Vehicle Costs (Upsert to /vehicle-costs) */}
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700">
            <h3 className="font-extrabold text-gray-200 mb-3 flex items-center gap-2">
              <Car className="w-4 h-4" /> Biaya Bulanan Mobil (opsional)
            </h3>
            <div className="text-xs text-gray-400 mb-4">
              Saat Save, data ini akan di-upsert ke endpoint <span className="text-gray-200 font-semibold">/vehicle-costs</span> untuk bulan yang dipilih.
              Kalau semua 0, otomatis di-skip (biar tidak overwrite).
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Pemeliharaan</Label>
                <Input
                  type="number"
                  value={formData.maintenanceFee}
                  onChange={(e) => setFormData({ ...formData, maintenanceFee: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <Label>Asuransi</Label>
                <Input
                  type="number"
                  value={formData.insuranceFee}
                  onChange={(e) => setFormData({ ...formData, insuranceFee: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <Label>Cicilan Mobil</Label>
                <Input
                  type="number"
                  value={formData.installmentFee}
                  onChange={(e) => setFormData({ ...formData, installmentFee: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-gray-200">
              Cancel
            </Button>
            <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold">
              <Save className="w-4 h-4 mr-2" /> Save (Server Calc)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
