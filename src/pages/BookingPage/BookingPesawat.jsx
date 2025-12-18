// src/pages/BookingPage/BookingPesawat.jsx

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

import BookingLayout from '@/components/BookingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BookingPesawat = () => {
  const [step, setStep] = useState(1);

  return (
    <BookingLayout
      title="Flight Ticket"
      subtitle="Domestic & International Flights"
      step={step}
    >
      <Helmet>
        <title>Flight Booking - LK Travel</title>
      </Helmet>

      {/* STEP 1: FORM PENCARIAN PENERBANGAN */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-300 mb-1 block">From</Label>
              <Input
                placeholder="City or Airport (e.g., PKU)"
                className="bg-slate-800 border-gray-700 h-12 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300 mb-1 block">To</Label>
              <Input
                placeholder="City or Airport (e.g., CGK)"
                className="bg-slate-800 border-gray-700 h-12 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300 mb-1 block">Departure Date</Label>
              <Input
                type="date"
                className="bg-slate-800 border-gray-700 h-12 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300 mb-1 block">Passengers</Label>
              <Input
                type="number"
                min="1"
                defaultValue="1"
                className="bg-slate-800 border-gray-700 h-12 text-white"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setStep(2)}
            className="w-full h-12 bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 mt-6"
          >
            Search Flights
          </Button>
        </div>
      )}

      {/* STEP 2: LIST PENERBANGAN */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-white font-bold mb-4">Available Flights</h3>

          {[1, 2, 3].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(3)}
              className="w-full bg-slate-800 p-4 rounded-xl border border-white/5 hover:border-yellow-500/50 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white">
                  LION
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-white">Lion Air</h4>
                  <p className="text-xs text-gray-400">10:00 - 11:45</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-yellow-500 font-bold text-lg">
                  Rp 850.000
                </p>
                <p className="text-xs text-gray-500">Direct</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 3: KONFIRMASI / E-TICKET */}
      {step === 3 && (
        <div className="text-center py-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Plane className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-3xl font-bold text-white mb-2">
            E-Ticket Issued!
          </h2>
          <p className="text-gray-400 mb-8">
            Your flight ticket has been sent to your email.
          </p>

          <Button
            type="button"
            onClick={() => {
              window.location.href = '/dashboard';
            }}
            className="bg-slate-800 text-white border border-white/10 hover:bg-slate-700"
          >
            Back to Dashboard
          </Button>
        </div>
      )}
    </BookingLayout>
  );
};

export default BookingPesawat;
