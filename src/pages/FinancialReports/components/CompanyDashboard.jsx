// src/pages/FinancialReports/components/CompanyDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, DollarSign, PieChart, TrendingUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import FinancialChart from '@/components/FinancialChart';

import { YEARS, MONTHS_ID } from '../constants';
import { apiFetch } from '../api';
import { rupiah, toNumber } from '../utils';
import { containerV, itemV, modalBackdropV } from '../motionPresets';
import SuperSlideshow from './SuperSlideshow';
import StatCard from './StatCard';
import CompanyExpensesTable from './CompanyExpensesTable';

export default function CompanyDashboard({ transactions, onClose }) {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(2025);

  const [companyExpenses, setCompanyExpenses] = useState([]);
  const [loadingExp, setLoadingExp] = useState(false);

  const filtered = useMemo(
    () => transactions.filter((t) => Number(t.year) === Number(selectedYear)),
    [transactions, selectedYear]
  );

  const reloadExp = async () => {
    try {
      setLoadingExp(true);
      // ✅ apiFetch akan jadi /api/company-expenses
      const data = await apiFetch(`/company-expenses?year=${encodeURIComponent(selectedYear)}`);
      setCompanyExpenses(Array.isArray(data) ? data : []);
    } catch (e) {
      setCompanyExpenses([]);
      toast({
        title: 'Gagal ambil biaya perusahaan',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    } finally {
      setLoadingExp(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await reloadExp();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  // ===== Pendapatan perusahaan =====
  const pendapatanTrip = filtered.reduce((sum, t) => sum + toNumber(t.calc_deptTotal) + toNumber(t.calc_retTotal), 0);
  const pendapatanAdminKeberangkatan = filtered.reduce((sum, t) => sum + toNumber(t.calc_totalAdminKeberangkatan), 0);
  const pendapatanAdminKepulangan = filtered.reduce((sum, t) => sum + toNumber(t.calc_totalAdminKepulangan), 0);
  const pendapatanLain = filtered.reduce((sum, t) => sum + toNumber(t.otherIncome), 0);

  const totalPendapatan = pendapatanTrip + pendapatanAdminKeberangkatan + pendapatanAdminKepulangan + pendapatanLain;

  const expenses = useMemo(() => {
    const sum = { staff: 0, office: 0, internet: 0, promo: 0, flyer: 0, legal: 0 };
    for (const x of companyExpenses) {
      sum.staff += toNumber(x.staffFee);
      sum.office += toNumber(x.officeFee);
      sum.internet += toNumber(x.internetFee);
      sum.promo += toNumber(x.promoFee);
      sum.flyer += toNumber(x.flyerFee);
      sum.legal += toNumber(x.legalFee);
    }
    return sum;
  }, [companyExpenses]);

  const totalPengeluaran = Object.values(expenses).reduce((a, b) => a + b, 0);
  const pendapatanBersihPerusahaan = totalPendapatan - totalPengeluaran;

  const passengersYear = filtered.reduce((s, t) => s + toNumber(t.deptPassengerCount) + toNumber(t.retPassengerCount), 0);
  const packagesYear = filtered.reduce((s, t) => s + toNumber(t.deptPackageCount) + toNumber(t.retPackageCount), 0);

  const monthlyAgg = MONTHS_ID.map((m, idx) => {
    const mt = filtered.filter((t) => Number(t.month) === idx);
    return {
      month: m.substring(0, 3),
      passengers: mt.reduce((s, t) => s + toNumber(t.deptPassengerCount) + toNumber(t.retPassengerCount), 0),
      packages: mt.reduce((s, t) => s + toNumber(t.deptPackageCount) + toNumber(t.retPackageCount), 0),
      revenue: mt.reduce(
        (s, t) =>
          s +
          toNumber(t.calc_deptTotal) +
          toNumber(t.calc_retTotal) +
          toNumber(t.calc_totalAdminKeberangkatan) +
          toNumber(t.calc_totalAdminKepulangan) +
          toNumber(t.otherIncome),
        0
      ),
      profit: mt.reduce((s, t) => s + toNumber(t.calc_netProfit), 0),
    };
  });

  const slides = [
    <div className="h-full flex flex-col justify-center" key="c1">
      <div className="text-white/80 text-sm font-semibold mb-1">Total Pendapatan Perusahaan</div>
      <div className="text-3xl font-extrabold text-yellow-200">Rp {rupiah(totalPendapatan)}</div>
      <div className="text-xs text-white/60 mt-2">Trip + Admin + Lain-lain</div>
    </div>,
    <div className="h-full flex flex-col justify-center" key="c2">
      <div className="text-white/80 text-sm font-semibold mb-1">Total Pengeluaran Perusahaan</div>
      <div className="text-3xl font-extrabold text-orange-200">Rp {rupiah(totalPengeluaran)}</div>
      <div className="text-xs text-white/60 mt-2">{loadingExp ? 'Memuat...' : 'Dari /api/company-expenses'}</div>
    </div>,
    <div className="h-full flex flex-col justify-center" key="c3">
      <div className="text-white/80 text-sm font-semibold mb-1">Pendapatan Bersih Perusahaan</div>
      <div className="text-3xl font-extrabold text-emerald-200">Rp {rupiah(pendapatanBersihPerusahaan)}</div>
      <div className="text-xs text-white/60 mt-2">Pendapatan - Pengeluaran</div>
    </div>,
  ];

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 overflow-y-auto" initial="hidden" animate="show" exit="hidden" variants={modalBackdropV}>
        <div className="min-h-screen bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(250,204,21,0.12),transparent_40%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.10),transparent_45%),radial-gradient(circle_at_60%_80%,rgba(16,185,129,0.12),transparent_45%)]" />
          <motion.div variants={containerV} initial="hidden" animate="show" className="relative p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <motion.div variants={itemV} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                  <Building2 className="w-7 h-7 text-yellow-300" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Informasi Perusahaan</h1>
              </div>
              <Button onClick={onClose} variant="outline" className="border-red-500/40 text-red-300 hover:bg-red-950">
                <X className="w-4 h-4 mr-2" /> Close
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SuperSlideshow slides={slides} title="Ringkasan Perusahaan" />
              <motion.div variants={itemV} className="lg:col-span-2 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-2xl flex flex-wrap gap-4 items-center">
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
                  {loadingExp ? 'Memuat data /api/company-expenses...' : `Baris biaya: ${companyExpenses.length}`}
                </div>
              </motion.div>
            </div>

            <motion.div variants={itemV} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Total Pendapatan" value={totalPendapatan} icon={DollarSign} colorClass="bg-gradient-to-br from-yellow-600/90 to-yellow-900/80" subtext="Trip + Admin + Lain-lain" />
              <StatCard title="Total Pengeluaran" value={totalPengeluaran} icon={PieChart} colorClass="bg-gradient-to-br from-orange-600/90 to-orange-900/80" subtext="Dari /api/company-expenses" />
              <StatCard title="Pendapatan Bersih Perusahaan" value={pendapatanBersihPerusahaan} icon={TrendingUp} colorClass="bg-gradient-to-br from-emerald-600/90 to-emerald-900/80" subtext="Pendapatan - Pengeluaran" />
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

            {/* TABLE + CRUD */}
            <CompanyExpensesTable year={selectedYear} rows={companyExpenses} onReload={reloadExp} toast={toast} />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
