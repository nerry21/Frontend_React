// src/pages/BookingPage/BookingRental.jsx

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  MapPin,
  Users,
  Briefcase,
  CheckCircle2,
  Settings2,
  QrCode,
  Banknote,
  User,
} from 'lucide-react';

import BookingLayout from '@/components/BookingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import InvoiceModal from '@/components/InvoiceModal';

// --- MOCK DATA ---
const CARS_DATA = [
  {
    id: 1,
    name: 'Toyota Grand New Avanza',
    transmission: 'Automatic',
    seats: 6,
    baggage: 2,
    price: 467500,
    provider: 'TRAC Pekanbaru',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=2069&auto=format&fit=crop',
    features: ['Clean Interior', 'Bluetooth Audio'],
  },
  {
    id: 2,
    name: 'Daihatsu Ayla',
    transmission: 'Automatic',
    seats: 4,
    baggage: 2,
    price: 350000,
    provider: 'Riau Rent Car',
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=2070&auto=format&fit=crop',
    features: ['Fuel Efficient', 'Compact'],
  },
  {
    id: 3,
    name: 'Honda Brio',
    transmission: 'Automatic',
    seats: 4,
    baggage: 2,
    price: 375000,
    provider: 'Riau Rent Car',
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1629896740682-1c05d8f61530?q=80&w=2072&auto=format&fit=crop',
    features: ['Sporty Look', 'Smart Entry'],
  },
  {
    id: 4,
    name: 'Toyota Innova Reborn',
    transmission: 'Automatic',
    seats: 7,
    baggage: 4,
    price: 650000,
    provider: 'TRAC Pekanbaru',
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1567818735868-e71b99ab7286?q=80&w=2070&auto=format&fit=crop',
    features: ['Luxury Comfort', 'Captain Seat'],
  },
];

