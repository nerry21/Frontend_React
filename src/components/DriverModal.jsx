import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const DEFAULT_VEHICLE_OPTIONS = ['Innova Reborn', 'Hiace'];

const DriverModal = ({
  isOpen,
  onClose,
  onSave,
  driver,
  vehicleOptions, // optional dari parent (DriverInfo.jsx)
}) => {
  const vehicles = useMemo(() => {
    const list = Array.isArray(vehicleOptions) && vehicleOptions.length
      ? vehicleOptions
      : DEFAULT_VEHICLE_OPTIONS;

    // buang duplikat & nilai kosong
    return Array.from(new Set(list.map(String))).filter((v) => v.trim() !== '');
  }, [vehicleOptions]);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    // ✅ tambahan field jenis kendaraan
    vehicleType: '',
    // tetap: plat/kode/assigned
    vehicleAssigned: '',
  });

  useEffect(() => {
    if (driver) {
      // aman untuk driver lama yang belum punya vehicleType
      setFormData({
        name: driver.name || '',
        role: driver.role || '',
        phone: driver.phone || '',
        vehicleType: driver.vehicleType || '',
        vehicleAssigned: driver.vehicleAssigned || '',
        // kalau ada field lain dari backend, biarkan ikut (tidak dibuang)
        ...driver,
      });
    } else {
      setFormData({
        name: '',
        role: '',
        phone: '',
        vehicleType: '',
        vehicleAssigned: '',
      });
    }
  }, [driver]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // trimming basic fields biar rapi
    const payload = {
      ...formData,
      name: (formData.name || '').trim(),
      role: (formData.role || '').trim(),
      phone: (formData.phone || '').trim(),
      vehicleType: (formData.vehicleType || '').trim(),
      vehicleAssigned: (formData.vehicleAssigned || '').trim(),
    };

    onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-2 border-yellow-500/30 text-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-yellow-400">
            {driver ? 'Edit Member' : 'Add Team Member'}
          </h2>

          <div>
            <Label className="text-gray-300">Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-slate-800 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300">Role</Label>
            <Input
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              placeholder="e.g., Driver, Admin, Partner"
              className="bg-slate-800 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300">Phone Number</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="bg-slate-800 border-gray-700 text-white"
              required
            />
          </div>

          {/* ✅ Dropdown jenis kendaraan */}
          <div>
            <Label className="text-gray-300">Vehicle Type (Optional)</Label>
            <select
              value={formData.vehicleType || ''}
              onChange={(e) =>
                setFormData({ ...formData, vehicleType: e.target.value })
              }
              className="w-full bg-slate-800 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
            >
              <option value="">-- Select vehicle type --</option>
              {vehicles.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* info kecil */}
            <p className="text-xs text-gray-500 mt-1">
              Pilih jenis kendaraan (contoh: Innova Reborn / Hiace).
            </p>
          </div>

          {/* tetap ada untuk plat/kode */}
          <div>
            <Label className="text-gray-300">
              Vehicle Assigned (Plate/Code) (Optional)
            </Label>
            <Input
              value={formData.vehicleAssigned}
              onChange={(e) =>
                setFormData({ ...formData, vehicleAssigned: e.target.value })
              }
              placeholder="e.g., BM 1234 AB"
              className="bg-slate-800 border-gray-700 text-white"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900"
          >
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DriverModal;
