import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Car, Plus, Gauge, Calendar, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import VehicleModal from '@/components/VehicleModal';
import { useToast } from '@/components/ui/use-toast';
import CrudActions from '@/components/CrudActions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_BASE = 'http://localhost:8080/api';
const VEHICLE_API = `${API_BASE}/vehicles`;

function toDateInputValue(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  return '';
}

// ✅ template data kendaraan (termasuk KODE MOBIL) untuk CREATE
const EMPTY_VEHICLE = {
  id: null,
  vehicleCode: '',
  plateNumber: '',
  color: '',
  kilometers: null,
  lastService: '',
};

const VehicleReports = () => {
  const { toast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(VEHICLE_API);
      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(data?.error || 'Gagal mengambil data kendaraan');
      }

      const normalized = (Array.isArray(data) ? data : []).map((v) => ({
        ...v,
        // ✅ pastikan ada kolom code untuk CRUD
        vehicleCode: v.vehicleCode ?? v.vehicle_code ?? '',
        plateNumber: v.plateNumber ?? v.plate_number ?? '',
        color: v.color ?? '',
        kilometers:
          v.kilometers === undefined || v.kilometers === null ? null : v.kilometers,
        lastService: toDateInputValue(v.lastService ?? v.last_service),
      }));

      setVehicles(normalized);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Terjadi kesalahan saat mengambil data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ CREATE: modal dapat object yang sudah ada vehicleCode
  const handleCreate = () => {
    setEditingVehicle({ ...EMPTY_VEHICLE });
    setShowModal(true);
  };

  // ✅ EDIT: pastikan data yang masuk modal punya vehicleCode
  const handleEdit = (vehicle) => {
    setEditingVehicle({
      ...EMPTY_VEHICLE,
      ...vehicle,
      vehicleCode: vehicle.vehicleCode ?? vehicle.vehicle_code ?? '',
      plateNumber: vehicle.plateNumber ?? vehicle.plate_number ?? '',
      lastService: toDateInputValue(vehicle.lastService ?? vehicle.last_service),
    });
    setShowModal(true);
  };

  const handleView = (vehicle) => {
    toast({
      title: 'Detail Kendaraan',
      description: `Kode: ${vehicle.vehicleCode || '-'} | Plat: ${vehicle.plateNumber || '-'}`,
    });
  };

  const handleSave = async (vehicleData) => {
    // ✅ payload harus sama persis dengan backend Go
    const payload = {
      vehicleCode: String(vehicleData.vehicleCode || '').trim(),
      plateNumber: String(vehicleData.plateNumber || '').trim(),
      color: String(vehicleData.color || '').trim(),
      kilometers:
        vehicleData.kilometers === '' ||
        vehicleData.kilometers === undefined ||
        vehicleData.kilometers === null
          ? null
          : Number(vehicleData.kilometers),
      lastService: String(vehicleData.lastService || '').trim(), // "YYYY-MM-DD" atau ""
    };

    if (!payload.vehicleCode || !payload.plateNumber) {
      toast({
        title: 'Validasi',
        description: 'Kode Mobil dan Plat Mobil wajib diisi.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const isEdit = Boolean(editingVehicle?.id);
      const url = isEdit ? `${VEHICLE_API}/${editingVehicle.id}` : VEHICLE_API;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error ||
            (isEdit ? 'Gagal mengupdate kendaraan' : 'Gagal menambahkan kendaraan')
        );
      }

      toast({
        title: 'Berhasil',
        description: isEdit
          ? 'Kendaraan berhasil diupdate.'
          : 'Kendaraan berhasil ditambahkan.',
      });

      setShowModal(false);
      setEditingVehicle(null);
      await loadVehicles();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan data kendaraan.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${VEHICLE_API}/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Gagal menghapus kendaraan');

      toast({
        title: 'Dihapus',
        description: 'Data kendaraan berhasil dihapus.',
        variant: 'destructive',
      });

      await loadVehicles();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menghapus data kendaraan.',
        variant: 'destructive',
      });
    }
  };

  const filteredVehicles = useMemo(() => {
    if (!searchText.trim()) return vehicles;
    const q = searchText.toLowerCase().trim();
    return vehicles.filter((v) => {
      const code = (v.vehicleCode || '').toLowerCase();
      const plate = (v.plateNumber || '').toLowerCase();
      return code.includes(q) || plate.includes(q);
    });
  }, [vehicles, searchText]);

  useEffect(() => setPage(1), [searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));

  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredVehicles.slice(start, start + PAGE_SIZE);
  }, [filteredVehicles, page]);

  const goToPage = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <DashboardLayout>
      <Helmet>
        <title>Laporan Kendaraan - LK Travel App</title>
        <meta name="description" content="Kelola data armada kendaraan" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Laporan Kendaraan
            </h1>
            <p className="text-gray-400">Kelola data armada kendaraan</p>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Tambah Kendaraan
            </Button>
          </motion.div>
        </div>

        <div className="bg-slate-800/60 border border-gray-700 rounded-xl p-4">
          <Label>Cari (Kode Mobil / Plat Mobil)</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Contoh: LK03 atau BM 1234 XX"
              className="pl-9 bg-slate-900 border-slate-700"
            />
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {loading
              ? 'Memuat data...'
              : `Menampilkan ${filteredVehicles.length} kendaraan`}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedVehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -5 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-all shadow-lg relative group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50 rounded-xl flex items-center justify-center shadow-inner">
                  <Car className="w-6 h-6 text-yellow-400" />
                </div>

                <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                  <CrudActions
                    itemName="Kendaraan"
                    onView={() => handleView(vehicle)}
                    onEdit={() => handleEdit(vehicle)}
                    onDelete={() => handleDelete(vehicle.id)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Kode Mobil</div>
                  <div className="text-white font-semibold truncate">
                    {vehicle.vehicleCode || '-'}
                  </div>
                </div>
                <div className="text-right min-w-0">
                  <div className="text-xs text-gray-500">Plat Mobil</div>
                  <div className="text-2xl font-bold text-white tracking-tight truncate">
                    {vehicle.plateNumber || '-'}
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-900/40 p-4 rounded-lg border border-white/5 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Warna</span>
                  <div className="flex items-center gap-2 text-gray-300 font-medium">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20"
                      style={{ backgroundColor: vehicle.color || '#999' }}
                    />
                    <span className="capitalize">{vehicle.color || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Kilometer</span>
                  </div>
                  <span className="text-white font-mono">
                    {vehicle.kilometers !== null && vehicle.kilometers !== undefined
                      ? `${Number(vehicle.kilometers).toLocaleString()} km`
                      : '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Servis Terakhir</span>
                  </div>
                  <span className="text-yellow-400 font-medium">
                    {vehicle.lastService || '-'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && filteredVehicles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-gray-700">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl">
              <Car className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg font-medium">Tidak ada kendaraan</p>
            <p className="text-gray-500 text-sm mt-1">
              Tambahkan kendaraan baru untuk memulai
            </p>
          </div>
        )}

        {filteredVehicles.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 bg-slate-800/40 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400">
              Halaman <span className="text-white font-semibold">{page}</span> dari{' '}
              <span className="text-white font-semibold">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-200"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                Prev
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                  const p = i + 1;
                  const active = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`h-9 w-9 rounded-lg text-sm border transition ${
                        active
                          ? 'bg-yellow-500 text-slate-900 border-yellow-500 font-bold'
                          : 'bg-slate-900/40 text-gray-200 border-gray-700 hover:border-yellow-500/40'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                className="border-gray-700 text-gray-200"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <VehicleModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingVehicle(null);
        }}
        onSave={handleSave}
        vehicle={editingVehicle} // ✅ sudah include vehicleCode untuk CRUD
      />
    </DashboardLayout>
  );
};

export default VehicleReports;
