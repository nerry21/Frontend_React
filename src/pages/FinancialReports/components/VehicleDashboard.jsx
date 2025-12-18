// src/pages/FinancialReports/components/VehicleDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, DollarSign, PieChart, TrendingUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import FinancialChart from '@/components/FinancialChart';

import { CAR_CODES, YEARS, MONTHS_ID } from '../constants';
import { apiFetch } from '../api';
import { rupiah, toNumber } from '../utils';
import { containerV, itemV, modalBackdropV } from '../motionPresets';
import SuperSlideshow from './SuperSlideshow';
import StatCard from './StatCard';
import VehicleCostsTable from './VehicleCostsTable';
import VehicleCostsMatrix from './VehicleCostsMatrix';

export default function VehicleDashboard({ transactions, onClose }) {
  const { toast } = useToast();

  const [selectedCar, setSelectedCar] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(2025);

  const [vehicleCosts, setVehicleCosts] = useState([]); // single car costs
  const [allVehicleCosts, setAllVehicleCosts] = useState([]); // ALL cars costs for year
  const [loadingCosts, setLoadingCosts] = useState(false);

  // month helper: handle 0..11 OR 1..12
  const monthIndex0 = (m) => {
    const n = Number(m);
    if (!Number.isFinite(n)) return 0;
    if (n >= 1 && n <= 12) return n - 1; // backend
    if (n >= 0 && n <= 11) return n; // UI
    return 0;
  };

  const filtered = useMemo(() => {
    return transactions.filter(
      (t) => (selectedCar === 'ALL' || t.carCode === selectedCar) && Number(t.year) === Number(selectedYear)
    );
  }, [transactions, selectedCar, selectedYear]);

  const reloadCostsSingleCar = async () => {
    if (selectedCar === 'ALL') {
      setVehicleCosts([]);
      return;
    }
    try {
      setLoadingCosts(true);
      const data = await apiFetch(
        `/api/vehicle-costs?carCode=${encodeURIComponent(selectedCar)}&year=${encodeURIComponent(selectedYear)}`
      );
      setVehicleCosts(Array.isArray(data) ? data : []);
    } catch (e) {
      setVehicleCosts([]);
      toast({
        title: 'Gagal ambil biaya mobil',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    } finally {
      setLoadingCosts(false);
    }
  };

  const reloadCostsAllCars = async () => {
    try {
      setLoadingCosts(true);
      // ambil per carCode lalu gabung (agar "ALL" tetap tampil data)
      const results = await Promise.all(
        CAR_CODES.map(async (cc) => {
          try {
            const data = await apiFetch(`/api/vehicle-costs?carCode=${encodeURIComponent(cc)}&year=${encodeURIComponent(selectedYear)}`);
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        })
      );
      setAllVehicleCosts(results.flat());
    } finally {
      setLoadingCosts(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      if (selectedCar === 'ALL') {
        await reloadCostsAllCars();
      } else {
        await reloadCostsSingleCar();
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCar, selectedYear]);

  // ===== Pendapatan =====
  const pendapatanTrip = filtered.reduce(
    (sum, t) => sum + toNumber(t.calc_deptTotal) + toNumber(t.calc_retTotal),
    0
  );
  const pendapatanLain = filtered.reduce((sum, t) => sum + toNumber(t.otherIncome), 0);
  const totalPendapatan = pendapatanTrip + pendapatanLain;

  // ===== Pengeluaran trips =====
  const biayaAdminKeberangkatan = filtered.reduce((sum, t) => sum + toNumber(t.calc_totalAdminKeberangkatan), 0);
  const biayaAdminKepulangan = filtered.reduce((sum, t) => sum + toNumber(t.calc_totalAdminKepulangan), 0);
  const biayaBBM = filtered.reduce((sum, t) => sum + toNumber(t.bbmFee), 0);
  const biayaMakan = filtered.reduce((sum, t) => sum + toNumber(t.mealFee), 0);
  const feeSupir = filtered.reduce((sum, t) => sum + toNumber(t.calc_driverSalary), 0);
  const feeKurir = filtered.reduce((sum, t) => sum + toNumber(t.courierFee), 0);
  const biayaTolParkir = filtered.reduce((sum, t) => sum + toNumber(t.tolParkirFee), 0);

  // ===== Pengeluaran bulanan (vehicle-costs) =====
  const costsForCalc = selectedCar === 'ALL' ? [] : vehicleCosts;

  const biayaPemeliharaan = selectedCar === 'ALL' ? 0 : costsForCalc.reduce((s, x) => s + toNumber(x.maintenanceFee), 0);
  const biayaAsuransi = selectedCar === 'ALL' ? 0 : costsForCalc.reduce((s, x) => s + toNumber(x.insuranceFee), 0);
  const cicilanMobil = selectedCar === 'ALL' ? 0 : costsForCalc.reduce((s, x) => s + toNumber(x.installmentFee), 0);

  const totalPengeluaran =
    biayaAdminKeberangkatan +
    biayaAdminKepulangan +
    biayaBBM +
    biayaMakan +
    feeSupir +
    feeKurir +
    biayaTolParkir +
    biayaPemeliharaan +
    biayaAsuransi +
    cicilanMobil;

  const pendapatanBersihMobil = totalPendapatan - totalPengeluaran;

  const passengersYear = filtered.reduce(
    (s, t) => s + toNumber(t.deptPassengerCount) + toNumber(t.retPassengerCount),
    0
  );
  const packagesYear = filtered.reduce(
    (s, t) => s + toNumber(t.deptPackageCount) + toNumber(t.retPackageCount),
    0
  );

  // ✅ FIX: month bisa 0..11 atau 1..12, jadi normalisasi dulu
  const monthlyAgg = MONTHS_ID.map((m, idx) => {
    const mt = filtered.filter((t) => monthIndex0(t.month) === idx);
    return {
      month: m.substring(0, 3),
      passengers: mt.reduce((s, t) => s + toNumber(t.deptPassengerCount) + toNumber(t.retPassengerCount), 0),
      packages: mt.reduce((s, t) => s + toNumber(t.deptPackageCount) + toNumber(t.retPackageCount), 0),
      revenue: mt.reduce(
        (s, t) => s + toNumber(t.calc_deptTotal) + toNumber(t.calc_retTotal) + toNumber(t.otherIncome),
        0
      ),
      profit: mt.reduce((s, t) => s + toNumber(t.calc_netProfit), 0),
    };
  });

  const slides = [
    <div className="h-full flex flex-col justify-center" key="s1">
      <div className="text-white/80 text-sm font-semibold mb-1">Total Pendapatan</div>
      <div className="text-3xl font-extrabold text-blue-200">Rp {rupiah(totalPendapatan)}</div>
      <div className="text-xs text-white/60 mt-2">Trip + Lain-lain</div>
    </div>,
    <div className="h-full flex flex-col justify-center" key="s2">
      <div className="text-white/80 text-sm font-semibold mb-1">Total Pengeluaran</div>
      <div className="text-3xl font-extrabold text-rose-200">Rp {rupiah(totalPengeluaran)}</div>
      <div className="text-xs text-white/60 mt-2">Trips + biaya bulanan</div>
    </div>,
    <div className="h-full flex flex-col justify-center" key="s3">
      <div className="text-white/80 text-sm font-semibold mb-1">Pendapatan Bersih Mobil</div>
      <div className="text-3xl font-extrabold text-emerald-200">Rp {rupiah(pendapatanBersihMobil)}</div>
      <div className="text-xs text-white/60 mt-2">Pendapatan - Pengeluaran</div>
    </div>,
  ];

  // driverName untuk tabel vehicle-costs: ambil paling sering (mode)
  const driverNameForCosts = useMemo(() => {
    if (selectedCar === 'ALL') return '';
    const counts = new Map();
    for (const t of transactions) {
      if (t.carCode !== selectedCar) continue;
      if (Number(t.year) !== Number(selectedYear)) continue;
      const dn = t.driverName || '';
      counts.set(dn, (counts.get(dn) || 0) + 1);
    }
    let best = '';
    let bestN = 0;
    for (const [k, v] of counts.entries()) {
      if (v > bestN) {
        best = k;
        bestN = v;
      }
    }
    return best || '';
  }, [selectedCar, selectedYear, transactions]);

  const handleOpenMonthFromMatrix = (carCode) => {
    // klik edit dari matrix -> pindah ke mobil itu (agar muncul VehicleCostsTable)
    setSelectedCar(carCode);
    toast({ title: 'Pindah ke mobil', description: `Sekarang menampilkan biaya bulanan untuk ${carCode}` });
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 overflow-y-auto" initial="hidden" animate="show" exit="hidden" variants={modalBackdropV}>
        <div className="min-h-screen bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_90%_0%,rgba(250,204,21,0.10),transparent_45%),radial-gradient(circle_at_60%_80%,rgba(16,185,129,0.12),transparent_45%)]" />
          <motion.div variants={containerV} initial="hidden" animate="show" className="relative p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <motion.div variants={itemV} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <Car className="w-7 h-7 text-blue-300" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Informasi Mobil</h1>
              </div>
              <Button onClick={onClose} variant="outline" className="border-red-500/40 text-red-300 hover:bg-red-950">
                <X className="w-4 h-4 mr-2" /> Close
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SuperSlideshow slides={slides} title="Ringkasan Mobil" />
              <motion.div variants={itemV} className="lg:col-span-2 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-2xl flex flex-wrap gap-4">
                <select
                  className="bg-slate-950 text-white border border-slate-700 rounded-xl px-4 py-2"
                  value={selectedCar}
                  onChange={(e) => setSelectedCar(e.target.value)}
                >
                  <option value="ALL">Semua Mobil</option>
                  {CAR_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  className="bg-slate-950 text-white border border-slate-700 rounded-xl px-4 py-2"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>

                <div className="ml-auto flex items-center gap-3 text-xs text-gray-300">
                  <span className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-950">
                    Penumpang / Tahun: <span className="text-white font-extrabold">{passengersYear}</span>
                  </span>
                  <span className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-950">
                    Paket / Tahun: <span className="text-white font-extrabold">{packagesYear}</span>
                  </span>
                </div>

                <div className="w-full text-xs text-gray-400">
                  {loadingCosts ? 'Memuat biaya bulanan...' : (selectedCar === 'ALL' ? `Data biaya ALL: ${allVehicleCosts.length} baris` : `Data biaya ${selectedCar}: ${vehicleCosts.length} baris`)}
                </div>

                {selectedCar === 'ALL' && (
                  <div className="w-full text-xs text-yellow-300/80 border border-yellow-500/20 bg-yellow-500/10 rounded-xl px-3 py-2">
                    Mode ALL: biaya bulanan ditampilkan sebagai matrix semua mobil. Klik ikon edit pada bulan untuk pindah ke mobilnya.
                  </div>
                )}
              </motion.div>
            </div>

            <motion.div variants={itemV} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Total Pendapatan" value={totalPendapatan} icon={DollarSign} colorClass="bg-gradient-to-br from-blue-600/90 to-blue-900/80" subtext="Trip + Lain-lain" />
              <StatCard title="Total Pengeluaran" value={totalPengeluaran} icon={PieChart} colorClass="bg-gradient-to-br from-rose-600/90 to-rose-900/80" subtext="Trips + biaya bulanan (single car)" />
              <StatCard title="Pendapatan Bersih Mobil" value={pendapatanBersihMobil} icon={TrendingUp} colorClass="bg-gradient-to-br from-emerald-600/90 to-emerald-900/80" subtext="Pendapatan - Pengeluaran" />
              <motion.div variants={itemV} className="bg-slate-900/70 rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col justify-center space-y-2">
                <p className="text-gray-400 text-xs uppercase font-extrabold">Info Tambahan</p>
                <div className="flex justify-between text-gray-300">
                  <span>Penumpang / Tahun:</span> <span className="text-white font-extrabold">{passengersYear}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Paket / Tahun:</span> <span className="text-white font-extrabold">{packagesYear}</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div variants={itemV} className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 shadow-2xl">
              <h3 className="text-xl font-extrabold text-white mb-6">Performa Bulanan ({selectedYear})</h3>
              <FinancialChart data={monthlyAgg.map((x) => ({ month: x.month, revenue: x.revenue, profit: x.profit }))} type="revenue" />
            </motion.div>

            {/* ✅ ALL: tampilkan matrix */}
            {selectedCar === 'ALL' && (
              <VehicleCostsMatrix
                year={selectedYear}
                carCodes={CAR_CODES}
                costs={allVehicleCosts}
                onOpenMonth={(carCode) => handleOpenMonthFromMatrix(carCode)}
                onAddNew={() => toast({ title: 'Pilih mobil dulu', description: 'Untuk tambah biaya bulanan, pilih 1 kode mobil (bukan ALL).' })}
              />
            )}

            {/* ✅ SINGLE CAR: tabel CRUD 12 bulan */}
            {selectedCar !== 'ALL' && (
              <VehicleCostsTable
                carCode={selectedCar}
                driverName={driverNameForCosts}
                year={selectedYear}
                rows={vehicleCosts}
                onReload={reloadCostsSingleCar}
                toast={toast}
              />
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
