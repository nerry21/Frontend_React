import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  Users,
  Phone,
  Calendar,
  Clock,
  MapPin,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// ==============================
// Helpers: handle E-Ticket value
// - bisa berupa dataURL/base64
// - bisa berupa URL absolut
// - bisa berupa URL relatif (mis. /uploads/.. atau /api/..)
// - bisa berupa marker: "BOOKING:<id>" (dokumen ada di halaman booking)
// ==============================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
// ✅ FIX: default route booking di App.jsx adalah "/booking".
// (Kalau env VITE_BOOKING_PAGE_PATH diset, tetap akan dipakai.)
const BOOKING_PAGE_PATH = import.meta.env.VITE_BOOKING_PAGE_PATH || '/booking';

function isBookingMarker(v) {
  return (
    typeof v === 'string' &&
    (v.startsWith('BOOKING:') || v.startsWith('ETICKET_INVOICE_FROM_BOOKING:'))
  );
}

function parseBookingId(marker) {
  if (!isBookingMarker(marker)) return null;

  const s = String(marker);
  let idStr = '';
  if (s.startsWith('BOOKING:')) {
    idStr = s.slice('BOOKING:'.length).trim();
  } else if (s.startsWith('ETICKET_INVOICE_FROM_BOOKING:')) {
    idStr = s.slice('ETICKET_INVOICE_FROM_BOOKING:'.length).trim();
  }

  const id = Number(idStr);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function resolveToAbsoluteUrl(v) {
  if (!v || typeof v !== 'string') return v;

  // sudah data URL / base64
  if (v.startsWith('data:')) return v;

  // sudah absolut
  if (v.startsWith('http://') || v.startsWith('https://')) return v;

  // marker booking -> tidak bisa jadi src img
  if (isBookingMarker(v)) return '';

  // relatif: gabung dengan API_BASE
  if (v.startsWith('/')) return `${API_BASE}${v}`;

  return v;
}

function openETicket(v, navigate) {
  if (!v) return;

  // marker: buka halaman booking agar user bisa lihat invoice/e-ticket
  const bookingId = parseBookingId(v);
  if (bookingId) {
    // ✅ FIX: buka via SPA (tidak reload) + hanya tampilkan E-Ticket & Invoice.
    // Surat jalan tetap ada di Trip Information (bukan dari Passenger Info).
    const url = `${BOOKING_PAGE_PATH}?bookingId=${bookingId}&showDocs=1&docs=eticket-invoice&hideSuratJalan=1`;

    if (typeof navigate === 'function') {
      navigate(url);
    } else {
      // fallback kalau dipakai di luar react-router
      window.open(url, '_self');
    }
    return;
  }

  const url = resolveToAbsoluteUrl(v);
  if (url) window.open(url, '_blank');
}

import DashboardLayout from '@/components/DashboardLayout';

const PassengerInfo = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
    serviceType: 'Reguler',
    eTicketPhoto: '',
    driverName: '',
    vehicleCode: '',
    notes: '',
  });

  // Fetch passengers data
  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/passengers');
      if (!response.ok) {
        throw new Error('Failed to fetch passengers');
      }
      const data = await response.json();
      setPassengers(data);
    } catch (error) {
      console.error('Error fetching passengers:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data penumpang',
        variant: 'destructive',
      });
    }
  };

  const filteredPassengers = passengers.filter((passenger) =>
    passenger.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passenger.passengerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passenger.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      passengerName: '',
      passengerPhone: '',
      date: '',
      departureTime: '',
      pickupAddress: '',
      dropoffAddress: '',
      totalAmount: '',
      selectedSeats: '',
      serviceType: 'Reguler',
      eTicketPhoto: '',
      driverName: '',
      vehicleCode: '',
      notes: '',
    });
    setCurrentPassenger(null);
  };

  const handleOpenModal = (passenger = null) => {
    if (passenger) {
      setCurrentPassenger(passenger);
      setFormData({
        passengerName: passenger.passengerName || '',
        passengerPhone: passenger.passengerPhone || '',
        date: passenger.date || '',
        departureTime: passenger.departureTime || '',
        pickupAddress: passenger.pickupAddress || '',
        dropoffAddress: passenger.dropoffAddress || '',
        totalAmount: passenger.totalAmount || '',
        selectedSeats: passenger.selectedSeats || '',
        serviceType: passenger.serviceType || 'Reguler',
        eTicketPhoto: passenger.eTicketPhoto || '',
        driverName: passenger.driverName || '',
        vehicleCode: passenger.vehicleCode || '',
        notes: passenger.notes || '',
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleOpenDeleteModal = (passenger) => {
    setCurrentPassenger(passenger);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentPassenger(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = currentPassenger
        ? `http://localhost:8080/api/passengers/${currentPassenger.id}`
        : 'http://localhost:8080/api/passengers';
      const method = currentPassenger ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save passenger');
      }

      toast({
        title: 'Success',
        description: currentPassenger
          ? 'Data penumpang berhasil diperbarui'
          : 'Data penumpang berhasil ditambahkan',
      });

      handleCloseModal();
      fetchPassengers();
    } catch (error) {
      console.error('Error saving passenger:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan data penumpang',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!currentPassenger) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/passengers/${currentPassenger.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete passenger');
      }

      toast({
        title: 'Success',
        description: 'Data penumpang berhasil dihapus',
      });

      handleCloseDeleteModal();
      fetchPassengers();
    } catch (error) {
      console.error('Error deleting passenger:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus data penumpang',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Nama',
      'No HP',
      'Tanggal',
      'Jam',
      'Pickup',
      'Dropoff',
      'Total',
      'Seat',
      'Layanan',
      'Driver',
      'Kendaraan',
      'Catatan',
    ];

    const csvData = filteredPassengers.map((p) => [
      p.passengerName,
      p.passengerPhone,
      p.date,
      p.departureTime,
      p.pickupAddress,
      p.dropoffAddress,
      p.totalAmount,
      p.selectedSeats,
      p.serviceType,
      p.driverName,
      p.vehicleCode,
      p.notes,
    ]);

    const csvContent =
      [headers, ...csvData]
        .map((row) =>
          row
            .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `passengers_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Data Penumpang - Travel App</title>
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Data Penumpang</h1>
            <p className="text-gray-400 text-sm">
              Kelola data penumpang dan informasi perjalanan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleOpenModal()}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Penumpang
            </Button>

            <Button
              variant="outline"
              onClick={exportToCSV}
              className="border-slate-600 text-gray-300 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari nama, no hp, atau layanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-gray-400"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Nama</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">No HP</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Jam</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Pickup</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Dropoff</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Seat</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Layanan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">E-Ticket</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Driver</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Kendaraan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPassengers.map((passenger) => (
                  <tr key={passenger.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-white font-medium">{passenger.passengerName}</td>
                    <td className="px-4 py-3 text-gray-300">{passenger.passengerPhone}</td>
                    <td className="px-4 py-3 text-gray-300">{passenger.date}</td>
                    <td className="px-4 py-3 text-gray-300">{passenger.departureTime}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{passenger.pickupAddress}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{passenger.dropoffAddress}</td>
                    <td className="px-4 py-3 text-gray-300">
                      Rp {Number(passenger.totalAmount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{passenger.selectedSeats}</td>
                    <td className="px-4 py-3 text-gray-300">{passenger.serviceType}</td>

                    {/* E-Ticket column */}
                    <td className="px-4 py-3">
                      {passenger.eTicketPhoto ? (
                        <button
                          type="button"
                          onClick={() => openETicket(passenger.eTicketPhoto, navigate)}
                          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 underline text-sm"
                          title="Buka E-Ticket / Invoice"
                        >
                          <FileText className="w-4 h-4" />
                          DOC
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-300">{passenger.driverName}</td>
                    <td className="px-4 py-3 text-gray-300">{passenger.vehicleCode}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenModal(passenger)}
                          className="border-slate-600 text-gray-300 hover:bg-slate-800"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDeleteModal(passenger)}
                          className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredPassengers.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-4 py-10 text-center text-gray-400">
                      Tidak ada data penumpang
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                      {currentPassenger ? 'Edit Penumpang' : 'Tambah Penumpang'}
                    </h2>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Passenger Name */}
                      <div className="space-y-2">
                        <Label htmlFor="passengerName" className="text-gray-300">
                          Nama Penumpang
                        </Label>
                        <Input
                          id="passengerName"
                          name="passengerName"
                          value={formData.passengerName}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>

                      {/* Passenger Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="passengerPhone" className="text-gray-300">
                          No HP
                        </Label>
                        <Input
                          id="passengerPhone"
                          name="passengerPhone"
                          value={formData.passengerPhone}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                          required
                        />
                      </div>

                      {/* Date */}
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-gray-300">
                          Tanggal
                        </Label>
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>

                      {/* Departure Time */}
                      <div className="space-y-2">
                        <Label htmlFor="departureTime" className="text-gray-300">
                          Jam Berangkat
                        </Label>
                        <Input
                          id="departureTime"
                          name="departureTime"
                          type="time"
                          value={formData.departureTime}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>

                      {/* Pickup Address */}
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="pickupAddress" className="text-gray-300">
                          Alamat Pickup
                        </Label>
                        <Input
                          id="pickupAddress"
                          name="pickupAddress"
                          value={formData.pickupAddress}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>

                      {/* Dropoff Address */}
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="dropoffAddress" className="text-gray-300">
                          Alamat Dropoff
                        </Label>
                        <Input
                          id="dropoffAddress"
                          name="dropoffAddress"
                          value={formData.dropoffAddress}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>

                      {/* Total Amount */}
                      <div className="space-y-2">
                        <Label htmlFor="totalAmount" className="text-gray-300">
                          Total Amount
                        </Label>
                        <Input
                          id="totalAmount"
                          name="totalAmount"
                          value={formData.totalAmount}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>

                      {/* Selected Seats */}
                      <div className="space-y-2">
                        <Label htmlFor="selectedSeats" className="text-gray-300">
                          Selected Seats
                        </Label>
                        <Input
                          id="selectedSeats"
                          name="selectedSeats"
                          value={formData.selectedSeats}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>

                      {/* Service Type */}
                      <div className="space-y-2">
                        <Label htmlFor="serviceType" className="text-gray-300">
                          Service Type
                        </Label>
                        <select
                          id="serviceType"
                          name="serviceType"
                          value={formData.serviceType}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-600 text-white"
                        >
                          <option value="Reguler">Reguler</option>
                          <option value="Dropping">Dropping</option>
                          <option value="Rental">Rental</option>
                          <option value="Paket Barang">Paket Barang</option>
                        </select>
                      </div>

                      {/* Driver Name */}
                      <div className="space-y-2">
                        <Label htmlFor="driverName" className="text-gray-300">
                          Driver Name
                        </Label>
                        <Input
                          id="driverName"
                          name="driverName"
                          value={formData.driverName}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>

                      {/* Vehicle Code */}
                      <div className="space-y-2">
                        <Label htmlFor="vehicleCode" className="text-gray-300">
                          Vehicle Code
                        </Label>
                        <Input
                          id="vehicleCode"
                          name="vehicleCode"
                          value={formData.vehicleCode}
                          onChange={handleInputChange}
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                      </div>

                      {/* E-Ticket Photo */}
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="eTicketPhoto" className="text-gray-300">
                          E-Ticket Photo (URL/Base64/BOOKING:&lt;id&gt;)
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="eTicketPhoto"
                            name="eTicketPhoto"
                            value={formData.eTicketPhoto}
                            onChange={handleInputChange}
                            className="bg-slate-800 border-slate-600 text-white"
                          />
                          {formData.eTicketPhoto && (
                            <button
                              type="button"
                              onClick={() => openETicket(formData.eTicketPhoto, navigate)}
                              className="text-yellow-400 underline text-sm"
                            >
                              Preview
                            </button>
                          )}
                          {formData.eTicketPhoto && (
                            <div className="ml-2">
                              {isBookingMarker(formData.eTicketPhoto) ? (
                                <div className="w-12 h-12 rounded border border-slate-600 bg-slate-800 flex items-center justify-center text-[9px] text-yellow-400">
                                  DOCS
                                </div>
                              ) : (
                                <img
                                  src={resolveToAbsoluteUrl(formData.eTicketPhoto)}
                                  alt="Preview E-Ticket"
                                  className="w-12 h-12 object-cover rounded border border-slate-600"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-gray-300">
                        Keterangan / Catatan
                      </Label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="w-full min-h-[90px] px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-white"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCloseModal}
                        className="border-slate-600 text-gray-300 hover:bg-slate-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
                      >
                        {currentPassenger ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && currentPassenger && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={handleCloseDeleteModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-slate-900 border border-red-500/20 rounded-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white">
                    Hapus Penumpang?
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Anda yakin ingin menghapus data penumpang{' '}
                    <span className="text-white font-semibold">
                      {currentPassenger.passengerName}
                    </span>
                    ?
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleCloseDeleteModal}
                      className="border-slate-600 text-gray-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default PassengerInfo;
