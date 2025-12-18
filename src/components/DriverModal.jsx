import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const DriverModal = ({ isOpen, onClose, onSave, driver }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    vehicleAssigned: ''
  });

  useEffect(() => {
    if (driver) {
      setFormData(driver);
    } else {
      setFormData({ name: '', role: '', phone: '', vehicleAssigned: '' });
    }
  }, [driver]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-2 border-yellow-500/30 text-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-yellow-400">{driver ? 'Edit Member' : 'Add Team Member'}</h2>
          
          <div>
            <Label className="text-gray-300">Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300">Role</Label>
            <Input
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-slate-800 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300">Vehicle Assigned (Optional)</Label>
            <Input
              value={formData.vehicleAssigned}
              onChange={(e) => setFormData({ ...formData, vehicleAssigned: e.target.value })}
              placeholder="e.g., BM 1234 AB"
              className="bg-slate-800 border-gray-700 text-white"
            />
          </div>

          <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DriverModal;