// src/pages/FinancialReports/index.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  PieChart,
  Plus,
  Download,
  Car,
  Building2,
  Save,
  Search,
  Wallet,
  BadgePercent,
  ShieldCheck,
} from 'lucide-react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { fetchTrips, fetchRoutes, createTrip, updateTrip, deleteTrip, upsertVehicleCost } from './api';

import { CAR_CODES, DRIVERS, MONTHS_ID, YEARS, DAYS } from './constants';
import { rupiah, toNumber, getMonthName } from './utils';
import { normalizeTripRow, buildTripPayloadFromForm } from './mappers';

import StatCard from './components/StatCard';
import SuperSlideshow from './components/SuperSlideshow';

import VehicleDashboard from './components/VehicleDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import TripsTable from './components/TripsTable';

// =====================
// helpers
// =====================
const uiMonthToApiMonth = (m) => {
  const n = Number(m);
  if (!Number.isFinite(n)) return 1;

  // kalau sudah 1..12 (misal data lama), jangan +1 lagi
  if (n >= 1 && n <= 12) return n;

  // UI 0..11 -> API 1..12
  const v = n + 1;
  return v >= 1 && v <= 12 ? v : 1;
};

const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

const itemV = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

const CATEGORY_OPTIONS = ['Reguler', 'Rent', 'Drop', 'Rental', 'Dropping'];

// =====================
// initial form state
// =====================
const InitialTransactionState = {
  day: 1,
  month: 0,
  year: 2025,

  carCode: 'LK01',
  vehicleName: '',
  driverName: DRIVERS?.[0] || 'Budi',
  orderNo: '',

  deptOrigin: 'Rokan Hulu',
  deptDest: 'Pekanbaru',
  deptCategory: 'Reguler',
  deptPassengerCount: 0,
  deptPassengerFare: 0,
  deptPackageCount: 0,
  deptPackageFare: 0,

  retOrigin: 'Pekanbaru',
  retDest: 'Rokan Hulu',
  retCategory: 'Reguler',
  retPassengerCount: 0,
  retPassengerFare: 0,
  retPackageCount: 0,
  retPackageFare: 0,

  otherIncome: 0,

  bbmFee: 300000,
  mealFee: 100000,
  courierFee: 0,
  tolParkirFee: 0,

  deptAdminPercentOverride: null,
  retAdminPercentOverride: null,

  paymentStatus: 'Belum Lunas',

  // optional upsert /api/vehicle-costs
  maintenanceFee: 0,
  insuranceFee: 0,
  installmentFee: 0,
};

