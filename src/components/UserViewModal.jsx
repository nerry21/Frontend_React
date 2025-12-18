import React from 'react';
import { User, Mail, Smartphone, Shield, Activity, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const UserViewModal = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-2 border-gray-700 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-100">
             <img src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg" alt="LAKUTRAND Logo" className="w-7 h-7 mr-2 rounded-full" />
             User Details
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Header with Avatar */}
          <div className="flex flex-col items-center justify-center pb-6 border-b border-gray-800">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-xl overflow-hidden`}>
              <img src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg" alt="LAKUTRAND Logo" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-2xl font-bold text-white">{user.name}</h3>
            <p className="text-gray-400">@{user.username}</p>
            <div className="flex gap-2 mt-3">
               <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  user.role === 'admin' 
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {user.role}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  user.status === 'active' 
                  ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {user.status}
                </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-gray-800">
               <div className="p-2 bg-slate-700 rounded-full">
                  <Mail className="w-5 h-5 text-gray-300" />
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase">Email Address</p>
                  <p className="text-sm font-medium text-white">{user.email}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-gray-800">
               <div className="p-2 bg-slate-700 rounded-full">
                  <Smartphone className="w-5 h-5 text-gray-300" />
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase">Phone Number</p>
                  <p className="text-sm font-medium text-white">{user.phone || 'Not provided'}</p>
               </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-gray-800">
               <div className="p-2 bg-slate-700 rounded-full">
                  <Calendar className="w-5 h-5 text-gray-300" />
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase">Date Joined</p>
                  <p className="text-sm font-medium text-white">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
               </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserViewModal;