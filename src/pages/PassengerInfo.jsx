import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Users,
  Phone,
  MapPin,
  Calendar,
  Plus,
  Armchair,
  Banknote,
  Clock,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import CrudActions from '@/components/CrudActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const ITEMS_PER_PAGE = 10;
const API_BASE = 'http://localhost:8080/api';
const PASSENGER_API = `${API_BASE}/passengers`;

const PassengerInfo = () => {
  const { toast } = useToast();
  const [passengers, setPassengers] = useState([]);

  // Loading / Saving state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPassenger, setCurrentPassenger] = useState(null);
  const [formData, setFormData] = useState({
    passengerName: '',
    passengerPhone: '',
    date: '',
    departureTime: '',
    pickupAddress: '',
    dropoffAddress: '',
    totalAmount: '',
    selectedSeats: '',
    driverName: '',
    vehicleCode: '',
    serviceType: 'Reguler', // 🔹 Jenis layanan default
    eTicketPhoto: '',       // 🔹 Foto E-Ticket (base64)
    notes: '',
  });

  // Filter & Pagination state
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 🔹 Load dari backend
  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        setLoading(true);
        const res = await fetch(PASSENGER_API);
        if (!res.ok) throw new Error('Gagal mengambil data penumpang');
        const data = await res.json();
        setPassengers(data || []);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: err.message || 'Gagal memuat data penumpang',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPassengers();
  }, [toast]);

  const reloadPassengers = async () => {
    try {
      const res = await fetch(PASSENGER_API);
      if (!res.ok) throw new Error('Gagal mengambil data penumpang');
      const data = await res.json();
      setPassengers(data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal memuat ulang data penumpang',
        variant: 'destructive',
      });
    }
  };

  const openCreateModal = () => {
    setCurrentPassenger(null);
    setFormData({
      passengerName: '',
      passengerPhone: '',
      date: '',
      departureTime: '',
      pickupAddress: '',
      dropoffAddress: '',
      totalAmount: '',
      selectedSeats: '',
      driverName: '',
      vehicleCode: '',
      serviceType: 'Reguler',
      eTicketPhoto: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (passenger) => {
    const existingDate =
      passenger.date ||
      (passenger.createdAt ? passenger.createdAt.slice(0, 10) : '');

    setCurrentPassenger(passenger);
    setFormData({
      passengerName: passenger.passengerName || '',
      passengerPhone: passenger.passengerPhone || '',
      date: existingDate || '',
      departureTime: passenger.departureTime || '',
      pickupAddress: passenger.pickupAddress || passenger.from || '',
      dropoffAddress: passenger.dropoffAddress || passenger.to || '',
      totalAmount: passenger.totalAmount || '',
      selectedSeats: Array.isArray(passenger.selectedSeats)
        ? passenger.selectedSeats.join(', ')
        : passenger.selectedSeats || '',
      driverName: passenger.driverName || '',
      vehicleCode: passenger.vehicleCode || '',
      serviceType: passenger.serviceType || 'Reguler',
      eTicketPhoto: passenger.eTicketPhoto || '',
      notes: passenger.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${PASSENGER_API}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus data penumpang');
      setPassengers((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: 'Deleted',
        description: 'Passenger record removed.',
        variant: 'destructive',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menghapus passenger',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Upload Foto E-Ticket (base64)
  const handleETicketChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result; // data:image/...;base64,...
      setFormData((prev) => ({
        ...prev,
        eTicketPhoto: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const seats = formData.selectedSeats
      ? formData.selectedSeats
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s)
      : [];

    const payload = {
      ...formData,
      selectedSeats: seats,
      from: formData.pickupAddress,
      to: formData.dropoffAddress,
    };

    setSaving(true);
    try {
      if (currentPassenger) {
        // UPDATE
        const res = await fetch(`${PASSENGER_API}/${currentPassenger.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal mengupdate data penumpang');
        toast({
          title: 'Updated',
          description: 'Passenger details updated.',
        });
      } else {
        // CREATE
        const res = await fetch(PASSENGER_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal membuat penumpang baru');
        const created = await res.json();
        setPassengers((prev) => [created, ...prev]);
        toast({
          title: 'Created',
          description: 'New passenger added.',
        });
      }

      await reloadPassengers();
      setIsModalOpen(false);
      setCurrentPassenger(null);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan data penumpang',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Tahun filter
  const yearOptions = ['2025', '2026', '2027', '2028', '2029', '2030'];

  // Filtering
  const filteredPassengers = passengers.filter((p) => {
    const name = (p.passengerName || '').toLowerCase();
    const phone = (p.passengerPhone || '').toLowerCase();
    const pickup = (p.pickupAddress || p.from || '').toLowerCase();
    const drop = (p.dropoffAddress || p.to || '').toLowerCase();
    const driver = (p.driverName || '').toLowerCase();
    const vehicle = (p.vehicleCode || '').toLowerCase();
    const serviceType = (p.serviceType || '').toLowerCase();
    const dateStr = p.date || (p.createdAt ? p.createdAt.slice(0, 10) : '');
    const year = dateStr ? dateStr.slice(0, 4) : '';

    if (filterYear !== 'all' && year !== filterYear) return false;
    if (filterName && !name.includes(filterName.toLowerCase())) return false;
    if (filterPhone && !phone.includes(filterPhone.toLowerCase())) return false;

    if (searchText) {
      const q = searchText.toLowerCase();
      if (
        !name.includes(q) &&
        !phone.includes(q) &&
        !pickup.includes(q) &&
        !drop.includes(q) &&
        !driver.includes(q) &&
        !vehicle.includes(q) &&
        !serviceType.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterName, filterPhone, filterYear, passengers.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPassengers.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPagePassengers = filteredPassengers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleSearchClick = () => {
    setSearchText(searchInput.trim());
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Passenger Info - LK Travel App</title>
        <meta name="description" content="View passenger information" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Passenger Information
            </h1>
            <p className="text-gray-400">
              Manage passenger details, pickups, and fares.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Passenger
            </Button>
          </motion.div>
        </div>

        {/* Search & Filter */}
        <div className="bg-slate-800/60 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="searchText">
              Search (Nama / No HP / Alamat / Driver / Kode Kendaraan / Jenis Layanan)
            </Label>
            <div className="flex gap-2">
              <Input
                id="searchText"
                placeholder="Ketik kata kunci..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchClick();
                }}
                className="bg-slate-900 border-slate-700"
              />
              <Button
                type="button"
                onClick={handleSearchClick}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
              >
                Search
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:w-[520px]">
            <div className="space-y-1">
              <Label htmlFor="filterName">Filter Nama</Label>
              <Input
                id="filterName"
                placeholder="Nama penumpang"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filterPhone">Filter No HP</Label>
              <Input
                id="filterPhone"
                placeholder="No HP"
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filterYear">Tahun Keberangkatan</Label>
              <select
                id="filterYear"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">Semua Tahun</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Nama Penumpang
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    No HP
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Tanggal Keberangkatan
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Jam Keberangkatan
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Alamat Penjemputan
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Alamat Pengantaran
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Info (Tarif / Seat)
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Jenis Layanan
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Foto E-Ticket
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Driver Info
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Vehicle Code
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Keterangan
                  </th>
                  <th className="text-right py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="py-8 text-center text-gray-500 text-sm"
                    >
                      Loading passengers...
                    </td>
                  </tr>
                ) : currentPagePassengers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="py-8 text-center text-gray-500 text-sm"
                    >
                      No passenger records found
                    </td>
                  </tr>
                ) : (
                  currentPagePassengers.map((passenger) => {
                    const departureDate =
                      passenger.date ||
                      (passenger.createdAt
                        ? passenger.createdAt.slice(0, 10)
                        : '-');

                    const departureTime = passenger.departureTime || '';
                    const pickupText =
                      passenger.pickupAddress || passenger.from || '-';
                    const dropoffText =
                      passenger.dropoffAddress || passenger.to || '-';

                    return (
                      <motion.tr
                        key={passenger.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group hover:bg-slate-700/30 transition-colors"
                      >
                        {/* Nama */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-yellow-500 font-bold border border-white/5">
                              {passenger.passengerName
                                ? passenger.passengerName.charAt(0)
                                : 'U'}
                            </div>
                            <div>
                              <div className="text-white font-bold">
                                {passenger.passengerName || '-'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* No HP */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Phone className="w-3 h-3 text-green-400" />
                            <span className="font-mono">
                              {passenger.passengerPhone || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Tanggal */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            <span>{departureDate || '-'}</span>
                          </div>
                        </td>

                        {/* Jam */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Clock className="w-3 h-3 text-purple-400" />
                            <span>{departureTime || '-'}</span>
                          </div>
                        </td>

                        {/* Pickup */}
                        <td className="py-4 px-6">
                          <div
                            className="text-sm text-gray-300 max-w-[220px] truncate"
                            title={pickupText}
                          >
                            <MapPin className="w-3 h-3 inline text-red-400 mr-1" />
                            {pickupText}
                          </div>
                        </td>

                        {/* Dropoff */}
                        <td className="py-4 px-6">
                          <div
                            className="text-sm text-gray-300 max-w-[220px] truncate"
                            title={dropoffText}
                          >
                            <MapPin className="w-3 h-3 inline text-blue-400 mr-1" />
                            {dropoffText}
                          </div>
                        </td>

                        {/* Tarif & Seat */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-yellow-400 font-bold">
                              <Banknote className="w-3 h-3" />
                              <span>
                                Rp{' '}
                                {parseInt(
                                  passenger.totalAmount || 0,
                                  10,
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Armchair className="w-3 h-3" />
                              <span>
                                {Array.isArray(passenger.selectedSeats)
                                  ? passenger.selectedSeats.join(', ')
                                  : passenger.selectedSeats || '-'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Jenis Layanan */}
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-900 border border-slate-700 text-gray-200">
                            {passenger.serviceType || '-'}
                          </span>
                        </td>

                        {/* Foto E-Ticket */}
                        <td className="py-4 px-6">
                          {passenger.eTicketPhoto ? (
                            <button
                              type="button"
                              onClick={() =>
                                window.open(passenger.eTicketPhoto, '_blank')
                              }
                              className="inline-flex flex-col items-start gap-1"
                            >
                              <img
                                src={passenger.eTicketPhoto}
                                alt="E-Ticket"
                                className="w-16 h-16 object-cover rounded border border-slate-600"
                              />
                              <span className="text-[10px] text-yellow-400 underline">
                                Open
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500">
                              No E-Ticket
                            </span>
                          )}
                        </td>

                        {/* Driver */}
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-300 max-w-[160px] truncate">
                            {passenger.driverName || '-'}
                          </div>
                        </td>

                        {/* Vehicle Code */}
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-200 font-mono">
                            {passenger.vehicleCode || '-'}
                          </div>
                        </td>

                        {/* Notes */}
                        <td className="py-4 px-6">
                          <div className="text-xs text-gray-400 italic max-w-[180px] truncate">
                            {passenger.notes || 'No notes'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <CrudActions
                            itemName="Passenger"
                            onView={() =>
                              toast({
                                title: 'Details',
                                description: `Viewing details for ${passenger.passengerName}`,
                              })
                            }
                            onEdit={() => openEditModal(passenger)}
                            onDelete={() => handleDelete(passenger.id)}
                          />
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredPassengers.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-t border-gray-700 bg-slate-900/40 gap-3">
              <p className="text-xs text-gray-400">
                Menampilkan{' '}
                {filteredPassengers.length === 0
                  ? 0
                  : `${startIndex + 1}-${Math.min(
                      startIndex + ITEMS_PER_PAGE,
                      filteredPassengers.length,
                    )}`}{' '}
                dari {filteredPassengers.length} penumpang
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className="border-gray-600 text-gray-200"
                >
                  Prev
                </Button>
                <span className="text-xs text-gray-400">
                  Hal {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(totalPages, prev + 1),
                    )
                  }
                  className="border-gray-600 text-gray-200"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {filteredPassengers.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-gray-700">
            <Users className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">
              No passenger records found
            </p>
          </div>
        )}

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-yellow-400">
                {currentPassenger ? 'Edit Passenger' : 'Add New Passenger'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="passengerName">Nama (Full Name)</Label>
                <Input
                  id="passengerName"
                  name="passengerName"
                  value={formData.passengerName}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passengerPhone">No HP (WhatsApp)</Label>
                <Input
                  id="passengerPhone"
                  name="passengerPhone"
                  value={formData.passengerPhone}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-600"
                  required
                />
              </div>

              {/* Tanggal & Jam */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Keberangkatan</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Jam Keberangkatan</Label>
                  <Input
                    id="departureTime"
                    name="departureTime"
                    type="time"
                    value={formData.departureTime}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>

              {/* Pickup / Dropoff */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupAddress">Jemput (Pickup)</Label>
                  <Input
                    id="pickupAddress"
                    name="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="Address/Location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropoffAddress">Tujuan (Destination)</Label>
                  <Input
                    id="dropoffAddress"
                    name="dropoffAddress"
                    value={formData.dropoffAddress}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="Address/Location"
                  />
                </div>
              </div>

              {/* Driver & Vehicle */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driverName">Driver Info (Nama Driver)</Label>
                  <Input
                    id="driverName"
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="Nama driver"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleCode">Vehicle Code</Label>
                  <Input
                    id="vehicleCode"
                    name="vehicleCode"
                    value={formData.vehicleCode}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="Contoh: Unit-01 / BK 1234 XX"
                  />
                </div>
              </div>

              {/* Jenis Layanan */}
              <div className="space-y-2">
                <Label htmlFor="serviceType">Jenis Layanan</Label>
                <select
                  id="serviceType"
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                >
                  <option value="Reguler">Reguler</option>
                  <option value="Dropping">Dropping</option>
                  <option value="Rental">Rental</option>
                  <option value="Paket Barang">Paket Barang</option>
                </select>
              </div>

              {/* Tarif & Seat */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Tarif (Fare Rp)</Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selectedSeats">Seat (e.g., 1A, 2B)</Label>
                  <Input
                    id="selectedSeats"
                    name="selectedSeats"
                    value={formData.selectedSeats}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>

              {/* Foto E-Ticket */}
              <div className="space-y-2">
                <Label htmlFor="eTicketPhoto">Foto E-Ticket</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="eTicketPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleETicketChange}
                    className="bg-slate-800 border-slate-600"
                  />
                  {formData.eTicketPhoto && (
                    <img
                      src={formData.eTicketPhoto}
                      alt="Preview E-Ticket"
                      className="w-12 h-12 object-cover rounded border border-slate-600"
                    />
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Keterangan (Notes)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-600"
                  placeholder="Additional info..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsModalOpen(false);
                    setCurrentPassenger(null);
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
                    ? currentPassenger
                      ? 'Saving...'
                      : 'Creating...'
                    : currentPassenger
                    ? 'Save Changes'
                    : 'Create Passenger'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PassengerInfo;
