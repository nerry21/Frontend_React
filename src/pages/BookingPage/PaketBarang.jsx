import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Car, Package, Zap, Hotel, MapPin, 
  MessageCircle, Star, Mail, ArrowRight, Phone, Smartphone, Plane, CreditCard,
  Users, Clock, ShieldCheck, Info, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MalayPattern from '@/components/MalayPattern';
import ChatBot from '@/components/ChatBot';
import { useAuth } from '@/contexts/AuthContext';

// === VIDEO BACKGROUND IMPORT ===
import heroVideo from '@/assets/videos/GO_LKT.mp4';
// IMPORT GAMBAR LOKAL (relative dari LandingPage.jsx)
import islamicCenterImg from '@/assets/images/islamic_center.jpg';
import pekanbaruImg from '@/assets/images/pekanbaru.jpg';
import aekMatuaImg from '@/assets/images/Air_Terjun_Aek_Matua.jpg';

const ServiceCard = ({
  icon: Icon,
  title,
  subtitle,
  price,
  features,
  index,
  onBook,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, type: 'spring' }}
      className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col relative group overflow-hidden hover:border-yellow-500/50 transition-colors h-full"
    >
      {/* Glow Effect */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-2xl group-hover:opacity-100 transition-opacity" />
      
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500 relative z-10">
        <Icon className="w-8 h-8 text-yellow-500" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-4 font-medium uppercase tracking-wide">{subtitle}</p>
      
      <div className="text-3xl font-black text-white mb-6 tracking-tight">
        {price}
        <span className="text-xs text-gray-500 font-normal block mt-1">starting price</span>
      </div>
      
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>
      
      <Button
        className="w-full bg-white/5 hover:bg-yellow-500 hover:text-slate-900 text-white border border-white/10 transition-all font-bold"
        type="button"
        onClick={onBook}
      >
        Book Now
      </Button>
    </motion.div>
  );
};

