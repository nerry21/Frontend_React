import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';

const BookingLayout = ({ title, subtitle, step, children }) => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">{title}</h1>
            <p className="text-gray-400">{subtitle}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: s * 0.1 }}
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= s ? 'bg-yellow-500 border-yellow-500 text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-gray-600 text-gray-600'
                } font-bold transition-all relative z-10`}
              >
                {s}
              </motion.div>
              {s < 3 && (
                <div className="w-16 h-1 bg-slate-800 relative overflow-hidden rounded-full">
                   <motion.div 
                     className="h-full bg-yellow-500"
                     initial={{ width: "0%" }}
                     animate={{ width: step > s ? "100%" : "0%" }}
                     transition={{ duration: 0.5 }}
                   />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          {children}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default BookingLayout;