const BookingRental = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  // Search Params
  const [searchParams, setSearchParams] = useState({
    location: 'Pekanbaru',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '09:00',
  });

  // Selection State
  const [selectedCar, setSelectedCar] = useState(null);

  // Booking Details
  const [bookingDetails, setBookingDetails] = useState({
    fullName: '',
    phone: '',
    address: '',
    pickupType: 'office', // 'office' or 'delivery'
    deliveryAddress: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('');

  // --- HELPERS ---
  const calculateDays = () => {
    if (!searchParams.startDate || !searchParams.endDate) return 1;
    const start = new Date(searchParams.startDate);
    const end = new Date(searchParams.endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime <= 0) return 1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const deliveryFee = 50000;
  const days = calculateDays();
  const basePrice = selectedCar ? selectedCar.price * days : 0;
  const totalAmount =
    selectedCar
      ? basePrice +
        (bookingDetails.pickupType === 'delivery' ? deliveryFee : 0)
      : 0;

  // --- HANDLERS ---
  const handleSearch = () => {
    if (!searchParams.startDate || !searchParams.endDate) {
      toast({
        title: 'Dates Required',
        description: 'Please select start and end dates.',
        variant: 'destructive',
      });
      return;
    }

    const start = new Date(searchParams.startDate);
    const end = new Date(searchParams.endDate);

    if (end < start) {
      toast({
        title: 'Invalid Date Range',
        description: 'End date cannot be earlier than start date.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const selectCar = (car) => {
    setSelectedCar(car);
    setStep(3);
    window.scrollTo(0, 0);
  };

  const handleProviderConfirm = () => {
    setStep(4);
    window.scrollTo(0, 0);
  };

  const handleDetailsSubmit = () => {
    if (
      !bookingDetails.fullName ||
      !bookingDetails.phone ||
      !bookingDetails.address
    ) {
      toast({
        title: 'Incomplete Details',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    if (
      bookingDetails.pickupType === 'delivery' &&
      !bookingDetails.deliveryAddress
    ) {
      toast({
        title: 'Delivery Address',
        description: 'Please enter delivery address.',
        variant: 'destructive',
      });
      return;
    }
    setStep(5);
    window.scrollTo(0, 0);
  };

  const processPayment = () => {
    if (!paymentMethod) {
      toast({
        title: 'Payment Method',
        description: 'Select a payment method.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(6);
      setShowInvoice(true);
      window.scrollTo(0, 0);
    }, 2000);
  };

  const invoiceBookingData =
    selectedCar && totalAmount
      ? {
          id: `RNT-${Date.now()}`,
          category: 'Rental Lepas Kunci',
          from: searchParams.location,
          to:
            bookingDetails.pickupType === 'delivery'
              ? bookingDetails.deliveryAddress || 'Delivery Location'
              : 'Office Pickup',
          date: searchParams.startDate,
          time: searchParams.startTime,
          passengerName: bookingDetails.fullName,
          passengerPhone: bookingDetails.phone,
          pickupAddress: bookingDetails.address,
          totalAmount: totalAmount,
          // Custom fields for invoice display logic
          itemName: selectedCar.name,
          itemType: `${days} Days Rental`,
          itemSize: selectedCar.transmission,
        }
      : null;

  // --- RENDER ---
  return (
    <BookingLayout
      title="Rental Lepas Kunci"
      subtitle="Self-drive car rental services"
      // visual step di header (maksimal 3)
      step={step > 5 ? 3 : Math.min(step, 3)}
    >
      <Helmet>
        <title>Car Rental - LK Travel</title>
      </Helmet>

      {/* STEP 1: SEARCH */}
      {step === 1 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="md:col-span-2">
              <Label className="text-gray-300 ml-1">Rental Location</Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <select
                  className="w-full h-12 pl-10 bg-slate-900 border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  value={searchParams.location}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                >
                  <option value="Pekanbaru">Pekanbaru</option>
                  <option value="Rokan Hulu">Rokan Hulu</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 ml-1">Start Date & Time</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="date"
                  className="bg-slate-900 border-gray-700 h-12 flex-1"
                  value={searchParams.startDate}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
                <Input
                  type="time"
                  className="bg-slate-900 border-gray-700 h-12 w-32"
                  value={searchParams.startTime}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 ml-1">End Date & Time</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="date"
                  className="bg-slate-900 border-gray-700 h-12 flex-1"
                  value={searchParams.endDate}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
                <Input
                  type="time"
                  className="bg-slate-900 border-gray-700 h-12 w-32"
                  value={searchParams.endTime}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <Button
                onClick={handleSearch}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg"
              >
                {loading ? 'Searching...' : 'Search Available Cars'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CAR SELECTION */}
      {step === 2 && (
        <div className="space-y-4">
          {CARS_DATA.map((car) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl overflow-hidden shadow-md flex flex-col md:flex-row border border-gray-200"
            >
              <div className="md:w-72 h-48 md:h-auto relative shrink-0 bg-gray-100 flex items-center justify-center p-4">
                <img
                  src={car.image}
                  alt={car.name}
                  className="max-w-full max-h-full object-contain mix-blend-multiply"
                />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {car.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Settings2 className="w-3 h-3" /> {car.transmission}
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <Users className="w-3 h-3" /> {car.seats} Seats
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <Briefcase className="w-3 h-3" /> {car.baggage} Bags
                      </p>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                      {car.provider}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {car.features.map((f, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-400">
                      Total Price for {days} Day(s)
                    </p>
                    <p className="text-xl font-black text-orange-500">
                      Rp {(car.price * days).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => selectCar(car)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8"
                  >
                    Lanjutkan
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* STEP 3: PROVIDER / CONFIRM CAR */}
      {step === 3 && selectedCar && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-xl p-6 text-slate-900 shadow-xl border-l-4 border-orange-500">
            <h3 className="font-bold text-lg mb-4">Selected Provider</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                {selectedCar.provider.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-xl">{selectedCar.provider}</h4>
                <div className="flex items-center gap-1 text-yellow-500 text-sm">
                  <User className="w-4 h-4 fill-yellow-500" />
                  <span className="text-gray-600 font-medium">
                    Excellent Service (4.8/5.0)
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Unit Year
                2020 or newer
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Clean &
                Sanitized
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> 24/7
                Roadside Assistance
              </div>
            </div>
            <Button
              onClick={handleProviderConfirm}
              className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold h-12"
            >
              Continue Booking
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: PASSENGER DETAILS */}
      {step === 4 && selectedCar && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-500" /> Contact Details
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={bookingDetails.fullName}
                    onChange={(e) =>
                      setBookingDetails((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="bg-slate-900 border-slate-600 mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={bookingDetails.phone}
                      onChange={(e) =>
                        setBookingDetails((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="bg-slate-900 border-slate-600 mt-1"
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={searchParams.location}
                      disabled
                      className="bg-slate-900 border-slate-600 mt-1 opacity-50"
                    />
                  </div>
                </div>
                <div>
                  <Label>Home Address</Label>
                  <Input
                    value={bookingDetails.address}
                    onChange={(e) =>
                      setBookingDetails((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="bg-slate-900 border-slate-600 mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-yellow-500" /> Pickup
                Preference
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() =>
                    setBookingDetails((prev) => ({
                      ...prev,
                      pickupType: 'office',
                    }))
                  }
                  className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${
                    bookingDetails.pickupType === 'office'
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                      : 'bg-slate-900 border-slate-600 text-gray-400'
                  }`}
                >
                  <div className="font-bold mb-1">Take at Office</div>
                  <div className="text-xs">Free</div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBookingDetails((prev) => ({
                      ...prev,
                      pickupType: 'delivery',
                    }))
                  }
                  className={`p-4 rounded-xl border cursor-pointer text-center transition-all ${
                    bookingDetails.pickupType === 'delivery'
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                      : 'bg-slate-900 border-slate-600 text-gray-400'
                  }`}
                >
                  <div className="font-bold mb-1">
                    Delivery to Location
                  </div>
                  <div className="text-xs">
                    + Rp {deliveryFee.toLocaleString()}
                  </div>
                </button>
              </div>

              {bookingDetails.pickupType === 'delivery' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <Label>Delivery Address</Label>
                  <Input
                    value={bookingDetails.deliveryAddress}
                    onChange={(e) =>
                      setBookingDetails((prev) => ({
                        ...prev,
                        deliveryAddress: e.target.value,
                      }))
                    }
                    placeholder="Hotel / House Address"
                    className="bg-slate-900 border-slate-600 mt-1"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleDetailsSubmit}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg"
            >
              Proceed to Payment
            </Button>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl overflow-hidden text-slate-900 shadow-xl">
              <div className="p-4 bg-orange-500 text-white font-bold">
                Booking Summary
              </div>
              <div className="p-4 border-b">
                <h4 className="font-bold text-lg">{selectedCar.name}</h4>
                <p className="text-sm text-gray-500">
                  {selectedCar.provider}
                </p>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-bold">{days} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Start</span>
                  <span className="font-bold">
                    {searchParams.startDate} {searchParams.startTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End</span>
                  <span className="font-bold">
                    {searchParams.endDate} {searchParams.endTime}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Rental Price</span>
                  <span>
                    Rp {(selectedCar.price * days).toLocaleString()}
                  </span>
                </div>
                {bookingDetails.pickupType === 'delivery' && (
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>Rp {deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xl text-orange-600 pt-2 border-t mt-2">
                  <span>Total</span>
                  <span>Rp {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: PAYMENT */}
      {step === 5 && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="font-bold text-white mb-4">
              Select Payment Method
            </h3>
            <div className="space-y-3">
              {[
                { id: 'qris', label: 'QRIS', icon: QrCode },
                { id: 'transfer', label: 'Bank Transfer', icon: Banknote },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <method.icon
                    className={`w-6 h-6 ${
                      paymentMethod === method.id
                        ? 'text-blue-400'
                        : 'text-gray-400'
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      paymentMethod === method.id
                        ? 'text-blue-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {method.label}
                  </span>
                  {paymentMethod === method.id && (
                    <CheckCircle2 className="w-5 h-5 text-blue-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={processPayment}
            disabled={loading}
            className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </Button>
        </div>
      )}

      {/* STEP 6: SUCCESS */}
      {step === 6 && (
        <div className="max-w-xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Booking Successful!
            </h2>
            <p className="text-gray-400">
              Booking ID:{' '}
              <span className="text-yellow-500 font-mono">
                RNT-{Math.floor(Math.random() * 100000)}
              </span>
            </p>
          </div>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            className="bg-yellow-500 text-slate-900 font-bold"
          >
            Back to Dashboard
          </Button>
        </div>
      )}

      {/* INVOICE MODAL */}
      <InvoiceModal
        isOpen={showInvoice && !!invoiceBookingData}
        onClose={() => {
          setShowInvoice(false);
          window.location.href = '/dashboard';
        }}
        bookingData={invoiceBookingData}
      />
    </BookingLayout>
  );
};

export default BookingRental;
