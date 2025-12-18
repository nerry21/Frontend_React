// src/components/UserFormModal.jsx
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLE_OPTIONS = [
  { label: 'Owner', value: 'owner' },
  { label: 'Admin', value: 'admin' },
  { label: 'Mitra', value: 'mitra' },
  { label: 'Driver', value: 'driver' },
  { label: 'Customer', value: 'customer' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const UserFormModal = ({ isOpen, onClose, onSave, user, mode = 'create' }) => {
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    status: 'active',
  });

  // isi form ketika modal dibuka / user berubah
  useEffect(() => {
    if (isEdit && user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '', // password sengaja dikosongkan
        role: (user.role || 'customer').toLowerCase(),
        status: user.status || 'active',
      });
    } else if (!isEdit) {
      setFormData({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        status: 'active',
      });
    }
  }, [isEdit, user, isOpen]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = { ...formData };

    // Kalau edit & password kosong → jangan kirim field password
    if (isEdit && !payload.password) {
      delete payload.password;
    }

    onSave(payload);
  };

  const handleClose = () => {
    onClose && onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-slate-900 border border-slate-700 max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">
            {isEdit ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEdit
              ? 'Update user information and role.'
              : 'Fill the form below to create new user.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-slate-200">
              Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username" className="text-slate-200">
              Username
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={handleChange('username')}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-slate-200">
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleChange('phone')}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-slate-200">
              {isEdit ? 'New Password (optional)' : 'Password'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
              required={!isEdit} // wajib kalau create, opsional kalau edit
            />
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ROLE DROPDOWN (native select) */}
            <div>
              <Label htmlFor="role" className="text-slate-200">
                Role
              </Label>
              <select
                id="role"
                value={formData.role}
                onChange={handleChange('role')}
                className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS DROPDOWN (native select) */}
            <div>
              <Label htmlFor="status" className="text-slate-200">
                Status
              </Label>
              <select
                id="status"
                value={formData.status}
                onChange={handleChange('status')}
                className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-600 text-slate-200"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
            >
              {isEdit ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormModal;
