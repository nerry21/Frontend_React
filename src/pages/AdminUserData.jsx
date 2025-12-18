import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, Shield, Plus, Mail, Smartphone, User, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import CrudActions from '@/components/CrudActions';
import UserFormModal from '@/components/UserFormModal';
import UserViewModal from '@/components/UserViewModal';

// Bisa pakai ENV kalau mau: VITE_API_BASE_URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const roleLabelMap = {
  owner: 'OWNER',
  admin: 'ADMIN',
  mitra: 'PARTNER',
  driver: 'DRIVER',
  customer: 'CUSTOMER',
  user: 'CUSTOMER', // fallback untuk user biasa
};

const AdminUserData = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);

  // =========================
  // LOAD DATA DARI BACKEND
  // =========================
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (!res.ok) {
        throw new Error('Gagal mengambil data users');
      }
      const data = await res.json();

      // Normalisasi + sort dari yang paling lama ke terbaru
      const normalized = (data || []).map((u) => ({
        ...u,
        createdAt: u.created_at || u.createdAt || null,
      }));

      const sorted = normalized.slice().sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setUsers(sorted);
    } catch (err) {
      console.error('Error loadUsers:', err);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data users dari server.',
        variant: 'destructive',
      });
    }
  };

  // CREATE
  const handleCreate = () => {
    setSelectedUser(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  // READ (View)
  const handleView = (user) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  // UPDATE (Edit)
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  // DELETE (ke backend)
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menghapus user');
      }

      toast({
        title: 'User Deleted',
        description: 'The user has been permanently removed from the system.',
        variant: 'destructive',
      });

      await loadUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      toast({
        title: 'Error',
        description: 'Gagal menghapus user.',
        variant: 'destructive',
      });
    }
  };

  // SAVE (Create atau Update) → ke backend
  const handleSave = async (formData) => {
    try {
      if (formMode === 'create') {
        // formData berasal dari UserFormModal
        const body = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          role: formData.role || 'customer',
          status: formData.status || 'active',
          // boleh diganti: minta user isi password di form
          password: formData.password || '123456',
        };

        const res = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal membuat user baru');
        }

        toast({
          title: 'User Created',
          description: `${formData.name} has been added successfully.`,
        });
      } else if (selectedUser) {
        // Pastikan role & status selalu terkirim saat update
        const body = {
          name: formData.name ?? selectedUser.name,
          username: formData.username ?? selectedUser.username,
          email: formData.email ?? selectedUser.email,
          phone: formData.phone ?? selectedUser.phone,
          role: formData.role || selectedUser.role || 'customer',
          status: formData.status || selectedUser.status || 'active',
        };

        const res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal mengupdate user');
        }

        toast({
          title: 'User Updated',
          description: 'User details have been saved.',
        });
      }

      setIsFormOpen(false);
      await loadUsers();
    } catch (err) {
      console.error('Save user error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Gagal menyimpan user.',
        variant: 'destructive',
      });
    }
  };

  // Filter users berdasarkan search
  const filteredUsers = users.filter((user) =>
    [user.name, user.username, user.email]
      .filter(Boolean)
      .some((field) =>
        field.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <DashboardLayout>
      <Helmet>
        <title>Admin & User Data - LAKUTRAND App</title>
        <meta
          name="description"
          content="Manage users and administrators for LAKUTRAND"
        />
      </Helmet>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              Admin & User Data
            </h1>
            <p className="text-gray-400">
              Manage system users, roles, and access permissions
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New User
            </Button>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <div className="bg-slate-800/30 p-4 rounded-xl border border-gray-700/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name, email, or username..."
              className="pl-10 bg-slate-900 border-gray-700 text-white focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/90 border-b border-gray-700">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                    No
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                    User Identity
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                    Role / Status
                  </th>
                  <th className="text-right py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers.map((user, index) => {
                  const rawRole = (user.role || '').toLowerCase().trim();
                  const roleLabel = roleLabelMap[rawRole] || 'UNKNOWN';

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-slate-700/30 transition-colors"
                    >
                      {/* NO */}
                      <td className="py-4 px-6 text-gray-300 font-semibold">
                        {index + 1}
                      </td>

                      {/* Identity Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg overflow-hidden">
                            <img
                              src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg"
                              alt="LAKUTRAND Logo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-white font-bold text-base">
                              {user.name}
                            </div>
                            <div className="text-gray-500 text-sm flex items-center gap-1">
                              <User className="w-3 h-3" /> @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Mail className="w-3.5 h-3.5 text-gray-500" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                            <span>{user.phone || '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Status Column */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-2 items-start">
                          <div className="flex items-center gap-2">
                            {rawRole === 'admin' && (
                              <Shield className="w-4 h-4 text-yellow-400" />
                            )}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                rawRole === 'owner'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                  : rawRole === 'admin'
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  : rawRole === 'driver'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : rawRole === 'mitra'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : 'bg-slate-500/20 text-slate-200 border-slate-500/30'
                              }`}
                            >
                              {roleLabel}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                              user.status === 'active'
                                ? 'text-green-400 bg-green-500/10'
                                : 'text-red-400 bg-red-500/10'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'active'
                                  ? 'bg-green-400'
                                  : 'bg-red-400'
                              }`}
                            />
                            {user.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-6 text-right">
                        <CrudActions
                          itemName={user.name}
                          onView={() => handleView(user)}
                          onEdit={() => handleEdit(user)}
                          onDelete={() => handleDelete(user.id)}
                        />
                      </td>
                    </motion.tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Users className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">
                          Try adjusting your search or add a new user.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        user={selectedUser}
        mode={formMode}
      />

      <UserViewModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        user={selectedUser}
      />
    </DashboardLayout>
  );
};

export default AdminUserData;
