// src/pages/AkunDriver.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Users,
  Phone,
  MapPin,
  Calendar,
  Armchair,
  Banknote,
  CheckCircle,
  XCircle,
  Icon,
} from 'lucide-react';
import { steeringWheel } from '@lucide/lab';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const API_BASE = 'http://localhost:8080/api';
const DRIVER_ACCOUNT_API = `${API_BASE}/driver-accounts`;

const AkunDriver = () => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchText, setSearchText] = useState('');

  const [formData, setFormData] = useState({
    driverName: '',
    bookingName: '',
    phone: '',
    pickupAddress: '',
    departureDate: '',
    seatNumbers: '',
    passengerCount: '',
    serviceType: 'Reguler',
    paymentMethod: 'Cash',
    paymentStatus: 'Belum Sukses',
    departureStatus: 'Belum Berangkat',
  });

  // Load data awal
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(DRIVER_ACCOUNT_API);
        if (!res.ok) throw new Error('Gagal mengambil data akun driver');
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description:
            err.message || 'Terjadi kesalahan saat mengambil data akun driver.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const reload = async () => {
    try {
      const res = await fetch(DRIVER_ACCOUNT_API);
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({
      driverName: '',
      bookingName: '',
      phone: '',
      pickupAddress: '',
      departureDate: '',
      seatNumbers: '',
      passengerCount: '',
      serviceType: 'Reguler',
      paymentMethod: 'Cash',
      paymentStatus: 'Belum Sukses',
      departureStatus: 'Belum Berangkat',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      driverName: item.driverName || '',
      bookingName: item.bookingName || '',
      phone: item.phone || '',
      pickupAddress: item.pickupAddress || '',
      departureDate: item.departureDate || '',
      seatNumbers: item.seatNumbers || '',
      passengerCount: item.passengerCount || '',
      serviceType: item.serviceType || 'Reguler',
      paymentMethod: item.paymentMethod || 'Cash',
      paymentStatus: item.paymentStatus || 'Belum Sukses',
      departureStatus: item.departureStatus || 'Belum Berangkat',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${DRIVER_ACCOUNT_API}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus data');
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast({
        title: 'Deleted',
        description: 'Data akun driver dihapus.',
        variant: 'destructive',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menghapus data akun driver.',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...formData };

    try {
      if (editingItem) {
        const res = await fetch(`${DRIVER_ACCOUNT_API}/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal mengupdate data');
        toast({ title: 'Updated', description: 'Data berhasil diupdate' });
      } else {
        const res = await fetch(DRIVER_ACCOUNT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal membuat data baru');
        toast({ title: 'Created', description: 'Data akun driver dibuat' });
      }
      await reload();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan data akun driver.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      (item.driverName || '').toLowerCase().includes(q) ||
      (item.bookingName || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.pickupAddress || '').toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <Helmet>
        <title>Akun Driver - LK Travel App</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Akun Driver
            </h1>
            <p className="text-gray-400">
              Daftar tugas dan penumpang yang akan di-handle oleh driver.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 border-0"
            >
              + Tambah Penugasan
            </Button>
          </motion.div>
        </div>

        {/* Search */}
        <div className="bg-slate-800/60 border border-gray-700 rounded-xl p-4">
          <Label>Cari (Driver / Nama Pemesan / No HP)</Label>
          <Input
            placeholder="Ketik kata kunci..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="mt-1 bg-slate-900 border-slate-700"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Driver
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Pemesan
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Kontak & Jemput
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Jadwal & Seat
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Layanan
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Pembayaran
                  </th>
                  <th className="text-left py-3 px-6 text-xs text-gray-400 uppercase">
                    Status Keberangkatan
                  </th>
                  <th className="text-right py-3 px-6 text-xs text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-gray-500 text-sm"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-gray-500 text-sm"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const payMethod = item.paymentMethod || 'Cash';
                    const payStatus = item.paymentStatus || 'Belum Sukses';
                    const depStatus = item.departureStatus || 'Belum Berangkat';

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hover:bg-slate-700/30"
                      >
                        <td className="py-3 px-6 text-sm text-gray-100">
                          <div className="flex items-center gap-2">
                            <Icon
                              iconNode={steeringWheel}
                              className="w-4 h-4 text-emerald-400"
                            />
                            <span>{item.driverName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-100">
                          {item.bookingName}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200 max-w-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-green-400" />
                              <span>{item.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-300 truncate">
                              <MapPin className="w-3 h-3 text-red-400" />
                              <span>{item.pickupAddress}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-blue-400" />
                              <span>{item.departureDate || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Armchair className="w-3 h-3 text-yellow-400" />
                              <span>{item.seatNumbers || '-'}</span>
                            </div>
                            {item.passengerCount && (
                              <div className="text-xs text-gray-400">
                                {item.passengerCount} Penumpang/Barang
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-200">
                          {item.serviceType}
                        </td>
                        <td className="py-3 px-6 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-300">
                              <Banknote className="w-3 h-3 text-yellow-400" />
                              <span>{payMethod}</span>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                payStatus === 'Pembayaran Sukses'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/40'
                              }`}
                            >
                              {payStatus === 'Pembayaran Sukses' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {payStatus}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              depStatus === 'Berangkat'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                                : 'bg-orange-500/10 text-orange-400 border border-orange-500/40'
                            }`}
                          >
                            {depStatus === 'Berangkat' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {depStatus}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-200"
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDelete(item.id)}
                            >
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-yellow-400">
                {editingItem ? 'Edit Penugasan Driver' : 'Tambah Penugasan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nama Driver</Label>
                <Input
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Pemesanan</Label>
                <Input
                  name="bookingName"
                  value={formData.bookingName}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>No HP</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Alamat Penjemputan</Label>
                <Input
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Keberangkatan</Label>
                <Input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tempat Duduk</Label>
                  <Input
                    name="seatNumbers"
                    value={formData.seatNumbers}
                    onChange={handleChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="1A, 2B..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah Penumpang/Barang</Label>
                  <Input
                    type="number"
                    name="passengerCount"
                    value={formData.passengerCount}
                    onChange={handleChange}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Jenis Layanan</Label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                >
                  <option value="Reguler">Reguler</option>
                  <option value="Dropping">Dropping</option>
                  <option value="Rental">Rental</option>
                  <option value="Paket Barang">Paket Barang</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Transfer</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status Pembayaran</Label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="Pembayaran Sukses">Pembayaran Sukses</option>
                    <option value="Belum Sukses">Belum Sukses</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status Keberangkatan</Label>
                <select
                  name="departureStatus"
                  value={formData.departureStatus}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm"
                >
                  <option value="Berangkat">Berangkat</option>
                  <option value="Belum Berangkat">Belum Berangkat</option>
                  <option value="Tidak Berangkat">Tidak Berangkat</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
                >
                  {saving
                    ? editingItem
                      ? 'Saving...'
                      : 'Creating...'
                    : editingItem
                    ? 'Save Changes'
                    : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AkunDriver;
