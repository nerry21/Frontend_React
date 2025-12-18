
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Hotel, Plane, Map, Car, ArrowRight, Zap, PlaneLanding, Key } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const ServiceCard = ({ icon: Icon, title, description, link, color, delay }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      whileHover={{ y: -10, scale: 1.02 }}
      onClick={() => navigate(link)}
      className="relative group cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative h-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center overflow-hidden hover:border-yellow-500/50 transition-colors">
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-10 -mt-10" />
        
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg shadow-black/50 group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">{title}</h3>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">{description}</p>
        
        <div className="mt-auto flex items-center gap-2 text-yellow-500 font-bold text-sm uppercase tracking-widest group-hover:gap-4 transition-all">
          Select Service <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};

const ServiceSelection = () => {
  const services = [
    {
      icon: Car,
      title: 'Keberangkatan',
      description: 'Premium transport services: Regular, Droping, Rental, and Cargo options.',
      link: '/booking/keberangkatan',
      color: 'from-red-500 to-red-700'
    },
    {
      icon: Smartphone,
      title: 'Pulsa & Bills',
      description: 'Top up credit, data packages, and pay electricity tokens instantly.',
      link: '/booking/pulsa',
      color: 'from-blue-500 to-blue-700'
    },
    {
      icon: Hotel,
      title: 'Hotel Booking',
      description: 'Comfortable stays at the best prices in Pekanbaru and Rokan Hulu.',
      link: '/booking/hotel',
      color: 'from-yellow-500 to-yellow-700'
    },
    {
      icon: PlaneLanding,
      title: 'Airport Transfer',
      description: 'Hassle-free airport shuttle service to/from Pekanbaru & Rokan Hulu.',
      link: '/booking/airport',
      color: 'from-cyan-500 to-cyan-700'
    },
    {
      icon: Key,
      title: 'Rental Lepas Kunci',
      description: 'Self-drive car rental with flexible duration and delivery options.',
      link: '/booking/rental',
      color: 'from-orange-500 to-orange-700'
    },
    {
      icon: Plane,
      title: 'Tiket Pesawat',
      description: 'Book domestic and international flights with competitive rates.',
      link: '/booking/pesawat',
      color: 'from-green-500 to-green-700'
    },
    {
      icon: Map,
      title: 'Paket Wisata',
      description: 'Explore the hidden gems and spiritual centers of Riau with us.',
      link: '/booking/wisata',
      color: 'from-purple-500 to-purple-700'
    }
  ];

  return (
    <DashboardLayout>
      <Helmet>
        <title>Select Service - LK Travel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-yellow-500 font-bold uppercase tracking-[0.2em] text-sm"
          >
            Choose Your Journey
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white"
          >
            Our Premium Services
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Experience travel excellence with our comprehensive range of services designed for your comfort and convenience.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} delay={index} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ServiceSelection;
