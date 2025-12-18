import React from 'react';
import { motion } from 'framer-motion';

const MalayPattern = () => {
  // Generate random floating particles
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Rotating Mandala Ornaments */}
      <motion.div 
        className="absolute -top-[10%] -right-[10%] w-[800px] h-[800px] opacity-[0.03]"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-yellow-500">
           <path d="M50 0 L55 40 L95 50 L55 60 L50 100 L45 60 L5 50 L45 40 Z" />
           <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
           <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
        </svg>
      </motion.div>

      <motion.div 
        className="absolute -bottom-[10%] -left-[10%] w-[600px] h-[600px] opacity-[0.03]"
        animate={{ rotate: -360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-red-500">
           <path d="M50 10 Q70 10 70 30 T90 50 T70 70 T50 90 T30 70 T10 50 T30 30 T50 10" fill="none" stroke="currentColor" strokeWidth="1" />
           <rect x="35" y="35" width="30" height="30" transform="rotate(45 50 50)" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </motion.div>

      {/* Ambient Gradient Orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-[100px]"
      />
      
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-red-600/20 to-transparent rounded-full blur-[100px]"
      />

      {/* Floating Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-yellow-400/40 blur-[1px]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}

      {/* Decorative Ribbon Curves */}
      <svg className="absolute top-0 left-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FBC91A" stopOpacity="0" />
            <stop offset="50%" stopColor="#FBC91A" stopOpacity="1" />
            <stop offset="100%" stopColor="#FBC91A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M -100 200 C 400 0 800 600 2000 100"
          stroke="url(#goldGradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        <motion.path
          d="M -100 600 C 500 300 900 900 2200 400"
          stroke="#1EAD51"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.2 }}
          transition={{ duration: 6, delay: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
};

export default MalayPattern;