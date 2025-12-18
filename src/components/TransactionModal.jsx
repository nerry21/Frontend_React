import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Calculator } from 'lucide-react';

const TransactionModal = ({ isOpen, onClose, onSave, transaction }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    revenue: 0,
    bbm: 300000,
    meal: 100000,
    courier: 0,
    adminFeePercent: 15,
  });

  useEffect(() => {
    if (transaction) {
      setFormData(prev => ({ ...prev, ...transaction }));
    }
  }, [transaction]);

  // Derived calculations
  const adminFee = formData.revenue > 430000 ? (formData.revenue * (formData.adminFeePercent / 100)) : 0;
  const totalExpenses = Number(formData.bbm) + Number(formData.meal) + Number(formData.courier);
  const driverIncome = formData.revenue - adminFee - totalExpenses;
  const netProfit = adminFee; // Company profit

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      adminFee,
      totalExpenses,
      driverIncome,
      netProfit
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-2 border-green-500/30 text-white max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-700 pb-4">
             <div className="p-2 bg-green-500/20 rounded-lg">
                <Calculator className="w-6 h-6 text-green-400" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-white">Transaction Calculator</h2>
               <p className="text-sm text-gray-400">Calculate fees, expenses and net profit</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-yellow-400 border-b border-gray-700 pb-2">Revenue & Admin</h3>
              <div>
                <Label className="text-gray-300">Transaction Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-slate-800 border-gray-700"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">Total Revenue (Rp)</Label>
                <Input
                  type="number"
                  value={formData.revenue}
                  onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                  className="bg-slate-800 border-gray-700 text-xl font-bold text-green-400"
                  required
                />
              </div>
              <div className="p-3 bg-slate-800 rounded border border-gray-700">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Admin Fee Status</span>
                  <span className={formData.revenue > 430000 ? "text-green-400" : "text-gray-500"}>
                    {formData.revenue > 430000 ? "Applied (15%)" : "Waived (< 430k)"}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Admin Cut:</span>
                  <span className="text-yellow-400">Rp {adminFee.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="font-semibold text-red-400 border-b border-gray-700 pb-2">Deductions</h3>
               <div>
                <Label className="text-gray-300">BBM Cost (Rp)</Label>
                <Input
                  type="number"
                  value={formData.bbm}
                  onChange={(e) => setFormData({ ...formData, bbm: Number(e.target.value) })}
                  className="bg-slate-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Driver Meal (Rp)</Label>
                <Input
                  type="number"
                  value={formData.meal}
                  onChange={(e) => setFormData({ ...formData, meal: Number(e.target.value) })}
                  className="bg-slate-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-gray-300">Courier/Misc (Rp)</Label>
                <Input
                  type="number"
                  value={formData.courier}
                  onChange={(e) => setFormData({ ...formData, courier: Number(e.target.value) })}
                  className="bg-slate-800 border-gray-700"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
             <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
                <span className="block text-sm text-blue-300 mb-1">Driver Income</span>
                <span className="block text-2xl font-bold text-white">Rp {driverIncome.toLocaleString()}</span>
             </div>
             <div className="bg-green-600/20 p-4 rounded-lg border border-green-500/30">
                <span className="block text-sm text-green-300 mb-1">Company Net Profit</span>
                <span className="block text-2xl font-bold text-white">Rp {netProfit.toLocaleString()}</span>
             </div>
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-bold">
            Save Financial Record
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;