import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const EMPTY_FORM = {
  id: null,
  vehicleCode: '', // ✅ Kode Mobil
  plateNumber: '',
  color: '#000000',
  kilometers: '', // keep as string in form
  lastService: '',
  condition: 'Baik',
  stnkPhoto: '', // base64
};

function toDateInputValue(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  return '';
}

const VehicleModal = ({ isOpen, onClose, onSave, vehicle }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);

  const isEdit = useMemo(() => Boolean(vehicle?.id), [vehicle]);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        ...EMPTY_FORM,
        ...vehicle,
        vehicleCode: vehicle.vehicleCode ?? vehicle.vehicle_code ?? '',
        plateNumber: vehicle.plateNumber ?? vehicle.plate_number ?? '',
        lastService: toDateInputValue(vehicle.lastService ?? vehicle.last_service),
        kilometers:
          vehicle.kilometers === null || vehicle.kilometers === undefined
            ? ''
            : String(vehicle.kilometers),
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [vehicle]);

  const handleChange = (key) => (e) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleUploadSTNK = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // optional: batasi ukuran agar tidak “max_allowed_packet”
    const MAX_MB = 1; // aman untuk mysql (sesuaikan)
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File terlalu besar. Maksimal ${MAX_MB}MB.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, stnkPhoto: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSTNK = () => {
    setFormData((prev) => ({ ...prev, stnkPhoto: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      id: formData.id ?? null,
      vehicleCode: String(formData.vehicleCode || '').trim(),
      plateNumber: String(formData.plateNumber || '').trim(),
      color: String(formData.color || '').trim(),
      kilometers:
        formData.kilometers === '' || formData.kilometers === null
          ? null
          : Number(formData.kilometers),
      lastService: String(formData.lastService || '').trim(), // YYYY-MM-DD atau ""
      // field tambahan (kalau backend belum butuh, aman tetap dikirim, tapi backend harus ignore)
      condition: formData.condition,
      stnkPhoto: formData.stnkPhoto,
    };

    if (!payload.vehicleCode || !payload.plateNumber) {
      alert('Kode Mobil dan Plat Mobil wajib diisi.');
      return;
    }

    onSave(payload);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="bg-slate-900 border-2 border-yellow-500/30 text-white max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-yellow-400">
            {isEdit ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
          </h2>

          {/* ✅ KODE MOBIL + PLAT */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Kode Mobil</Label>
              <Input
                value={formData.vehicleCode}
                onChange={handleChange('vehicleCode')}
                className="bg-slate-800 border-gray-700 text-white font-semibold"
                placeholder="LK03"
                required
              />
            </div>

            <div>
              <Label className="text-gray-300">Plat Mobil</Label>
              <Input
                value={formData.plateNumber}
                onChange={handleChange('plateNumber')}
                className="bg-slate-800 border-gray-700 text-white font-mono uppercase"
                placeholder="BM 1234 XX"
                required
              />
            </div>
          </div>

          {/* WARNA */}
          <div>
            <Label className="text-gray-300">Warna</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.color}
                onChange={handleChange('color')}
                className="bg-slate-800 border-gray-700 h-10 w-20 p-1"
              />
              <Input
                value={formData.color}
                readOnly
                className="bg-slate-800 border-gray-700 text-gray-400 font-mono text-xs"
              />
            </div>
          </div>

          {/* KM + SERVIS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Kilometer (KM)</Label>
              <Input
                type="number"
                value={formData.kilometers}
                onChange={handleChange('kilometers')}
                className="bg-slate-800 border-gray-700 text-white"
                placeholder="120000"
              />
            </div>
            <div>
              <Label className="text-gray-300">Servis Terakhir</Label>
              <Input
                type="date"
                value={formData.lastService}
                onChange={handleChange('lastService')}
                className="bg-slate-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* KONDISI */}
          <div>
            <Label className="text-gray-300">Kondisi Kendaraan</Label>
            <select
              value={formData.condition}
              onChange={handleChange('condition')}
              className="w-full bg-slate-800 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="Baik">Baik - Siap Jalan</option>
              <option value="Cukup">Cukup - Ada Minor</option>
              <option value="Perawatan">Butuh Perawatan</option>
              <option value="Servis">Sedang Servis</option>
            </select>
          </div>

          {/* STNK PHOTO */}
          <div>
            <Label className="text-gray-300 mb-2 block">Foto STNK</Label>

            {formData.stnkPhoto ? (
              <div className="bg-slate-800/50 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
                <img
                  src={formData.stnkPhoto}
                  alt="STNK"
                  className="w-16 h-16 object-cover rounded-lg border border-white/10"
                />
                <div className="flex-1">
                  <div className="text-sm text-white font-semibold">STNK terupload</div>
                  <div className="text-xs text-gray-400">Klik “Hapus” untuk ganti file</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500/50 text-red-300 hover:bg-red-500/10"
                  onClick={handleRemoveSTNK}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer group">
                <Camera className="w-8 h-8 text-gray-500 group-hover:text-yellow-400 mb-2 transition-colors" />
                <span className="text-xs text-gray-400 group-hover:text-gray-300">
                  Klik untuk upload foto STNK (max 1MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadSTNK}
                />
              </label>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-gray-700 text-gray-200"
              onClick={onClose}
            >
              Batal
            </Button>

            <Button
              type="submit"
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
            >
              {isEdit ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleModal;
