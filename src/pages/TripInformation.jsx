import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { FileText, Calendar, Plus, Upload, X } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';

const API_BASE = 'http://localhost:8080/api';
const ITEMS_PER_PAGE = 10; // 🔹 jumlah trip per halaman

const TripInformation = () => {
  const { toast } = useToast();
  const [trips, setTrips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null); // For editing
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    driverName: '',
    vehicleCode: '',
    licensePlate: '',
    tripNumber: '',
    departureDate: '',
    departureTime: '', // 🔹 jam keberangkatan
    eSuratJalan: '', // string (dataURL/base64)
  });

  // 🔍 Search & Pagination
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // --- LOAD DATA DARI BACKEND ---
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/trip-information`);
        if (!res.ok) throw new Error('Gagal mengambil data trip dari server');
        const data = await res.json();
        setTrips(data);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Gagal memuat data trip dari server',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [toast]);

  const reloadTrips = async () => {
    try {
      const res = await fetch(`${API_BASE}/trip-information`);
      if (!res.ok) throw new Error('Gagal mengambil data trip dari server');
      const data = await res.json();
      setTrips(data);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Gagal memuat ulang data trip',
        variant: 'destructive',
      });
    }
  };

  // --- FORM HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, eSuratJalan: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // CREATE / UPDATE ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (currentTrip) {
        // UPDATE
        const res = await fetch(
          `${API_BASE}/trip-information/${currentTrip.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          },
        );
        if (!res.ok) throw new Error('Gagal mengupdate trip');
        toast({
          title: 'Updated',
          description: 'Trip information updated successfully.',
        });
      } else {
        // CREATE
        const res = await fetch(`${API_BASE}/trip-information`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Gagal membuat trip baru');
        const created = await res.json();
        setTrips((prev) => [created, ...prev]);
        toast({ title: 'Created', description: 'New trip record created.' });
      }

      await reloadTrips();
      closeModal();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan data trip',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    setCurrentTrip(null);
    setFormData({
      driverName: '',
      vehicleCode: '',
      licensePlate: '',
      tripNumber: `TRIP-${Math.floor(Math.random() * 10000)}`,
      departureDate: today,
      departureTime: `${hh}:${mm}`,
      eSuratJalan: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (trip) => {
    setCurrentTrip(trip);
    setFormData({
      driverName: trip.driverName || '',
      vehicleCode: trip.vehicleCode || '',
      licensePlate: trip.licensePlate || '',
      tripNumber: trip.tripNumber || '',
      departureDate: trip.departureDate || '',
      departureTime: trip.departureTime || '', // 🔹 ambil dari backend jika ada
      eSuratJalan: trip.eSuratJalan || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/trip-information/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus trip');
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: 'Deleted',
        description: 'Trip record deleted.',
        variant: 'destructive',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menghapus trip',
        variant: 'destructive',
      });
    }
  };

  const closeModal = () => setIsModalOpen(false);

  // 🔎 FILTER & PAGINATION

  const filteredTrips = trips.filter((trip) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;

    const tripNumber = (trip.tripNumber || '').toLowerCase();
    const driverName = (trip.driverName || '').toLowerCase();
    const vehicleCode = (trip.vehicleCode || '').toLowerCase();
    const licensePlate = (trip.licensePlate || '').toLowerCase();
    const departureDate = (trip.departureDate || '').toLowerCase();
    const departureTime = (trip.departureTime || '').toLowerCase();

    return (
      tripNumber.includes(q) ||
      driverName.includes(q) ||
      vehicleCode.includes(q) ||
      licensePlate.includes(q) ||
      departureDate.includes(q) ||
      departureTime.includes(q)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, trips.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTrips.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPageTrips = filteredTrips.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleSearchClick = () => {
    setSearchText(searchInput.trim());
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Trip Information - LK Travel App</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Trip Information
            </h1>
            <p className="text-gray-400">
              Manage daily trips and Surat Jalan
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={openCreateModal}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Trip Record
            </Button>
          </motion.div>
        </div>

        {/* 🔍 Search (Trip, Driver, Vehicle, Tanggal & Jam) */}
        <div className="bg-slate-800/60 border border-gray-700 rounded-xl p-4">
          <div className="max-w-xl space-y-1">
            <Label htmlFor="searchTrip">
              Search (Trip, Driver, Vehicle, Tanggal / Jam Keberangkatan)
            </Label>
            <div className="flex gap-2">
              <Input
                id="searchTrip"
                placeholder="Ct: TRIP-1001 / Budi / INNOVA-01 / 2025-01-01 / 08:00"
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
        </div>

        {/* TABLE */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Trip Details
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Tanggal Keberangkatan
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Jam Keberangkatan
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Driver Info
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Surat Jalan
                  </th>
                  <th className="text-right py-4 px-6 text-gray-400 font-medium text-sm uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-gray-500"
                    >
                      Loading trip records...
                    </td>
                  </tr>
                ) : filteredTrips.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-gray-500"
                    >
                      No trip records found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  currentPageTrips.map((trip) => (
                    <motion.tr
                      key={trip.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Trip Number */}
                      <td className="py-4 px-6">
                        <div className="text-white font-bold">
                          {trip.tripNumber}
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-sm text-gray-300">
                          <Calendar className="w-3 h-3" />
                          <span>{trip.departureDate || '-'}</span>
                        </div>
                      </td>

                      {/* Jam */}
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-300">
                          {trip.departureTime || '-'}
                        </div>
                      </td>

                      {/* Driver */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-yellow-500 font-bold">
                            {trip.driverName?.charAt(0)}
                          </div>
                          <span className="text-gray-300 font-medium">
                            {trip.driverName}
                          </span>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <div className="text-white font-mono">
                            {trip.licensePlate}
                          </div>
                          <div className="text-xs text-gray-500">
                            Code: {trip.vehicleCode}
                          </div>
                        </div>
                      </td>

                      {/* Surat Jalan */}
                      <td className="py-4 px-6">
                        {trip.eSuratJalan ? (
                          <div className="flex items-center gap-2 text-green-400 text-sm">
                            <FileText className="w-4 h-4" /> Uploaded
                            <img
                              src={trip.eSuratJalan}
                              alt="Preview"
                              className="w-8 h-8 object-cover rounded border border-gray-600 ml-2"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs italic">
                            Not uploaded
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <CrudActions
                          itemName="Trip"
                          onView={() =>
                            toast({
                              title: 'Trip Details',
                              description: `Trip #${trip.tripNumber}`,
                            })
                          }
                          onEdit={() => openEditModal(trip)}
                          onDelete={() => handleDelete(trip.id)}
                        />
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredTrips.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-t border-gray-700 bg-slate-900/40 gap-3">
              <p className="text-xs text-gray-400">
                Showing{' '}
                {`${startIndex + 1}-${Math.min(
                  startIndex + ITEMS_PER_PAGE,
                  filteredTrips.length,
                )}`}{' '}
                of {filteredTrips.length} trips
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
                  Page {currentPage} / {totalPages}
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

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-yellow-400">
                {currentTrip ? 'Edit Trip Record' : 'Create New Trip'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tripNumber">Trip Number</Label>
                  <Input
                    id="tripNumber"
                    name="tripNumber"
                    value={formData.tripNumber}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <Input
                    id="departureDate"
                    name="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    required
                  />
                </div>
              </div>

              {/* Jam Keberangkatan */}
              <div className="space-y-2">
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input
                  id="departureTime"
                  name="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverName">Driver Name</Label>
                <Input
                  id="driverName"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  className="bg-slate-800 border-slate-600"
                  placeholder="e.g. Budi Santoso"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleCode">Vehicle Code</Label>
                  <Input
                    id="vehicleCode"
                    name="vehicleCode"
                    value={formData.vehicleCode}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="e.g. INNOVA-01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License Plate</Label>
                  <Input
                    id="licensePlate"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleInputChange}
                    className="bg-slate-800 border-slate-600"
                    placeholder="e.g. BM 1234 XX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>E-Surat Jalan (Photo)</Label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors relative">
                  {formData.eSuratJalan ? (
                    <div className="relative">
                      <img
                        src={formData.eSuratJalan}
                        alt="Preview"
                        className="max-h-40 rounded shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            eSuratJalan: '',
                          }))
                        }
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      <p className="text-sm text-gray-400">
                        Click to upload photo
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
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
                    ? currentTrip
                      ? 'Saving...'
                      : 'Creating...'
                    : currentTrip
                    ? 'Save Changes'
                    : 'Create Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TripInformation;
