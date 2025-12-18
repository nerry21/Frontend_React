// src/pages/BookingPage/Airport.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  PlaneLanding,
  MapPin,
  Calendar,
  Clock,
  Car,
  Users,
  Briefcase,
  Info,
  CheckCircle2,
  Shield,
  CreditCard,
  Banknote,
  QrCode,
  Star,
} from 'lucide-react';

import BookingLayout from '@/components/BookingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// --- MOCK DATA FOR VEHICLES ---
const VEHICLES_DATA = [
  {
    id: 1,
    name: 'NETA V - II',
    type: 'Standar',
    provider: 'INKOPAU Riau',
    rating: 4.8,
    passengers: 4,
    baggage: 4,
    price: 141500,
    image:
      'https://images.unsplash.com/photo-1623886566270-32df9e45d13d?q=80&w=2070&auto=format&fit=crop',
    features: ['Includes Insurance', 'Electric Vehicle', 'Silent Ride'],
  },
  {
    id: 2,
    name: 'Budget MPV',
    type: 'Standar',
    provider: 'INKOPAU Riau',
    rating: 4.7,
    passengers: 4,
    baggage: 4,
    price: 148500,
    image:
      'https://images.unsplash.com/photo-1621213426724-4f056d81e050?q=80&w=2070&auto=format&fit=crop',
    features: ['Includes Insurance', 'Large Trunk'],
  },
  {
    id: 3,
    name: 'MPV',
    type: 'Standar',
    provider: 'INKOPAU Riau',
    rating: 4.9,
    passengers: 4,
    baggage: 4,
    price: 153500,
    image:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop',
    features: ['Includes Insurance', 'Comfort Suspension'],
  },
  {
    id: 4,
    name: 'Mitsubishi Xpander',
    type: 'Standar',
    provider: 'INKOPAU Riau',
    rating: 4.9,
    passengers: 4,
    baggage: 4,
    price: 173500,
    image:
      'https://images.unsplash.com/photo-1626077388041-33311f855d2c?q=80&w=2070&auto=format&fit=crop',
    features: ['Includes Insurance', 'Premium Audio'],
  },
];

