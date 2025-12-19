import React, { useState, useEffect } from 'react';
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
const BOOKING_PAGE_PATH = import.meta.env.VITE_BOOKING_PAGE_PATH || '/reguler';

function isBookingMarker(v) {
  return typeof v === 'string' && v.startsWith('BOOKING:');
}

function parseBookingId(marker) {
  if (!isBookingMarker(marker)) return null;
  const idStr = marker.slice('BOOKING:'.length).trim();
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

function openETicket(v) {
  if (!v) return;

  // marker: buka halaman booking agar user bisa lihat invoice/e-ticket
  const bookingId = parseBookingId(v);
  if (bookingId) {
    const url = `${BOOKING_PAGE_PATH}?bookingId=${bookingId}`;
    window.open(url, '_blank');
    return;
  }

  const url = resolveToAbsoluteUrl(v);
  if (url) window.open(url, '_blank');
}

// ==============================
// ✅ Tambahan helpers: ambil bookingId dari hint/notes
// ==============================
function parseBookingIdFromInvoiceHint(hint) {
  if (!hint || typeof hint !== 'string') return null;

  // contoh: "ETICKET_INVOICE_FROM_BOOKING:123"
  const idx = hint.lastIndexOf(':');
  if (idx < 0) return null;
  const idStr = hint.slice(idx + 1).trim();
  const id = Number(idStr);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function tryParseLastJsonFromNotes(notes) {
  if (!notes || typeof notes !== 'string') return null;

  // biasanya sync nempel JSON di akhir notes (baris terakhir)
  // cari '{' terakhir, coba parse dari situ.
  const lastBrace = notes.lastIndexOf('{');
  if (lastBrace < 0) return null;

  const candidate = notes.slice(lastBrace).trim();
  if (!candidate.startsWith('{') || !candidate.endsWith('}')) return null;

  try {
    const obj = JSON.parse(candidate);
    return obj && typeof obj === 'object' ? obj : null;
  } catch (e) {
    return null;
  }
}

function computeEffectiveETicketValue(passenger) {
  // 1) kalau sudah ada eTicketPhoto, pakai itu
  if (passenger?.eTicketPhoto) return passenger.eTicketPhoto;

  // 2) coba dari field backend baru (jika ada)
  const hint = passenger?.eTicketInvoiceHint;
  const bidFromHint = parseBookingIdFromInvoiceHint(hint);
  if (bidFromHint) return `BOOKING:${bidFromHint}`;

  // 3) coba dari notes JSON sync (bookingId)
  const syncObj = tryParseLastJsonFromNotes(passenger?.notes);
  const bidFromNotes = syncObj?.bookingId ? Number(syncObj.bookingId) : null;
  if (Number.isFinite(bidFromNotes) && bidFromNotes > 0) {
    return `BOOKING:${bidFromNotes}`;
  }

  // 4) jika backend mengirim bookingId langsung
  const bidDirect = passenger?.bookingId ? Number(passenger.bookingId) : null;
  if (Number.isFinite(bidDirect) && bidDirect > 0) {
    return `BOOKING:${bidDirect}`;
  }

  return '';
}

import DashboardLayout from '@/components/DashboardLayout';

const PassengerInfo = () => {
  const { toast } = useToast();
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

    // ✅ Tambahan fields (tidak mengganggu, untuk kompatibilitas data baru backend)
    bookingId: '',
    eTicketInvoiceHint: '',
    bookingHint: '',
    suratJalanApi: '',
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

      // ✅ Tambahan fields (tidak mengganggu)
      bookingId: '',
      eTicketInvoiceHint: '',
      bookingHint: '',
      suratJalanApi: '',
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

        // ✅ Tambahan fields (kalau backend mengirim)
        bookingId: passenger.bookingId || '',
        eTicketInvoiceHint: passenger.eTicketInvoiceHint || '',
        bookingHint: passenger.bookingHint || '',
        suratJalanApi: passenger.suratJalanApi || '',
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
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Penumpang</p>
                <p className="text-2xl font-bold text-white">
                  {passengers.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Reguler</p>
                <p className="text-2xl font-bold text-white">
                  {passengers.filter((p) => p.serviceType === 'Reguler').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Dropping</p>
                <p className="text-2xl font-bold text-white">
                  {passengers.filter((p) => p.serviceType === 'Dropping').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Rental</p>
                <p className="text-2xl font-bold text-white">
                  {passengers.filter((p) => p.serviceType === 'Rental').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <Input
            placeholder="Cari nama, no HP, atau layanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 bg-slate-900 border-yellow-500/20 text-white"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-yellow-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left py-4 px-6 text-yellow-400 font-semibold">
                    Nama
                  </th>
                  <th className="text-left py-4 px-6 text-yellow-400 font-semibold">
                    No HP
                  </th>
                  <th className="text-left py-4 px-6 text-yellow-400 font-semibold">
                    Tanggal
                  </th>
                  <th className="text-left py-4 px-6 text-yellow-400 font-semibold">
                    Jam
                  </th>
                  <th className="text-left py-4 px-6 text-yellow-400 font-semibold">
                    Layanan
                  </th>
                  <th className="text-left py-4 px-6 text-yellow-400 font-semibold">
                    Total
                  </th>
                  <th className="text-left py-4 px-6 text-yellow-400 font-semibold">
                    Seat
                  </th>
                  <th className="text-left py-4 px-6 text-yellow-400 font-semibold">
                    E-Ticket
                  </th>
                  <th className="text-left py-4 px-6 text-yellow-400 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPassengers.map((passenger, index) => {
                  const effectiveETicket = computeEffectiveETicketValue(passenger);

                  return (
                    <tr
                      key={passenger.id}
                      className={`border-t border-slate-800 hover:bg-slate-800/50 transition-colors ${
                        index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {passenger.passengerName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {passenger.driverName || 'No Driver'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {passenger.passengerPhone}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {passenger.date}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {passenger.departureTime}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          {passenger.serviceType}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-white font-semibold">
                        Rp {passenger.totalAmount}
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-gray-300 text-sm">
                          {String(passenger.selectedSeats || '')}
                        </span>
                      </td>

                      {/* Foto / DOCS E-Ticket */}
                      <td className="py-4 px-6">
                        {effectiveETicket ? (
                          <button
                            type="button"
                            onClick={() => openETicket(effectiveETicket)}
                            className="inline-flex flex-col items-start gap-1"
                          >
                            {isBookingMarker(effectiveETicket) ? (
                              <div className="w-16 h-16 rounded border border-slate-600 bg-slate-800 flex items-center justify-center text-[10px] text-yellow-400">
                                DOCS
                              </div>
                            ) : (
                              <img
                                src={resolveToAbsoluteUrl(effectiveETicket)}
                                alt="E-Ticket"
                                className="w-16 h-16 object-cover rounded border border-slate-600"
                              />
                            )}
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

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(passenger)}
                            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDeleteModal(passenger)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredPassengers.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="py-12 text-center text-gray-500"
                    >
                      Tidak ada data penumpang ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form */}
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
                className="bg-slate-900 border border-yellow-500/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {currentPassenger ? 'Edit Penumpang' : 'Tambah Penumpang'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                        Jam Keberangkatan
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
                            onClick={() => openETicket(formData.eTicketPhoto)}
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
