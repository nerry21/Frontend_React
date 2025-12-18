// src/pages/BookingPage/BookingPulsa.jsx

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Zap,
  Wifi,
  Tv,
  Heart,
  Wallet,
  FileText,
  Loader2,
  CreditCard,
} from 'lucide-react';

import BookingLayout from '@/components/BookingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import InvoiceModal from '@/components/InvoiceModal';

const BookingPulsa = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const [formData, setFormData] = useState({
    customerNumber: '', // Phone, ID Pel, VA, etc.
    provider: '',
    nominal: '',
    selectedPackage: null, // For Data
    paymentMethod: '',
  });

  const [billDetails, setBillDetails] = useState(null); // For Postpaid checks

  // --- CONFIGURATION ---

  const services = [
    {
      id: 'pulsa',
      label: 'Pulsa',
      icon: Smartphone,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      id: 'pascabayar',
      label: 'Pascabayar',
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      id: 'data',
      label: 'Paket Data',
      icon: Wifi,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      id: 'pln_token',
      label: 'Listrik Prabayar',
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
    },
    {
      id: 'pln_tagihan',
      label: 'Listrik Pascabayar',
      icon: Zap,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      id: 'internet',
      label: 'Internet & TV',
      icon: Tv,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      id: 'bpjs',
      label: 'BPJS',
      icon: Heart,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      id: 'ewallet',
      label: 'E-Wallet',
      icon: Wallet,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
  ];

  const nominals = [
    10000, 15000, 20000, 25000, 30000, 50000, 75000, 100000, 150000, 200000,
    300000,
  ];

  const plnTokens = [20000, 50000, 100000, 200000, 500000, 1000000];

  const providers = {
    pulsa: ['Telkomsel', 'Indosat', 'XL', 'Tri', 'Smartfren'],
    internet: ['Indihome', 'First Media', 'Biznet', 'MNC Vision'],
    ewallet: ['GoPay', 'OVO', 'Dana', 'ShopeePay', 'LinkAja'],
    bpjs: ['BPJS Kesehatan', 'BPJS Ketenagakerjaan'],
  };

  const dataPackages = [
    { name: 'Freedom Internet 3GB', price: 15000, desc: '3GB / 30 Days' },
    { name: 'Freedom Internet 10GB', price: 50000, desc: '10GB / 30 Days' },
    {
      name: 'Combo Sakti 15GB',
      price: 75000,
      desc: '15GB + Call / 30 Days',
    },
    {
      name: 'Unlimited Youtube',
      price: 100000,
      desc: 'Unlimited Apps + 20GB',
    },
  ];

  // --- HANDLERS ---

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setFormData({
      customerNumber: '',
      provider: '',
      nominal: '',
      selectedPackage: null,
      paymentMethod: '',
    });
    setBillDetails(null);
    setStep(2);
  };

  const simulateCheckBill = () => {
    if (!formData.customerNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a valid number',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Mock Bill
      const mockAmount =
        Math.floor(Math.random() * (500000 - 50000)) + 50000;
      setBillDetails({
        name: 'CUSTOMER NAME',
        period: 'Current Month',
        amount: mockAmount,
        adminFee: 2500,
      });
    }, 1500);
  };

  const handleNextToReview = () => {
    if (!selectedService) return;

    // Validation basic
    if (!formData.customerNumber) {
      toast({
        title: 'Error',
        description: 'Customer number is required',
        variant: 'destructive',
      });
      return;
    }

    // Prepaid
    if (
      selectedService.id === 'pulsa' ||
      selectedService.id === 'ewallet' ||
      selectedService.id === 'pln_token'
    ) {
      if (!formData.nominal) {
        toast({
          title: 'Error',
          description: 'Please select an amount',
          variant: 'destructive',
        });
        return;
      }
    }

    // Paket data
    if (selectedService.id === 'data' && !formData.selectedPackage) {
      toast({
        title: 'Error',
        description: 'Please select a package',
        variant: 'destructive',
      });
      return;
    }

    // Tagihan / postpaid
    if (
      (selectedService.id === 'pascabayar' ||
        selectedService.id === 'pln_tagihan' ||
        selectedService.id === 'internet' ||
        selectedService.id === 'bpjs') &&
      !billDetails
    ) {
      toast({
        title: 'Error',
        description: 'Please check bill first',
        variant: 'destructive',
      });
      return;
    }

    setStep(3);
  };

  const getTotalAmount = () => {
    if (billDetails) return billDetails.amount + billDetails.adminFee;
    if (formData.selectedPackage) return formData.selectedPackage.price;
    return (parseInt(formData.nominal || 0, 10) || 0) + 1500; // +1500 admin fee for prepaid
  };

  const handlePayment = (method) => {
    if (!selectedService) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      const total = getTotalAmount();
      const itemName = formData.selectedPackage
        ? formData.selectedPackage.name
        : billDetails
        ? 'Bill Payment'
        : formData.nominal
        ? `Top Up ${parseInt(formData.nominal, 10).toLocaleString()}`
        : 'Top Up';

      const newBooking = {
        id: `TRX${Date.now()}`,
        category: `PPOB - ${selectedService.label}`,
        serviceType: selectedService.label,
        provider: formData.provider || selectedService.label,
        customerNumber: formData.customerNumber,
        itemName,
        totalAmount: total,
        adminFee: billDetails ? billDetails.adminFee : 1500,
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString(),
        status: 'Success',
        sn:
          selectedService.id === 'pln_token'
            ? '1234-5678-9012-3456'
            : null, // Mock Token SN
        paymentMethod: method,
      };

      setBookingResult(newBooking);

      // Simpan ke localStorage -> dipakai di Dashboard
      const bookings = JSON.parse(
        localStorage.getItem('bookings') || '[]'
      );
      bookings.push({
        ...newBooking,
        // Mapping untuk tabel dashboard
        user: newBooking.itemName,
        route: newBooking.serviceType,
        status: 'Confirmed',
        amount: `Rp ${total.toLocaleString()}`,
        isPackage: false,
        color: 'bg-blue-500/20 text-blue-400',
      });
      localStorage.setItem('bookings', JSON.stringify(bookings));

      setShowInvoice(true);
    }, 2000);
  };

  return (
    <BookingLayout
      title={
        step === 1
          ? 'Top Up & Tagihan'
          : selectedService?.label || 'Transaction'
      }
      subtitle={
        step === 1
          ? 'Pay bills, buy credits, and more'
          : 'Complete your transaction securely'
      }
      // secara visual maksimal 3 step
      step={step > 3 ? 3 : step}
    >
      <Helmet>
        <title>PPOB Service - LK Travel</title>
      </Helmet>

      <AnimatePresence mode="wait">
        {/* STEP 1: PILIH JENIS LAYANAN */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {services.map((srv) => {
              const Icon = srv.icon;
              return (
                <motion.button
                  key={srv.id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleServiceSelect(srv)}
                  className={`p-6 rounded-2xl border ${srv.border} ${srv.bg} backdrop-blur-sm flex flex-col items-center justify-center gap-4 hover:bg-slate-800 transition-colors group`}
                >
                  <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Icon className={`w-7 h-7 ${srv.color}`} />
                  </div>
                  <span className="font-bold text-gray-200 group-hover:text-white">
                    {srv.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* STEP 2: FORM INPUT */}
        {step === 2 && selectedService && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            {/* Provider / Tipe */}
            {(providers[selectedService.id] ||
              selectedService.id === 'internet') && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                {(providers[selectedService.id] || providers.internet).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          provider: p,
                        }))
                      }
                      className={`p-2 rounded-lg border cursor-pointer text-center text-xs font-bold transition-all ${
                        formData.provider === p
                          ? 'border-yellow-500 bg-yellow-500/10 text-white'
                          : 'border-gray-700 text-gray-500 hover:border-gray-500'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Nomor / ID */}
            <div>
              <Label className="text-gray-300 mb-2 block">
                {selectedService.id.includes('pln')
                  ? 'ID Pelanggan / No Meter'
                  : selectedService.id === 'bpjs'
                  ? 'Nomor VA Keluarga'
                  : selectedService.id === 'internet'
                  ? 'Customer ID'
                  : 'Phone Number'}
              </Label>
              <Input
                value={formData.customerNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerNumber: e.target.value,
                  }))
                }
                className="bg-slate-900 border-gray-600 h-12 text-lg font-mono"
                placeholder="e.g. 08123456789 or 1234567890"
              />
            </div>

            {/* PULSA & EWALLET: PILIH NOMINAL */}
            {(selectedService.id === 'pulsa' ||
              selectedService.id === 'ewallet') && (
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Select Nominal
                </Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {nominals.map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          nominal: nom,
                        }))
                      }
                      className={`py-3 rounded-xl border font-bold transition-all ${
                        formData.nominal === nom
                          ? 'bg-yellow-500 border-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/20'
                          : 'border-gray-700 text-gray-400 bg-slate-800 hover:border-gray-500'
                      }`}
                    >
                      {nom / 1000}k
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PLN TOKEN */}
            {selectedService.id === 'pln_token' && (
              <div>
                <Label className="text-gray-300 mb-2 block">
                  Token Nominal
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {plnTokens.map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          nominal: nom,
                        }))
                      }
                      className={`py-3 rounded-xl border font-bold transition-all ${
                        formData.nominal === nom
                          ? 'bg-yellow-500 border-yellow-500 text-slate-900'
                          : 'border-gray-700 text-gray-400 bg-slate-800 hover:border-gray-500'
                      }`}
                    >
                      Rp {nom.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PAKET DATA */}
            {selectedService.id === 'data' && (
              <div className="space-y-3">
                <Label className="text-gray-300">
                  Available Packages
                </Label>
                {dataPackages.map((pkg) => (
                  <button
                    key={pkg.name}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        selectedPackage: pkg,
                      }))
                    }
                    className={`w-full p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                      formData.selectedPackage?.name === pkg.name
                        ? 'bg-green-500/10 border-green-500'
                        : 'bg-slate-800 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-left">
                      <h4
                        className={`font-bold ${
                          formData.selectedPackage?.name === pkg.name
                            ? 'text-green-400'
                            : 'text-white'
                        }`}
                      >
                        {pkg.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {pkg.desc}
                      </p>
                    </div>
                    <span className="font-bold text-white">
                      Rp {pkg.price.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* CEK TAGIHAN (POSTPAID) */}
            {(selectedService.id === 'pascabayar' ||
              selectedService.id === 'pln_tagihan' ||
              selectedService.id === 'internet' ||
              selectedService.id === 'bpjs') && (
              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={simulateCheckBill}
                  disabled={loading || !!billDetails}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : billDetails ? (
                    'Bill Retrieved'
                  ) : (
                    'Check Bill'
                  )}
                </Button>

                {billDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800 p-4 rounded-xl border border-gray-700 space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Name</span>
                      <span className="text-white font-bold">
                        {billDetails.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Period</span>
                      <span className="text-white">
                        {billDetails.period}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        Bill Amount
                      </span>
                      <span className="text-white font-mono">
                        Rp {billDetails.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        Admin Fee
                      </span>
                      <span className="text-white font-mono">
                        Rp {billDetails.adminFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 flex justify-between font-bold text-lg">
                      <span className="text-yellow-400">Total</span>
                      <span className="text-yellow-400">
                        Rp{' '}
                        {(
                          billDetails.amount + billDetails.adminFee
                        ).toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* BUTTONS */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-gray-600 text-gray-300"
              >
                Change Service
              </Button>
              <Button
                type="button"
                onClick={handleNextToReview}
                className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
              >
                Review
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: REVIEW & PILIH METODE BAYAR */}
        {step === 3 && selectedService && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto space-y-6"
          >
            <div className="bg-slate-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-3 mb-4">
                Transaction Review
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Service</span>
                  <span className="text-white font-bold">
                    {selectedService.label}
                  </span>
                </div>

                {formData.provider && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Provider</span>
                    <span className="text-white">
                      {formData.provider}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-400">Number/ID</span>
                  <span className="text-white font-mono">
                    {formData.customerNumber}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Product</span>
                  <span className="text-white text-right">
                    {formData.selectedPackage
                      ? formData.selectedPackage.name
                      : billDetails
                      ? 'Bill Payment'
                      : formData.nominal
                      ? `Top Up ${parseInt(
                          formData.nominal,
                          10
                        ).toLocaleString()}`
                      : '-'}
                  </span>
                </div>

                <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                  <span className="text-gray-400">
                    Total Payment
                  </span>
                  <span className="text-2xl font-bold text-yellow-400">
                    Rp {getTotalAmount().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                Select Payment Method
              </p>

              <button
                type="button"
                onClick={() => handlePayment('QRIS')}
                className="w-full p-4 rounded-xl bg-slate-800 border border-gray-700 hover:border-green-500 hover:bg-green-500/5 transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <span className="block font-bold text-white">
                    QRIS (Instant)
                  </span>
                  <span className="text-xs text-gray-500">
                    GoPay, OVO, Dana, ShopeePay
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePayment('Transfer')}
                className="w-full p-4 rounded-xl bg-slate-800 border border-gray-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <span className="block font-bold text-white">
                    Bank Transfer
                  </span>
                  <span className="text-xs text-gray-500">
                    BCA, Mandiri, BRI, BNI
                  </span>
                </div>
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(2)}
              className="w-full text-gray-400"
            >
              Back to Edit
            </Button>

            {loading && (
              <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
                <p className="text-white font-bold animate-pulse">
                  Processing Transaction...
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* INVOICE MODAL */}
      <InvoiceModal
        isOpen={showInvoice && !!bookingResult}
        onClose={() => {
          setShowInvoice(false);
          window.location.href = '/dashboard';
        }}
        bookingData={
          bookingResult
            ? {
                ...bookingResult,
                isPPOB: true,
                from: 'PPOB System',
                to: bookingResult.customerNumber,
                category: bookingResult.category,
                date: bookingResult.date,
                time: bookingResult.time,
              }
            : null
        }
      />
    </BookingLayout>
  );
};

export default BookingPulsa;
