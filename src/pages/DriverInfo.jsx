import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { UserCheck, Plus, Phone, Car, ShieldCheck } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DriverModal from '@/components/DriverModal';
import { useToast } from '@/components/ui/use-toast';
import CrudActions from '@/components/CrudActions';

const ITEMS_PER_PAGE = 9;
const API_BASE = 'http://localhost:8080/api';

const DriverInfo = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔍 Search & Pagination
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // --- LOAD DARI BACKEND ---
  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/drivers`);
      if (!res.ok) {
        throw new Error('Gagal mengambil data driver dari server');
      }
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal memuat data driver',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  // --- CREATE / UPDATE (via modal) ---
  const handleSave = async (driverData) => {
    setSaving(true);
    try {
      if (editingDriver) {
        // UPDATE
        const res = await fetch(`${API_BASE}/drivers/${editingDriver.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(driverData),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Gagal mengupdate driver');
        }
        toast({
          title: 'Updated',
          description: 'Driver updated successfully',
        });
      } else {
        // CREATE
        const res = await fetch(`${API_BASE}/drivers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(driverData),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Gagal menambahkan driver');
        }
        toast({
          title: 'Created',
          description: 'New driver added successfully',
        });
      }

      // reload dari server supaya sinkron
      await loadDrivers();
      setShowModal(false);
      setEditingDriver(null);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan data',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // --- UPDATE FOTO langsung dari kartu ---
  const handleAvatarChange = (event, driver) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result; // data:image/...;base64,...

      const updatedDriver = {
        ...driver,
        photo: base64, // pastikan backend & DB ada kolom `photo`
      };

      try {
        const res = await fetch(`${API_BASE}/drivers/${driver.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedDriver),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Gagal mengupdate foto driver');
        }

        // update state lokal pakai response backend
        setDrivers((prev) =>
          prev.map((d) => (d.id === driver.id ? result : d)),
        );

        toast({
          title: 'Photo updated',
          description: 'Driver photo updated successfully',
        });
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: err.message || 'Gagal mengupdate foto driver',
          variant: 'destructive',
        });
      }
    };

    reader.readAsDataURL(file);
  };

  // --- DELETE ---
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/drivers/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || 'Gagal menghapus driver');
      }

      toast({
        title: 'Deleted',
        description: 'Driver removed successfully',
        variant: 'destructive',
      });

      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menghapus driver',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = () => {
    setEditingDriver(null);
    setShowModal(true);
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setShowModal(true);
  };

  const handleView = (driver) => {
    toast({
      title: 'View Profile',
      description: `Viewing profile of ${driver.name}`,
    });
  };

  // 🔎 Filter driver berdasarkan searchText (name / phone)
  const filteredDrivers = drivers.filter((driver) => {
    if (!searchText) return true;
    const name = (driver.name || '').toLowerCase();
    const phone = (driver.phone || '').toLowerCase();
    const q = searchText.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  // reset halaman ke 1 jika data atau search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, drivers.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPageDrivers = filteredDrivers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleSearchClick = () => {
    setSearchText(searchInput.trim());
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Driver Info - LK Travel App</title>
        <meta name="description" content="Manage driver information" />
      </Helmet>

      <div className="space-y-6">
        {/* Header + Add Member */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Driver, Admin & Partner Info
            </h1>
            <p className="text-gray-400">Manage team member details</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Member
            </Button>
          </motion.div>
        </div>

        {/* 🔍 Search bar */}
        <div className="bg-slate-800/60 border border-gray-700 rounded-xl p-4">
          <div className="max-w-xl space-y-1">
            <Label htmlFor="search-driver">
              Search (Name / Phone Number)
            </Label>
            <div className="flex gap-2">
              <Input
                id="search-driver"
                placeholder="Type name or phone number..."
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

        {/* Loading state */}
        {loading && (
          <p className="text-gray-400 text-sm">Loading drivers...</p>
        )}

        {/* Cards list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPageDrivers.map((driver, index) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-all shadow-lg group"
            >
              <div className="flex items-start justify-between mb-6">
                {/* Avatar + upload foto */}
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAvatarChange(e, driver)}
                  />
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20 transform -rotate-3 group-hover:rotate-0 transition-transform overflow-hidden">
                    {driver.photo ? (
                      <img
                        src={driver.photo}
                        alt={driver.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCheck className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-1 border border-gray-700">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                  </div>
                </label>

                <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                  <CrudActions
                    itemName="Member"
                    onView={() => handleView(driver)}
                    onEdit={() => handleEdit(driver)}
                    onDelete={() => handleDelete(driver.id)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                  {driver.name}
                </h3>
                <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wide">
                  {driver.role}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-700/50">
                <div className="flex items-center gap-3 text-gray-400 group-hover:text-gray-300 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-sm">{driver.phone}</span>
                </div>

                {driver.vehicleAssigned && (
                  <div className="flex items-center gap-3 text-gray-400 group-hover:text-gray-300 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                      <Car className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-sm">
                      {driver.vehicleAssigned}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && filteredDrivers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-gray-700">
            <UserCheck className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No team members found</p>
            <p className="text-gray-500 text-sm mt-1">
              Add drivers, admins or partners to the system
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredDrivers.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between px-1 md:px-2 py-2 md:py-3 gap-3">
            <p className="text-xs text-gray-400">
              Showing{' '}
              {filteredDrivers.length === 0
                ? 0
                : `${startIndex + 1}-${Math.min(
                    startIndex + ITEMS_PER_PAGE,
                    filteredDrivers.length,
                  )}`}{' '}
              of {filteredDrivers.length} members
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

      <DriverModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingDriver(null);
        }}
        onSave={handleSave}
        driver={editingDriver}
        saving={saving}
      />
    </DashboardLayout>
  );
};

export default DriverInfo;
