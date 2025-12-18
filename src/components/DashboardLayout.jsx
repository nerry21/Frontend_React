import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  Car,
  ClipboardCheck,
  Users,
  UserCheck,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  Home,
  CheckCircle,
  Route,
  IdCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import MalayPattern from '@/components/MalayPattern';
import ChatBot from '@/components/ChatBot';

// 🔹 PATH yang BOLEH untuk customer/user
const CUSTOMER_ALLOWED_PATHS = [
  '/', // LandingPage
  '/services',
  '/booking',
  '/booking/pulsa',
  '/booking/hotel',
  '/booking/airport',
  '/booking/rental',
  '/booking/paket-barang',
  '/reguler-travel',
  '/droping-service',
  '/rental-service',
  '/paket-barang',
];

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 🔹 Khusus CUSTOMER / USER → TANPA SIDEBAR & HEADER (layout sederhana)
  const isCustomerSimpleLayout =
    typeof hasRole === 'function' && hasRole(['customer', 'user']);

  // 🔹 Paksa CUSTOMER/USER hanya boleh di path tertentu
  useEffect(() => {
    if (
      isCustomerSimpleLayout &&
      !CUSTOMER_ALLOWED_PATHS.includes(location.pathname)
    ) {
      navigate('/', { replace: true });
    }
  }, [isCustomerSimpleLayout, location.pathname, navigate]);

  // 🔹 Layout khusus CUSTOMER/USER
  if (isCustomerSimpleLayout) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <MalayPattern />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950" />
        </div>

        <main className="relative z-10 min-h-screen p-4 md:p-8">{children}</main>

        <ChatBot />
      </div>
    );
  }

  // 🔹 MENU + ROLE YANG BOLEH LIHAT (untuk owner/admin/driver/mitra)
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['owner', 'admin'],
    },
    {
      icon: Calendar,
      label: 'Booking',
      path: '/booking',
      roles: ['owner', 'admin', 'driver'],
    },
    {
      icon: DollarSign,
      label: 'Laporan Keuangan',
      path: '/financial-reports',
      roles: ['owner'],
    },
    {
      icon: Car,
      label: 'Laporan Kendaraan',
      path: '/vehicle-reports',
      roles: ['owner', 'admin', 'mitra'],
    },
    {
      icon: ClipboardCheck,
      label: 'Informasi Perjalanan',
      path: '/trip-information',
      roles: ['owner', 'admin', 'mitra', 'driver'],
    },
    {
      icon: Users,
      label: 'Data Penumpang',
      path: '/passenger-info',
      roles: ['owner', 'admin'],
    },
    {
      icon: UserCheck,
      label: 'Data Driver/Admin/Mitra',
      path: '/driver-info',
      roles: ['owner', 'admin'],
    },
    {
      icon: CheckCircle,
      label: 'Validasi Pembayaran',
      path: '/validasi-pembayaran',
      roles: ['owner', 'admin'],
    },
    {
      icon: Route,
      label: 'Pengaturan Keberangkatan',
      path: '/pengaturan-keberangkatan',
      roles: ['owner', 'admin'],
    },
    {
      icon: IdCard,
      label: 'Akun Driver',
      path: '/akun-driver',
      roles: ['owner', 'admin', 'driver'],
    },
    {
      icon: Shield,
      label: 'Data Admin & Pengguna',
      path: '/admin-user-data',
      roles: ['owner', 'admin'],
    },
  ];

  const visibleMenuItems =
    typeof hasRole === 'function'
      ? menuItems.filter((item) => hasRole(item.roles))
      : menuItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarVariants = {
    open: {
      x: 0,
      width: '18rem',
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
      },
    },
    closed: {
      x: -300,
      width: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
      },
    },
  };

  const roleLabel = (currentUser?.role || 'admin').toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden flex relative font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <MalayPattern />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950" />
      </div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed lg:static inset-y-0 left-0 z-50 h-screen bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="p-6 flex items-center gap-3 relative overflow-hidden group">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="w-12 h-12 rounded-full shadow-lg shadow-yellow-500/20 cursor-pointer z-10 overflow-hidden"
              >
                <img
                  src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/c29b7033714ce9b851a1fd1b040f6cfb.jpg"
                  alt="LAKUTRAND Logo"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <div className="z-10 min-w-0">
                <motion.h1 className="font-bold text-white leading-none tracking-tight text-lg whitespace-nowrap truncate">
                  LANCANG KUNING TRAVELINDO
                </motion.h1>
                <span className="text-xs text-yellow-500 font-medium tracking-wide whitespace-nowrap truncate block">
                  Enjoy The Journey
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
              {visibleMenuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <motion.button
                    key={item.path}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(item.path)}
                    className={`w-full min-w-0 flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                      isActive
                        ? 'text-slate-900 font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}

                    {!isActive && (
                      <div className="absolute inset-0 bg-white/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    )}

                    <div className="flex items-center gap-3 relative z-10 min-w-0 flex-1">
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive
                            ? 'text-slate-900'
                            : 'text-gray-500 group-hover:text-yellow-400 transition-colors'
                        }`}
                      />
                      <span className="tracking-wide whitespace-nowrap truncate">
                        {item.label}
                      </span>
                    </div>

                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="relative z-10 shrink-0"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-900" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20">
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-slate-800/80 rounded-xl p-3 mb-3 flex items-center gap-3 border border-white/5"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white/10 shrink-0">
                  {currentUser?.name?.charAt(0) || 'A'}
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="font-bold text-sm truncate text-white">
                    {currentUser?.name || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{roleLabel}</div>
                </div>
              </motion.div>

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 group transition-all"
              >
                <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform shrink-0" />
                Keluar
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white hover:bg-white/5"
            >
              <AnimatePresence mode="wait">
                {sidebarOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/')}
              className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold py-2 px-4 rounded-full transition-all text-sm shadow-md flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-4 h-4 shrink-0" />
              Beranda
            </motion.button>

            <motion.button
              onClick={() => navigate('/services')}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-4 rounded-full transition-all text-sm shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Akses Semua Layanan
            </motion.button>

            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
              <input
                type="text"
                placeholder="Cari cepat..."
                className="bg-slate-800/50 border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500 w-48 transition-all focus:w-64"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 text-gray-400 hover:text-yellow-400 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900 animate-pulse" />
            </motion.button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, scale: 0.98, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-7xl mx-auto pb-20"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ChatBot />
    </div>
  );
};

export default DashboardLayout;
