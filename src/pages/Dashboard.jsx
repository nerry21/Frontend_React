import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence, useInView, animate } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, DollarSign, Car, Users, 
  TrendingUp, ArrowUpRight, Clock, Bell, Filter, 
  MoreHorizontal, RefreshCw, ChevronDown, AlertCircle, CheckCircle2,
  Package, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';

// --- Utility Components ---

const StatCounter = ({ from = 0, to, duration = 1.5, prefix = '', suffix = '' }) => {
  const nodeRef = useRef();
  const inView = useInView(nodeRef, { once: true });

  useEffect(() => {
    const node = nodeRef.current;
    if (inView) {
      const controls = animate(from, to, {
        duration: duration,
        onUpdate(value) {
          if (node) node.textContent = `${prefix}${Math.floor(value).toLocaleString()}${suffix}`;
        },
        ease: "easeOut"
      });
      return () => controls.stop();
    }
  }, [from, to, duration, inView, prefix, suffix]);

  return <span ref={nodeRef}>{prefix}{from}{suffix}</span>;
};

const Skeleton = ({ className }) => (
  <div className={`bg-slate-800/50 rounded-lg overflow-hidden relative ${className}`}>
    <motion.div 
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

// --- Main Dashboard Component ---

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('This Week');
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
        setIsLoading(false);
        // Load bookings from LocalStorage and merge with mock data
        const storedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        
        // Mock data
        const mockBookings = [
             { id: "PK-2023-005", user: "Box (Oleh-oleh)", route: "Pasir - Pekanbaru", status: "In Transit", amount: "Rp 75,000", color: "bg-purple-500/20 text-purple-400", isPackage: true },
             { id: "BK-2023-001", user: "Ahmad Subandi", route: "Rokan Hulu - Pekanbaru", status: "Confirmed", amount: "Rp 85,000", color: "bg-green-500/20 text-green-400" },
             { id: "BK-2023-002", user: "Siti Nurhaliza", route: "Pekanbaru - Rokan Hulu", status: "Pending", amount: "Rp 85,000", color: "bg-yellow-500/20 text-yellow-400" },
             { id: "BK-2023-003", user: "Budi Santoso", route: "Pasir - Ujung Batu", status: "Cancelled", amount: "Rp 45,000", color: "bg-red-500/20 text-red-400" },
        ];

        // Combine and reverse to show newest first
        const combined = [...storedBookings.reverse(), ...mockBookings].slice(0, 10);
        setRecentBookings(combined);

    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { 
      label: 'Total Revenue', 
      value: 125000000, 
      prefix: 'Rp ', 
      suffix: '', 
      icon: DollarSign, 
      trend: '+12.5%', 
      color: 'text-green-400', 
      bg: 'bg-green-500/10',
      borderColor: 'border-green-500/20' 
    },
    { 
      label: 'Total Bookings', 
      value: 1247, 
      prefix: '', 
      suffix: '', 
      icon: Calendar, 
      trend: '+8.2%', 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20' 
    },
    { 
      label: 'Active Fleet', 
      value: 24, 
      prefix: '', 
      suffix: '', 
      icon: Car, 
      trend: '+2', 
      color: 'text-red-400', 
      bg: 'bg-red-500/10',
      borderColor: 'border-red-500/20' 
    },
    { 
      label: 'Happy Passengers', 
      value: 3456, 
      prefix: '', 
      suffix: '', 
      icon: Users, 
      trend: '+15.3%', 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20' 
    },
  ];

  const revenueData = [45, 70, 55, 85, 60, 90, 75];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", bounce: 0.4 } 
    }
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Dashboard - LK Travel App</title>
      </Helmet>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            y: [0, -50, 0],
            rotate: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            y: [0, 50, 0],
            rotate: [0, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -left-40 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px]" 
        />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Dashboard Overview</h1>
            <p className="text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Operational • Updated just now
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsLoading(true)} className="border-slate-700 hover:bg-slate-800 text-gray-300">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-bold border-none">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-80 lg:col-span-2" />
                <Skeleton className="h-80" />
              </div>
              <Skeleton className="h-64" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`p-6 rounded-2xl bg-slate-900/50 border ${stat.borderColor} backdrop-blur-xl shadow-lg relative overflow-hidden group cursor-pointer`}
                    >
                      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.bg} ${stat.color}`}>
                          <TrendingUp className="w-3 h-3" />
                          {stat.trend}
                        </div>
                      </div>
                      
                      <div className="relative z-10">
                        <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                        <div className="text-2xl font-bold text-white tracking-tight">
                          <StatCounter to={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Bar Chart */}
                <motion.div 
                  variants={itemVariants}
                  className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-xl shadow-lg flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-white">Revenue Analytics</h3>
                      <p className="text-sm text-gray-400">Compare with last week</p>
                    </div>
                    <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg">
                      {['Day', 'Week', 'Month'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setTimeRange(t)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${timeRange === t ? 'bg-yellow-500 text-slate-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex items-end justify-between gap-4 min-h-[200px]">
                    {revenueData.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="relative w-full flex items-end h-full rounded-t-lg bg-slate-800/30 overflow-hidden">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 1, delay: i * 0.1, type: "spring", bounce: 0.2 }}
                            className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 relative group-hover:from-yellow-500 group-hover:to-yellow-300 transition-colors"
                          >
                            <div className="absolute top-0 w-full h-[1px] bg-white/50" />
                          </motion.div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Notifications / Alerts */}
                <motion.div 
                  variants={itemVariants}
                  className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-xl shadow-lg"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Notifications</h3>
                    <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-red-500/20">4</span>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { title: "New PPOB: Pulsa 50k", time: "Just now", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" }, // Added PPOB notification
                      { title: "New Package: Box to PKU", time: "Just now", icon: Package, color: "text-purple-400", bg: "bg-purple-500/10" },
                      { title: "New Booking #BK092", time: "2m ago", icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10" },
                      { title: "Payment Verified", time: "15m ago", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
                      { title: "Driver Arrived", time: "1h ago", icon: Car, color: "text-yellow-400", bg: "bg-yellow-500/10" },
                    ].map((item, i) => (
                      <motion.div 
                        key={i}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.03)" }}
                        className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/5"
                      >
                        <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center ${item.color} shadow-sm`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.time}</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      </motion.div>
                    ))}
                  </div>
                  
                  <Button variant="ghost" className="w-full mt-4 text-sm text-gray-400 hover:text-white hover:bg-white/5">
                    View All Notifications
                  </Button>
                </motion.div>
              </div>

              {/* Recent Bookings Table */}
              <motion.div 
                variants={itemVariants}
                className="rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-xl shadow-lg overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Recent Bookings</h3>
                    <p className="text-sm text-gray-400">Latest transaction history</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50 text-xs uppercase text-gray-400 font-medium">
                      <tr>
                        <th className="px-6 py-4 text-left tracking-wider">Booking ID</th>
                        <th className="px-6 py-4 text-left tracking-wider">Passenger/Item</th>
                        <th className="px-6 py-4 text-left tracking-wider">Route/Service</th>
                        <th className="px-6 py-4 text-left tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentBookings.map((row, i) => (
                        <motion.tr 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + (i * 0.1) }}
                          className="hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-6 py-4 text-sm text-yellow-500 font-mono group-hover:text-yellow-400">{row.id}</td>
                          <td className="px-6 py-4 text-sm text-white font-medium">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${row.isPackage ? 'bg-purple-500/20' : (row.category?.includes('PPOB') ? 'bg-blue-500/20' : 'bg-slate-700')} flex items-center justify-center text-xs font-bold text-white`}>
                                {row.isPackage ? <Package className="w-4 h-4 text-purple-400" /> : (row.category?.includes('PPOB') ? <FileText className="w-4 h-4 text-blue-400" /> : row.user?.charAt(0))}
                              </div>
                              {row.user}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{row.route}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.color || 'bg-blue-500/20 text-blue-400'} border border-white/5`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-white font-bold">{row.amount}</td>
                          <td className="px-6 py-4">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;