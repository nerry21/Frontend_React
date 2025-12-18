// src/pages/BookingPage/BookingWisata.jsx

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

import BookingLayout from '@/components/BookingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BookingWisata = () => {
  const [step, setStep] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [tripDetails, setTripDetails] = useState({
    date: '',
    pax: 1,
  });

  const packages = [
    {
      id: 1,
      title: 'Islamic Center Tour',
      price: 250000,
      duration: '1 Day',
      image:
        'https://images.unsplash.com/photo-1596423146193-aa77fa9f32eb?q=80&w=2070',
    },
    {
      id: 2,
      title: 'Air Panas Hapanasan',
      price: 300000,
      duration: '1 Day',
      image:
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2088',
    },
    {
      id: 3,
      title: 'City Tour Pekanbaru',
      price: 450000,
      duration: '2 Days',
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073',
    },
  ];

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  const handleContinueFromStep1 = () => {
    if (!selectedPackageId) return;
    setStep(2);
  };

  const handleConfirmAndPay = () => {
    if (!selectedPackage) return;

    if (!tripDetails.date) {
      alert('Silakan pilih tanggal kunjungan terlebih dahulu.');
      return;
    }

    if (!tripDetails.pax || tripDetails.pax < 1) {
      alert('Jumlah pax minimal 1.');
      return;
    }

    setStep(3);
  };

  return (
    <BookingLayout
      title="Tour Packages"
      subtitle="Explore Riau's Best Destinations"
      step={step}
    >
      <Helmet>
        <title>Tour Booking - LK Travel</title>
      </Helmet>

      {/* STEP 1: PILIH PAKET */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <motion.div
              key={pkg.id}
              whileHover={{ y: -5 }}
              className={`rounded-xl overflow-hidden bg-slate-800 border transition-all cursor-pointer ${
                selectedPackageId === pkg.id
                  ? 'border-yellow-500 ring-2 ring-yellow-500/50'
                  : 'border-white/10 hover:border-yellow-500/30'
              }`}
              onClick={() => setSelectedPackageId(pkg.id)}
            >
              <div className="h-40 bg-slate-700 relative">
                <img
                  src={pkg.image}
                  alt={pkg.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white">
                  {pkg.duration}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">
                  {pkg.title}
                </h3>
                <p className="text-yellow-500 font-bold">
                  Rp {pkg.price.toLocaleString()}{' '}
                  <span className="text-gray-500 text-xs font-normal">
                    / pax
                  </span>
                </p>
              </div>
            </motion.div>
          ))}

          <div className="col-span-full mt-4">
            <Button
              disabled={!selectedPackageId}
              onClick={handleContinueFromStep1}
              className="w-full h-12 bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 disabled:opacity-50"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: DETAIL TRIP */}
      {step === 2 && selectedPackage && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-2">Trip Details</h3>

          {/* Ringkasan paket yang dipilih */}
          <div className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-700">
              <img
                src={selectedPackage.image}
                alt={selectedPackage.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Selected Package
              </p>
              <h4 className="text-lg font-bold text-white">
                {selectedPackage.title}
              </h4>
              <p className="text-sm text-gray-400">
                {selectedPackage.duration} • Rp{' '}
                {selectedPackage.price.toLocaleString()} / pax
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Date of Visit</Label>
              <Input
                type="date"
                className="bg-slate-800 border-gray-700 h-12 mt-1"
                value={tripDetails.date}
                onChange={(e) =>
                  setTripDetails((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Number of Pax</Label>
              <Input
                type="number"
                min="1"
                className="bg-slate-800 border-gray-700 h-12 mt-1"
                value={tripDetails.pax}
                onChange={(e) => {
                  const val = Number(e.target.value || 1);
                  setTripDetails((prev) => ({
                    ...prev,
                    pax: val < 1 ? 1 : val,
                  }));
                }}
              />
            </div>
          </div>

          {/* Total harga (opsional) */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm flex justify-between items-center">
            <span className="text-gray-300">Estimated Total</span>
            <span className="text-yellow-400 font-bold text-lg">
              Rp{' '}
              {(selectedPackage.price * (tripDetails.pax || 1)).toLocaleString()}
            </span>
          </div>

          <Button
            onClick={handleConfirmAndPay}
            className="w-full h-12 bg-green-500 text-white font-bold hover:bg-green-600 mt-4"
          >
            Confirm & Pay
          </Button>

          <Button
            variant="outline"
            onClick={() => setStep(1)}
            className="w-full h-11 border-slate-600 text-gray-300 mt-2"
          >
            Back to Packages
          </Button>
        </div>
      )}

      {/* STEP 3: SUCCESS */}
      {step === 3 && (
        <div className="text-center py-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Booking Successful!
          </h2>
          <p className="text-gray-400">
            Your tour voucher has been generated.
          </p>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            className="mt-8 bg-slate-800 text-white border border-white/10"
          >
            Back to Dashboard
          </Button>
        </div>
      )}
    </BookingLayout>
  );
};

export default BookingWisata;