const BookingAirport = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Search Params
  const [searchParams, setSearchParams] = useState({
    airport: 'Sultan Syarif Kasim II (PKU)',
    destination: '',
    date: '',
    time: '12:00',
  });

  // Selection
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Details
  const [passengerDetails, setPassengerDetails] = useState({
    fullName: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('');

  // --- HANDLERS ---
  const handleSearch = () => {
    if (!searchParams.destination || !searchParams.date) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
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

  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setStep(3);
    window.scrollTo(0, 0);
  };

  const handleDetailsSubmit = () => {
    if (!passengerDetails.fullName || !passengerDetails.phone) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in Name and Phone Number',
        variant: 'destructive',
      });
      return;
    }
    setStep(4); // To Payment
    window.scrollTo(0, 0);
  };

  const processPayment = () => {
    if (!paymentMethod) {
      toast({
        title: 'Payment Method',
        description: 'Please select a payment method',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(6); // Success
      window.scrollTo(0, 0);
    }, 2000);
  };

  // --- RENDER STEPS ---

  // STEP 1: SEARCH
  if (step === 1) {
    return (
      <BookingLayout
        title="Airport Transfer"
        subtitle="Reliable rides to and from the airport"
        step={1}
      >
        <Helmet>
          <title>Airport Transfer - LK Travel</title>
        </Helmet>

        <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 p-8 rounded-3xl border border-blue-500/20 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
            {/* From (Airport) */}
            <div className="md:col-span-12 space-y-2">
              <Label className="text-blue-200 ml-1">
                Pick-up Location (Airport)
              </Label>
              <div className="relative">
                <PlaneLanding className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <select
                  className="w-full h-12 pl-10 bg-slate-800 border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  value={searchParams.airport}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      airport: e.target.value,
                    })
                  }
                >
                  <option value="Sultan Syarif Kasim II (PKU)">
                    Sultan Syarif Kasim II (PKU) - Pekanbaru
                  </option>
                  <option value="Pasir Pengaraian (PPR)">
                    Pasir Pengaraian (PPR) - Rokan Hulu
                  </option>
                </select>
              </div>
            </div>

            {/* To (Destination) */}
            <div className="md:col-span-12 space-y-2">
              <Label className="text-blue-200 ml-1">
                Drop-off Location (Area/Hotel)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Enter hotel name or area address..."
                  className="pl-10 h-12 bg-slate-800 border-slate-700 text-white focus:border-blue-500"
                  value={searchParams.destination}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      destination: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="md:col-span-6 space-y-2">
              <Label className="text-blue-200 ml-1">Pick-up Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <Input
                  type="date"
                  className="pl-10 h-12 bg-slate-800 border-slate-700 text-white"
                  value={searchParams.date}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="md:col-span-6 space-y-2">
              <Label className="text-blue-200 ml-1">Pick-up Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <Input
                  type="time"
                  className="pl-10 h-12 bg-slate-800 border-slate-700 text-white"
                  value={searchParams.time}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Submit */}
            <div className="md:col-span-12 pt-4">
              <Button
                onClick={handleSearch}
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-500/20"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  'Search Available Vehicles'
                )}
              </Button>
            </div>
          </div>
        </div>
      </BookingLayout>
    );
  }

  // STEP 2: VEHICLE SELECTION
  if (step === 2) {
    return (
      <BookingLayout
        title="Select Vehicle"
        subtitle="Choose a vehicle that suits your needs"
        step={2}
      >
        <div className="bg-blue-500 text-white p-4 rounded-xl flex flex-wrap gap-6 items-center justify-center mb-8 shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5" /> Available 24 hours
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5" /> Convenient pick-up point
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5" /> All-inclusive price
          </div>
        </div>

        <div className="space-y-4">
          {VEHICLES_DATA.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-slate-200 group"
            >
              <div className="p-6 flex flex-col md:flex-row gap-6 items-center">
                {/* Image */}
                <div className="w-full md:w-64 shrink-0 flex flex-col items-center">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-40 object-cover rounded-lg transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="mt-2 flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/4/41/Garuda_Indonesia_Logo.svg"
                      className="w-4 h-4"
                      alt="Provider"
                    />
                    {vehicle.provider}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 w-full text-slate-900">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-black">
                      {vehicle.name}{' '}
                      <span className="text-gray-400 font-normal text-base">
                        ({vehicle.type})
                      </span>
                    </h3>
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-bold">
                      <Star className="w-4 h-4 fill-blue-600" />{' '}
                      {vehicle.rating}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    {vehicle.provider}
                  </p>

                  <div className="flex gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {vehicle.passengers}{' '}
                      passenger(s)
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" /> {vehicle.baggage}{' '}
                      baggage(s)
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((f, i) => (
                      <span
                        key={i}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price + Action */}
                <div className="w-full md:w-auto text-right md:border-l border-gray-100 md:pl-6 flex flex-row md:flex-col justify-between items-center md:items-end">
                  <div className="mb-0 md:mb-4">
                    <div className="text-orange-500 font-black text-2xl">
                      Rp {vehicle.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-500 font-medium flex items-center justify-end gap-1">
                      <Shield className="w-3 h-3" /> Includes Insurance
                    </div>
                    <div className="text-xs text-gray-400">/car</div>
                  </div>
                  <Button
                    onClick={() => selectVehicle(vehicle)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold w-32"
                  >
                    Choose
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </BookingLayout>
    );
  }

  // STEP 3: PASSENGER DETAILS
  if (step === 3 && selectedVehicle) {
    return (
      <BookingLayout
        title="Passenger Details"
        subtitle="Fill in your contact information"
        step={3}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-6 text-lg border-b border-slate-700 pb-2">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={passengerDetails.fullName}
                    onChange={(e) =>
                      setPassengerDetails({
                        ...passengerDetails,
                        fullName: e.target.value,
                      })
                    }
                    className="bg-slate-900 border-slate-600 mt-1"
                    placeholder="As on ID Card"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number (WhatsApp)</Label>
                    <Input
                      value={passengerDetails.phone}
                      onChange={(e) =>
                        setPassengerDetails({
                          ...passengerDetails,
                          phone: e.target.value,
                        })
                      }
                      className="bg-slate-900 border-slate-600 mt-1"
                      placeholder="e.g. 08123456789"
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      value={passengerDetails.email}
                      onChange={(e) =>
                        setPassengerDetails({
                          ...passengerDetails,
                          email: e.target.value,
                        })
                      }
                      className="bg-slate-900 border-slate-600 mt-1"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-4 text-lg border-b border-slate-700 pb-2">
                Notes for Driver
              </h3>
              <textarea
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                placeholder="E.g., Flight number, specific pick-up point, or need for child seat..."
                value={passengerDetails.notes}
                onChange={(e) =>
                  setPassengerDetails({
                    ...passengerDetails,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            <Button
              onClick={handleDetailsSubmit}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg"
            >
              Continue to Payment
            </Button>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl overflow-hidden text-slate-900 shadow-xl">
              <div className="p-4 bg-blue-600 text-white font-bold flex items-center gap-2">
                <PlaneLanding className="w-5 h-5" /> Booking Summary
              </div>
              <div className="p-4 border-b border-gray-200">
                <div className="flex gap-4">
                  <img
                    src={selectedVehicle.image}
                    alt="car"
                    className="w-20 h-16 object-cover rounded bg-gray-100"
                  />
                  <div>
                    <div className="font-bold text-lg">
                      {selectedVehicle.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedVehicle.provider}
                    </div>
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-1">
                      {selectedVehicle.type}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="relative border-l-2 border-dashed border-gray-300 ml-2 pl-6 pb-6">
                  <div className="absolute -left-[5px] top-0 w-3 h-3 bg-blue-500 rounded-full" />
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                    Pick-up
                  </div>
                  <div className="font-bold">{searchParams.airport}</div>
                  <div className="text-sm text-gray-600">
                    {searchParams.date} • {searchParams.time}
                  </div>
                </div>
                <div className="relative border-l-2 border-gray-300 ml-2 pl-6">
                  <div className="absolute -left-[5px] top-0 w-3 h-3 bg-orange-500 rounded-full" />
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                    Drop-off
                  </div>
                  <div className="font-bold">{searchParams.destination}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2 text-gray-600 text-sm">
                  <span>Vehicle Price</span>
                  <span>
                    Rp {selectedVehicle.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4 text-gray-600 text-sm">
                  <span>Tax & Fees</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between items-center font-black text-xl text-orange-600 pt-4 border-t border-gray-200">
                  <span>Total</span>
                  <span>
                    Rp {selectedVehicle.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingLayout>
    );
  }

  // STEP 4: PAYMENT
  if (step === 4 && selectedVehicle) {
    return (
      <BookingLayout
        title="Payment"
        subtitle="Complete your transaction"
        step={4}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-yellow-500" /> Select
                Payment Method
              </h3>
              <div className="space-y-3">
                {[
                  { id: 'qris', label: 'QRIS (Instant)', icon: QrCode },
                  {
                    id: 'transfer',
                    label: 'Bank Transfer (Manual)',
                    icon: Banknote,
                  },
                  {
                    id: 'card',
                    label: 'Credit/Debit Card',
                    icon: CreditCard,
                  },
                ].map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
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
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={processPayment}
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>

          {/* Simple Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl overflow-hidden text-slate-900 shadow-xl opacity-80 pointer-events-none">
              <div className="p-4 bg-gray-100 text-gray-500 font-bold text-center border-b">
                Order Summary
              </div>
              <div className="p-4 text-center">
                <div className="font-bold text-xl">
                  Rp {selectedVehicle.price.toLocaleString()}
                </div>
                <div className="text-sm">{selectedVehicle.name}</div>
              </div>
            </div>
          </div>
        </div>
      </BookingLayout>
    );
  }

  // STEP 6: SUCCESS
  if (step === 6 && selectedVehicle) {
    const bookingId = `APT-${Math.floor(Math.random() * 100000)}`;

    return (
      <BookingLayout
        title="Booking Confirmed"
        subtitle="Your airport transfer is secured"
        step={5}
      >
        <div className="max-w-xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Ready for Take-off (or Landing)!
            </h2>
            <p className="text-gray-400">
              Booking ID:{' '}
              <span className="text-yellow-500 font-mono">{bookingId}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-left text-slate-900 shadow-2xl relative overflow-hidden">
            <div className="border-b-2 border-dashed border-gray-200 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-blue-900">
                  AIRPORT TRANSFER
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedVehicle.provider}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Vehicle</div>
                <div className="font-bold">{selectedVehicle.name}</div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div className="w-0.5 h-full bg-gray-200 my-1" />
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="text-xs text-gray-400 font-bold">
                      PICK-UP
                    </div>
                    <div className="font-bold text-sm">
                      {searchParams.airport}
                    </div>
                    <div className="text-xs text-gray-500">
                      {searchParams.date} @ {searchParams.time}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-bold">
                      DROP-OFF
                    </div>
                    <div className="font-bold text-sm">
                      {searchParams.destination}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded p-3 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">
                PAID AMOUNT
              </span>
              <span className="font-bold text-green-600">
                Rp {selectedVehicle.price.toLocaleString()}
              </span>
            </div>
          </div>

          <Button
            onClick={() => (window.location.href = '/dashboard')}
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
          >
            Back to Dashboard
          </Button>
        </div>
      </BookingLayout>
    );
  }

  return null;
};

export default BookingAirport;