const DestinationCard = ({ image, title, location }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="group relative overflow-hidden rounded-3xl aspect-[4/5] cursor-pointer border border-white/10"
  >
    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/0 transition-colors z-10" />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-20" />
    <img 
      src={image} 
      alt={title} 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
    />
    <div className="absolute bottom-0 left-0 p-6 z-30">
      <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2 block">{location}</span>
      <h3 className="text-2xl font-bold text-white">{title}</h3>
    </div>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const { currentUser, logout, hasRole } = useAuth();

  const heroY = useTransform(scrollY, [0, 1000], [0, 400]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  const isLoggedIn = !!currentUser;
  const userName = currentUser?.name || currentUser?.email || 'User';

  // Role yang boleh akses dashboard dari landing
  const canAccessDashboard =
    typeof hasRole === 'function'
      ? hasRole(['owner', 'admin', 'mitra', 'driver'])
      : false;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn(`Element with id '${id}' not found`);
    }
  };

  // Book Now → ke halaman komponen yang kamu sebut
  const transportServices = [
    {
      icon: Users,
      title: 'Regular Travel',
      subtitle: 'Pasirpengaraian ↔ Pekanbaru',
      price: 'Rp 150k',
      features: [
        'Schedule: 06, 08, 10, 14, 16, 19 WIB',
        'Comfortable 1-2-2 Seating',
        'Max 5 Passengers per trip',
        'Professional Driver',
      ],
      onBook: () => navigate('/reguler'),        // Reguler.jsx
    },
    {
      icon: MapPin,
      title: 'Droping Service',
      subtitle: 'Private Door-to-Door',
      price: 'Rp 900k',
      features: [
        'Private Charter Service',
        'Direct Door-to-Door',
        'Max 6 Passengers',
        'Flexible Departure Time',
      ],
      onBook: () => navigate('/dropping'),       // Dropping.jsx
    },
    {
      icon: Car,
      title: 'Rental Service',
      subtitle: 'Vehicle + Driver',
      price: 'Rp 800k',
      features: [
        'Premium Fleet Options',
        'Minimum 2 Days Rental',
        'Excludes Fuel & Meals',
        'Experienced Driver Included',
      ],
      onBook: () => navigate('/rental'),         // Rental.jsx
    },
    {
      icon: Package,
      title: 'Paket Barang',
      subtitle: 'Express Delivery',
      price: 'Rp 60k',
      features: [
        'Express under 6 Hours',
        'Document & Parcel Secure',
        'Real-time Status Updates',
        'Custom Size Handling',
      ],
      onBook: () => navigate('/paket-barang'),   // step 2 PaketBarang.jsx
    },
  ];

  const handleWhatsApp = (number, message) => {
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden selection:bg-yellow-500 selection:text-slate-900">
      <Helmet>
        <title>LK Travel - Lancang Kuning Travelindo</title>
      </Helmet>

      {/* --- Navbar with Logo --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 h-20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="https://horizons-cdn.hostinger.com/aa3a21e0-4488-4247-a025-83814179d1a2/a1bd20993dcda11397fa2a373d3bdd8a.jpg" 
              alt="Lancang Kuning Logo" 
              className="w-12 h-12 rounded-full border-2 border-yellow-500 object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Lancang Kuning</h1>
              <span className="text-xs text-yellow-500 font-medium tracking-widest">TRAVELINDO</span>
            </div>
          </div>

          {/* Kanan navbar: menu + login/logout/dashboard */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate('/services')}
              className="text-sm font-bold text-gray-300 hover:text-yellow-500 transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('destinations')}
              className="text-sm font-bold text-gray-300 hover:text-yellow-500 transition-colors"
            >
              Destinations
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-sm font-bold text-gray-300 hover:text-yellow-500 transition-colors"
            >
              Contact
            </button>

            {!isLoggedIn ? (
              <Button
                onClick={() => navigate('/login')}
                className="bg-yellow-500 text-slate-900 hover:bg-yellow-400 font-bold rounded-full px-6 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all"
              >
                Member Login
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400 leading-tight">Logged in as</p>
                  <p className="text-sm font-bold text-yellow-400 leading-tight">
                    {userName}
                  </p>
                </div>

                {canAccessDashboard && (
                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="bg-white/10 border border-white/20 text-sm font-bold rounded-full px-5 hover:bg-white/20"
                  >
                    Dashboard
                  </Button>
                )}

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500/60 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold rounded-full px-5 text-sm"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- Hero Section with VIDEO background --- */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/40 z-10" />
        </motion.div>

        <div className="container mx-auto px-4 relative z-30 text-center mt-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 border border-white/10 mb-8 backdrop-blur-md shadow-lg">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-sm font-bold tracking-wide text-white uppercase">
                Official App of LK Travelindo
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tighter leading-tight drop-shadow-2xl">
              ENJOY THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300">
                JOURNEY
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 font-medium shadow-black drop-shadow-md">
              Mitra terpercaya Anda untuk perjalanan premium antara Rokan Hulu dan Pekanbaru. Rasakan kenyamanan, keamanan, dan ketepatan waktu.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Button 
                onClick={() => navigate('/services')}
                className="h-14 px-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 text-lg font-bold shadow-[0_0_40px_rgba(234,179,8,0.4)] hover:shadow-[0_0_60px_rgba(234,179,8,0.6)] transition-all hover:scale-105"
              >
                Book Your Trip
              </Button>
              <Button 
                onClick={() => navigate('/booking/keberangkatan')}
                className="h-14 px-8 rounded-full bg-white/10 border border-white/20 text-white text-lg font-bold backdrop-blur-md hover:bg-white/20 transition-all"
              >
                View Schedule
              </Button>
            </div>
            
            <div className="flex justify-center gap-4 opacity-80 hover:opacity-100 transition-opacity">
              <button className="h-12 bg-black/50 border border-white/20 hover:bg-black/70 px-4 rounded-xl flex items-center gap-2 backdrop-blur-sm transition-all">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-6" alt="Google Play" />
              </button>
              <button className="h-12 bg-black/50 border border-white/20 hover:bg-black/70 px-4 rounded-xl flex items-center gap-2 backdrop-blur-sm transition-all">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" className="h-6" alt="App Store" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Premium Services Section --- */}
      <section className="py-24 relative z-10 bg-slate-950 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <span className="text-yellow-500 font-bold uppercase tracking-[0.2em] text-sm mb-2 block">
              Our Core Services
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Premium Transport
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Choose the perfect travel option tailored to your specific needs. From regular shuttles to private charters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {transportServices.map((service, index) => (
              <ServiceCard key={index} {...service} index={index} />
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-slate-900 shrink-0 animate-pulse">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Layanan Lainnya</h3>
                <p className="text-gray-400">
                  Enjoy free mineral water on every trip. Free lunch & dinner service coming soon!
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/services')}
              className="whitespace-nowrap bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 px-8 h-12 rounded-xl"
            >
              Explore All Services
            </Button>
          </motion.div>
        </div>
      </section>

      {/* --- Destinations Section --- */}
      <section id="destinations" className="py-24 bg-slate-900 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-yellow-500 font-bold uppercase tracking-[0.2em] text-sm mb-2 block">
              Explore Riau
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Popular Destinations
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Temukan keindahan Rokan Hulu dan Pekanbaru dengan armada perjalanan kami yang nyaman.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <DestinationCard 
              image={islamicCenterImg}
              title="Islamic Centre"
              location="Rokan Hulu"
            />
            <DestinationCard 
              image={pekanbaruImg}
              title="Pekanbaru City"
              location="Pekanbaru"
            />
            <DestinationCard 
              image={aekMatuaImg}
              title="Aek Matua"
              location="Rokan Hulu"
            />
          </div>
        </div>
      </section>

      {/* --- Contact & Address Section --- */}
      <section id="contact" className="py-24 bg-slate-900/50 border-t border-white/5 relative">
        <MalayPattern />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h3 className="text-3xl font-black text-white mb-8">Visit Our Offices</h3>
              <div className="space-y-8">
                <div className="flex gap-6 group">
                  <div className="w-16 h-16 bg-slate-800 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 text-yellow-500 group-hover:scale-110 transition-transform shadow-lg">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xl mb-2">
                      Kantor Pasir Pengaraian
                    </h4>
                    <p className="text-gray-400 leading-relaxed">
                      Jalan Lingkar Km 4 Kampung Baru, Desa Koto Tinggi, Pasirpengaraian,
                      Kec. Rambah, Kab. Rokan Hulu
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="w-16 h-16 bg-slate-800 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 text-yellow-500 group-hover:scale-110 transition-transform shadow-lg">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xl mb-2">
                      Kantor Pekanbaru
                    </h4>
                    <p className="text-gray-400 leading-relaxed">
                      Jalan Pahlawan Kerja Perhentian Marpoyan, Kec. Marpoyan Damai, Kota
                      Pekanbaru
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-black text-white mb-8">Get in Touch</h3>
              <div className="space-y-4">
                <Button 
                  onClick={() => handleWhatsApp('6282313205885', 'Halo Admin Rokan Hulu, saya ingin bertanya seputar layanan travel.')}
                  className="w-full h-20 bg-[#25D366] hover:bg-[#20BA5C] text-white text-xl font-bold rounded-2xl flex items-center justify-between px-8 group transition-all hover:shadow-[0_0_30px_rgba(37,211,102,0.3)]"
                >
                  <span className="flex items-center gap-4">
                    <MessageCircle className="w-8 h-8" /> 
                    <span className="text-left">
                      <span className="block text-sm opacity-80 font-normal">Chat via WhatsApp</span>
                      Admin Rokan Hulu
                    </span>
                  </span>
                  <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform" />
                </Button>
                
                <Button 
                  onClick={() => handleWhatsApp('6282364210642', 'Halo Admin Pekanbaru, saya ingin memesan tiket.')}
                  className="w-full h-20 bg-[#25D366] hover:bg-[#20BA5C] text-white text-xl font-bold rounded-2xl flex items-center justify-between px-8 group transition-all hover:shadow-[0_0_30px_rgba(37,211,102,0.3)]"
                >
                  <span className="flex items-center gap-4">
                    <MessageCircle className="w-8 h-8" /> 
                    <span className="text-left">
                      <span className="block text-sm opacity-80 font-normal">Chat via WhatsApp</span>
                      Admin Pekanbaru
                    </span>
                  </span>
                  <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform" />
                </Button>
                
                <div className="pt-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-gray-500 text-sm uppercase tracking-widest font-bold">
                    Social Media
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <a 
                  href="https://instagram.com/Lancangkuningtravelindo" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-3 text-gray-400 hover:text-yellow-500 transition-colors py-4"
                >
                  <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </span>
                  <span className="font-bold text-lg">@Lancangkuningtravelindo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 py-12 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-900 mx-auto mb-6 shadow-lg shadow-yellow-500/20">
            LK
          </div>
          <p className="text-gray-500 mb-6">
            Trusted Journey Partner Since 2055
          </p>
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} PT Lancang Kuning Travelindo. All rights reserved.
          </p>
        </div>
      </footer>
      
      <ChatBot />
    </div>
  );
};

export default LandingPage;