export default function FinancialReports() {
  const { toast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ ...InitialTransactionState }); // ✅ clone
  const [editingId, setEditingId] = useState(null);

  const [viewMode, setViewMode] = useState('main'); // main | vehicle | company

  const [searchInput, setSearchInput] = useState('');
  const [searchCarCode, setSearchCarCode] = useState('');

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadTrips = async () => {
    const data = await fetchTrips();
    const rows = Array.isArray(data) ? data.map(normalizeTripRow) : [];
    setTransactions(rows);
  };

  const loadRoutes = async () => {
    try {
      const data = await fetchRoutes();
      setRoutes(Array.isArray(data) ? data : []);
    } catch {
      setRoutes([]);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await Promise.all([loadTrips(), loadRoutes()]);
      } catch (e) {
        if (!alive) return;
        toast({ title: 'Gagal memuat data', description: String(e?.message || e), variant: 'destructive' });
      }
    })();
    return () => {
      alive = false;
    };
  }, [toast]);

  const filteredTransactions = useMemo(() => {
    if (!searchCarCode) return transactions;
    const q = searchCarCode.trim().toLowerCase();
    return transactions.filter((t) => String(t.carCode || '').toLowerCase().includes(q));
  }, [transactions, searchCarCode]);

  useEffect(() => setPage(1), [searchCarCode, transactions.length]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, page]);

  const handleSearch = () => setSearchCarCode(searchInput);
  const handleResetSearch = () => {
    setSearchInput('');
    setSearchCarCode('');
  };

  const setNum = (key) => (e) => {
    const v = e.target.value;
    setFormData((p) => ({ ...p, [key]: v === '' ? 0 : Number(v) }));
  };

  const setText = (key) => (e) => setFormData((p) => ({ ...p, [key]: e.target.value }));

  const setNullablePercent = (key) => (e) => {
    const v = e.target.value;
    if (v === '' || v === null || v === undefined) {
      setFormData((p) => ({ ...p, [key]: null }));
      return;
    }
    setFormData((p) => ({ ...p, [key]: Number(v) }));
  };

  const upsertVehicleCostsIfAny = async (fd) => {
    const payload = {
      carCode: String(fd.carCode || '').trim(),
      driverName: String(fd.driverName || ''),
      year: Number(fd.year),
      month: uiMonthToApiMonth(fd.month), // 1..12
      maintenanceFee: Number(fd.maintenanceFee || 0),
      insuranceFee: Number(fd.insuranceFee || 0),
      installmentFee: Number(fd.installmentFee || 0),
    };

    if (payload.maintenanceFee === 0 && payload.insuranceFee === 0 && payload.installmentFee === 0) return;

    await upsertVehicleCost(payload);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ VALIDASI sebelum hit backend
    if (!String(formData.orderNo || '').trim()) {
      toast({ title: 'Gagal simpan', description: 'orderNo wajib diisi.', variant: 'destructive' });
      return;
    }
    if (!String(formData.carCode || '').trim()) {
      toast({ title: 'Gagal simpan', description: 'carCode wajib dipilih.', variant: 'destructive' });
      return;
    }

    try {
      const tripPayload = buildTripPayloadFromForm(formData);

      let apiItem;
      if (editingId) {
        apiItem = await updateTrip(editingId, tripPayload);
        toast({ title: 'Record Updated', description: 'Data berhasil diperbarui.' });
      } else {
        apiItem = await createTrip(tripPayload);
        toast({ title: 'Record Added', description: 'Data berhasil ditambahkan.' });
      }

      // optional: upsert biaya bulanan mobil
      try {
        await upsertVehicleCostsIfAny(formData);
      } catch (e2) {
        toast({
          title: 'Trip tersimpan, tapi biaya bulanan gagal di-upsert',
          description: String(e2?.message || e2),
          variant: 'destructive',
        });
      }

      const row = normalizeTripRow(apiItem);

      setTransactions((prev) => {
        const exists = prev.some((x) => x.id === row.id);
        if (!exists) return [row, ...prev];
        return prev.map((x) => (x.id === row.id ? row : x));
      });

      setIsFormOpen(false);
      setFormData({ ...InitialTransactionState }); // ✅ clone
      setEditingId(null);
    } catch (err) {
      toast({ title: 'Gagal simpan data', description: String(err?.message || err), variant: 'destructive' });
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...InitialTransactionState,
      ...item,
      deptAdminPercentOverride: item.deptAdminPercentOverride ?? null,
      retAdminPercentOverride: item.retAdminPercentOverride ?? null,
      maintenanceFee: 0,
      insuranceFee: 0,
      installmentFee: 0,
    });
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus data ini?')) return;
    try {
      await deleteTrip(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast({ title: 'Deleted', variant: 'destructive' });
    } catch (e) {
      toast({ title: 'Gagal hapus data', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  const handleExport = () => {
    const headers = [
      'Tanggal',
      'Bulan',
      'Tahun',
      'Kode Mobil',
      'Kendaraan',
      'Nama Driver',
      'No Order',
      'Asal (Dept)',
      'Dest (Dept)',
      'Kategori (Dept)',
      'Nominal Total (incl otherIncome)',
      'Total Admin',
      'BBM',
      'Makan',
      'Kurir',
      'Fee Sopir',
      'Profit Netto',
      'Status',
    ];

    const rows = transactions.map((t) => [
      t.day,
      getMonthName(t.month),
      t.year,
      t.carCode,
      t.vehicleName,
      t.driverName,
      t.orderNo,
      t.deptOrigin,
      t.deptDest,
      t.deptCategory,
      t.calc_totalNominal,
      t.calc_totalAdmin,
      t.bbmFee,
      t.mealFee,
      t.courierFee,
      t.calc_driverSalary,
      t.calc_netProfit,
      t.paymentStatus,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'financial_reports.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // KPI (filtered)
  const kpiTotalNominal = useMemo(
    () => filteredTransactions.reduce((s, t) => s + toNumber(t.calc_totalNominal), 0),
    [filteredTransactions]
  );
  const kpiTotalAdmin = useMemo(
    () => filteredTransactions.reduce((s, t) => s + toNumber(t.calc_totalAdmin), 0),
    [filteredTransactions]
  );
  const kpiTotalFeeSopir = useMemo(
    () => filteredTransactions.reduce((s, t) => s + toNumber(t.calc_driverSalary), 0),
    [filteredTransactions]
  );
  const kpiTotalProfit = useMemo(
    () => filteredTransactions.reduce((s, t) => s + toNumber(t.calc_netProfit), 0),
    [filteredTransactions]
  );
  const kpiLunas = useMemo(
    () => filteredTransactions.filter((t) => t.paymentStatus === 'Lunas').length,
    [filteredTransactions]
  );

  const mainSlides = [
    <div className="h-full flex flex-col justify-center" key="m1">
      <div className="text-white/80 text-sm font-semibold mb-1 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-yellow-300" /> Total Nominal (Filtered)
      </div>
      <div className="text-3xl font-extrabold text-yellow-200">Rp {rupiah(kpiTotalNominal)}</div>
      <div className="text-xs text-white/60 mt-2">Nominal trip + otherIncome (server)</div>
    </div>,
    <div className="h-full flex flex-col justify-center" key="m2">
      <div className="text-white/80 text-sm font-semibold mb-1 flex items-center gap-2">
        <BadgePercent className="w-4 h-4 text-rose-300" /> Total Administrasi (Filtered)
      </div>
      <div className="text-3xl font-extrabold text-rose-200">Rp {rupiah(kpiTotalAdmin)}</div>
      <div className="text-xs text-white/60 mt-2">Akumulasi admin dept + ret (server)</div>
    </div>,
    <div className="h-full flex flex-col justify-center" key="m3">
      <div className="text-white/80 text-sm font-semibold mb-1 flex items-center gap-2">
        <Car className="w-4 h-4 text-emerald-300" /> Total Fee Sopir (Filtered)
      </div>
      <div className="text-3xl font-extrabold text-emerald-200">Rp {rupiah(kpiTotalFeeSopir)}</div>
      <div className="text-xs text-white/60 mt-2">Akumulasi fee sopir (server)</div>
    </div>,
    <div className="h-full flex flex-col justify-center" key="m4">
      <div className="text-white/80 text-sm font-semibold mb-1 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-300" /> Total Profit Netto (Filtered)
      </div>
      <div className="text-3xl font-extrabold text-blue-200">Rp {rupiah(kpiTotalProfit)}</div>
      <div className="text-xs text-white/60 mt-2">Akumulasi profit netto (server)</div>
    </div>,
    <div className="h-full flex flex-col justify-center" key="m5">
      <div className="text-white/80 text-sm font-semibold mb-1 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-300" /> Status Pembayaran
      </div>
      <div className="text-3xl font-extrabold text-white">{kpiLunas} Lunas</div>
      <div className="text-xs text-white/60 mt-2">dari {filteredTransactions.length} data (filtered)</div>
    </div>,
  ];

  return (
    <DashboardLayout>
      <Helmet>
        <title>Laporan Keuangan - LAKUTRAND</title>
      </Helmet>

      {viewMode === 'vehicle' && <VehicleDashboard transactions={transactions} onClose={() => setViewMode('main')} />}
      {viewMode === 'company' && <CompanyDashboard transactions={transactions} onClose={() => setViewMode('main')} />}

      <motion.div variants={containerV} initial="hidden" animate="show" className="space-y-6">
        {/* HERO */}
        <motion.div variants={itemV} className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.12),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(250,204,21,0.12),transparent_40%),radial-gradient(circle_at_60%_80%,rgba(16,185,129,0.12),transparent_45%)]" />
          <div className="relative p-6 md:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg"
                alt="LAKUTRAND Logo"
                className="w-12 h-12 rounded-2xl shadow-lg shadow-yellow-500/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Laporan Keuangan</h1>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 font-extrabold">
                    2025-2030
                  </span>
                </div>
                <p className="text-gray-400 mt-1">Trips + Vehicle Costs + Company Expenses</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setViewMode('vehicle')} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Car className="w-4 h-4 mr-2" /> Informasi Mobil
              </Button>
              <Button onClick={() => setViewMode('company')} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <Building2 className="w-4 h-4 mr-2" /> Informasi Perusahaan
              </Button>
              <Button onClick={handleExport} variant="outline" className="border-slate-700 text-gray-200">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button
                onClick={() => {
                  setIsFormOpen(true);
                  setFormData({ ...InitialTransactionState });
                  setEditingId(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> New Entry
              </Button>
            </div>
          </div>
        </motion.div>

        {/* SLIDESHOW + QUICK STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SuperSlideshow slides={mainSlides} title="Insight Cepat" />
          <motion.div variants={itemV} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard title="Total Nominal (Filtered)" value={kpiTotalNominal} icon={DollarSign} colorClass="bg-gradient-to-br from-yellow-600/90 to-yellow-900/80" subtext="Total nominal (server)" />
            <StatCard title="Total Administrasi (Filtered)" value={kpiTotalAdmin} icon={PieChart} colorClass="bg-gradient-to-br from-rose-600/90 to-rose-900/80" subtext="Total admin (server)" />
            <StatCard title="Fee Sopir (Filtered)" value={kpiTotalFeeSopir} icon={Car} colorClass="bg-gradient-to-br from-emerald-600/90 to-emerald-900/80" subtext="Akumulasi fee sopir" />
            <StatCard title="Profit Netto (Filtered)" value={kpiTotalProfit} icon={TrendingUp} colorClass="bg-gradient-to-br from-blue-600/90 to-blue-900/80" subtext="Akumulasi profit netto" />
          </motion.div>
        </div>

        {/* Search */}
        <motion.div variants={itemV} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-2xl">
          <Label className="text-gray-300 font-semibold">Search (Kode Mobil)</Label>
          <div className="mt-2 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Contoh: LK03"
                className="pl-9 bg-slate-950 border-slate-700 rounded-xl"
              />
            </div>
            <Button onClick={handleSearch} className="bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold">
              Search
            </Button>
            <Button onClick={handleResetSearch} variant="outline" className="border-slate-700 text-gray-200">
              Reset
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Menampilkan <span className="text-white font-extrabold">{filteredTransactions.length}</span> data
          </div>
        </motion.div>

        {/* ✅ Trips Table (SUDAH DITAMPILKAN) */}
        <motion.div variants={itemV}>
          <TripsTable
            paginated={paginated}
            filteredCount={filteredTransactions.length}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </motion.div>

        {/* FORM MODAL (Trip) */}
        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({ ...InitialTransactionState });
            }
          }}
        >
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold flex items-center gap-2">
                {editingId ? 'Edit Financial Record' : 'New Financial Entry'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                <div>
                  <Label>Tanggal (1-31)</Label>
                  <select className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3" value={formData.day} onChange={setNum('day')}>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Bulan</Label>
                  <select className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3" value={formData.month} onChange={setNum('month')}>
                    {MONTHS_ID.map((m, i) => (
                      <option key={m} value={i}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Tahun (2025-2030)</Label>
                  <select className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3" value={formData.year} onChange={setNum('year')}>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Status</Label>
                  <select className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3" value={formData.paymentStatus} onChange={setText('paymentStatus')}>
                    <option value="Lunas">Lunas</option>
                    <option value="Belum Lunas">Belum Lunas</option>
                  </select>
                </div>

                <div>
                  <Label>Kode Mobil</Label>
                  <select className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3" value={formData.carCode} onChange={setText('carCode')}>
                    {CAR_CODES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Kendaraan (Nama/Unit)</Label>
                  <Input value={formData.vehicleName} onChange={setText('vehicleName')} className="bg-slate-950 border-slate-700 rounded-xl" placeholder="Contoh: Avanza Putih / Unit 01" />
                </div>

                <div>
                  <Label>Nama Driver</Label>
                  <select className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3" value={formData.driverName} onChange={setText('driverName')}>
                    {DRIVERS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>No Order</Label>
                  <Input required value={formData.orderNo} onChange={setText('orderNo')} className="bg-slate-950 border-slate-700 rounded-xl" placeholder="ORD-001" />
                </div>
              </div>

              {/* Keberangkatan */}
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="font-extrabold text-gray-200">Keberangkatan</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Asal</Label>
                    <Input value={formData.deptOrigin} onChange={setText('deptOrigin')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Tujuan</Label>
                    <Input value={formData.deptDest} onChange={setText('deptDest')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <select className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3" value={formData.deptCategory} onChange={setText('deptCategory')}>
                      {CATEGORY_OPTIONS.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Penumpang (qty)</Label>
                    <Input type="number" value={formData.deptPassengerCount} onChange={setNum('deptPassengerCount')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Tarif Penumpang</Label>
                    <Input type="number" value={formData.deptPassengerFare} onChange={setNum('deptPassengerFare')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div />

                  <div>
                    <Label>Paket (qty)</Label>
                    <Input type="number" value={formData.deptPackageCount} onChange={setNum('deptPackageCount')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Tarif Paket</Label>
                    <Input type="number" value={formData.deptPackageFare} onChange={setNum('deptPackageFare')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div />
                </div>
              </div>

              {/* Kepulangan */}
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="font-extrabold text-gray-200">Kepulangan</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Asal</Label>
                    <Input value={formData.retOrigin} onChange={setText('retOrigin')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Tujuan</Label>
                    <Input value={formData.retDest} onChange={setText('retDest')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <select className="w-full h-10 rounded-xl bg-slate-950 border border-slate-700 text-sm px-3" value={formData.retCategory} onChange={setText('retCategory')}>
                      {CATEGORY_OPTIONS.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Penumpang (qty)</Label>
                    <Input type="number" value={formData.retPassengerCount} onChange={setNum('retPassengerCount')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Tarif Penumpang</Label>
                    <Input type="number" value={formData.retPassengerFare} onChange={setNum('retPassengerFare')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div />

                  <div>
                    <Label>Paket (qty)</Label>
                    <Input type="number" value={formData.retPackageCount} onChange={setNum('retPackageCount')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Tarif Paket</Label>
                    <Input type="number" value={formData.retPackageFare} onChange={setNum('retPackageFare')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div />
                </div>
              </div>

              {/* Pendapatan & Biaya */}
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="font-extrabold text-gray-200">Pendapatan & Biaya</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Other Income</Label>
                    <Input type="number" value={formData.otherIncome} onChange={setNum('otherIncome')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>

                  <div>
                    <Label>BBM Fee</Label>
                    <Input type="number" value={formData.bbmFee} onChange={setNum('bbmFee')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>

                  <div>
                    <Label>Makan Fee</Label>
                    <Input type="number" value={formData.mealFee} onChange={setNum('mealFee')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>

                  <div>
                    <Label>Kurir Fee</Label>
                    <Input type="number" value={formData.courierFee} onChange={setNum('courierFee')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>

                  <div>
                    <Label>Tol/Parkir Fee</Label>
                    <Input type="number" value={formData.tolParkirFee} onChange={setNum('tolParkirFee')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Override ADM % (Dept) (opsional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.deptAdminPercentOverride ?? ''}
                      onChange={setNullablePercent('deptAdminPercentOverride')}
                      className="bg-slate-950 border-slate-700 rounded-xl"
                      placeholder="kosongkan jika pakai default server"
                    />
                  </div>
                  <div>
                    <Label>Override ADM % (Ret) (opsional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.retAdminPercentOverride ?? ''}
                      onChange={setNullablePercent('retAdminPercentOverride')}
                      className="bg-slate-950 border-slate-700 rounded-xl"
                      placeholder="kosongkan jika pakai default server"
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Vehicle Costs (Optional Upsert) */}
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700">
                <h3 className="font-extrabold text-gray-200 mb-3 flex items-center gap-2">
                  <Car className="w-4 h-4" /> Biaya Bulanan Mobil (opsional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Pemeliharaan</Label>
                    <Input type="number" value={formData.maintenanceFee} onChange={setNum('maintenanceFee')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Asuransi</Label>
                    <Input type="number" value={formData.insuranceFee} onChange={setNum('insuranceFee')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                  <div>
                    <Label>Cicilan Mobil</Label>
                    <Input type="number" value={formData.installmentFee} onChange={setNum('installmentFee')} className="bg-slate-950 border-slate-700 rounded-xl" />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-slate-700 text-gray-200">
                  Cancel
                </Button>
                <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold">
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
