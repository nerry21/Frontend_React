import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Box, Users, Clock, MapPin, Calendar, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import BookingLayout from '@/components/BookingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import SeatSelector from '@/components/SeatSelector';

const OptionCard = ({ icon: Icon, title, price, details, selected, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden ${
      selected 
        ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
        : 'bg-slate-800/50 border-white/10 hover:border-white/20 hover:bg-slate-800'
    }`}
  >
    {selected && (
      <div className="absolute top-0 right-0 p-2 bg-yellow-500 rounded-bl-xl">
        <CheckCircle2 className="w-5 h-5 text-slate-900" />
      </div>
    )}
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-gray-400'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className={`text-lg font-bold mb-1 ${selected ? 'text-yellow-500' : 'text-white'}`}>{title}</h3>
        <p className="text-sm font-semibold text-green-400 mb-2">{price}</p>
        <ul className="text-xs text-gray-400 space-y-1">
          {details.map((d, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-500" />
              {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </motion.div>
);

const Keberangkatan = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    passengers: 1,
    selectedSeats: [],
    pickupAddr: '',
    dropAddr: '',
    notes: ''
  });

  // Example of booked seats (in a real app, fetch from DB based on date/time)
  const bookedSeats = ['2']; 

  const serviceTypes = [
    {
      id: 'regular',
      icon: Users,
      title: 'Regular Travel',
      price: 'Rp 150.000 / trip',
      details: [
        'Pasirpengaraian ↔ Pekanbaru',
        'Dep: 06:00, 08:00, 10:00, 14:00, 16:00, 19:00 WIB',
        'Seat 1-2-2 configuration',
        'Max 5 passengers'
      ]
    },
    {
      id: 'droping',
      icon: MapPin,
      title: 'Droping Service',
      price: 'Starts Rp 900.000',
      details: [
        'Door-to-door service',
        'Private vehicle charter',
        'Max 6 passengers',
        'Final price confirmed by Admin'
      ]
    },
    {
      id: 'rental',
      icon: Car,
      title: 'Rental Service',
      price: 'Starts Rp 800.000',
      details: [
        'Minimum 2 days rental',
        'Excludes driver meals/accommodation',
        'Excludes fuel',
        'Premium fleet available'
      ]
    },
    {
      id: 'paket',
      icon: Box,
      title: 'Paket Barang',
      price: 'Starts Rp 60.000',
      details: [
        'Express delivery (< 6 hours)',
        'Documents & Packages',
        'Medium/Large sizes confirm with Admin',
        'Secure handling'
      ]
    },
    {
      id: 'lainnya',
      icon: Info,
      title: 'Layanan Lainnya',
      price: 'Contact Admin',
      details: [
        'Door-to-door service',
        'Free mineral water',
        'Free Lunch/Dinner (Coming Soon)',
        'Custom requests'
      ]
    }
  ];

  const handleSeatSelect = (seatId) => {
    const isSelected = formData.selectedSeats.includes(seatId);
    const newSelectedSeats = isSelected 
      ? formData.selectedSeats.filter(id => id !== seatId)
      : [...formData.selectedSeats, seatId];
    
    setFormData({
      ...formData,
      selectedSeats: newSelectedSeats,
      passengers: newSelectedSeats.length // Auto update passenger count
    });
  };

  const handleNext = () => {
    if (step === 1 && !selectedType) {
      toast({ title: 'Selection Required', description: 'Please select a service type.', variant: 'destructive' });
      return;
    }
    if (step === 2) {
      if (!formData.date) {
        toast({ title: 'Required Field', description: 'Please select a date.', variant: 'destructive' });
        return;
      }
      if (selectedType === 'regular') {
        if (!formData.time) {
           toast({ title: 'Required Field', description: 'Please select departure time.', variant: 'destructive' });
           return;
        }
        if (formData.selectedSeats.length === 0) {
           toast({ title: 'Seat Selection', description: 'Please select at least one seat from the diagram.', variant: 'destructive' });
           return;
        }
      }
    }
    setStep(prev => prev + 1);
  };

  return (
    <BookingLayout title="Transport Services" subtitle="Premium Fleet & Professional Drivers" step={step}>
      <Helmet><title>Transport Booking - LK Travel</title></Helmet>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">Select Service Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((type) => (
                <OptionCard
                  key={type.id}
                  {...type}
                  selected={selectedType === type.id}
                  onClick={() => setSelectedType(type.id)}
                />
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleNext} className="bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 px-8">
                Next Step
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Trip Details: <span className="text-yellow-500 capitalize">{selectedType}</span></h3>
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full border border-white/10 text-gray-400">Step 2 of 3</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Form Fields */}
              <div className="space-y-6">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 space-y-6">
                  <div>
                    <Label>Departure Date</Label>
                    <div className="relative mt-1.5">
                      <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <Input 
                        type="date" 
                        className="pl-10 bg-slate-900 border-gray-700"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})} 
                      />
                    </div>
                  </div>
                  
                  {selectedType === 'regular' && (
                    <div>
                      <Label>Departure Time</Label>
                      <div className="relative mt-1.5">
                        <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <select 
                          className="w-full h-10 rounded-md border border-gray-700 bg-slate-900 pl-10 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          value={formData.time}
                          onChange={(e) => setFormData({...formData, time: e.target.value})}
                        >
                          <option value="">Select Time</option>
                          <option value="06:00">06:00 WIB</option>
                          <option value="08:00">08:00 WIB</option>
                          <option value="10:00">10:00 WIB</option>
                          <option value="14:00">14:00 WIB</option>
                          <option value="16:00">16:00 WIB</option>
                          <option value="19:00">19:00 WIB</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedType !== 'regular' && (selectedType === 'droping') && (
                    <div>
                      <Label>Passengers</Label>
                      <div className="relative mt-1.5">
                        <Users className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <Input 
                          type="number" 
                          min="1" 
                          max={6}
                          className="pl-10 bg-slate-900 border-gray-700"
                          value={formData.passengers}
                          onChange={(e) => setFormData({...formData, passengers: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Pickup Address</Label>
                      <Input 
                        className="bg-slate-900 border-gray-700 mt-1.5" 
                        placeholder="Enter full pickup address"
                        value={formData.pickupAddr}
                        onChange={(e) => setFormData({...formData, pickupAddr: e.target.value})}
                      />
                    </div>
                    
                    {selectedType !== 'rental' && (
                      <div>
                        <Label>Drop-off Address</Label>
                        <Input 
                          className="bg-slate-900 border-gray-700 mt-1.5" 
                          placeholder="Enter destination address"
                          value={formData.dropAddr}
                          onChange={(e) => setFormData({...formData, dropAddr: e.target.value})}
                        />
                      </div>
                    )}

                    <div>
                      <Label>Special Notes</Label>
                      <Input 
                        className="bg-slate-900 border-gray-700 mt-1.5" 
                        placeholder="Additional requests..."
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Seat Selection for Regular Type */}
              <div>
                 {selectedType === 'regular' ? (
                   <div className="sticky top-6">
                     <SeatSelector 
                        selectedSeats={formData.selectedSeats}
                        onSeatSelect={handleSeatSelect}
                        bookedSeats={bookedSeats}
                        pricePerSeat={150000}
                     />
                   </div>
                 ) : (
                   <div className="h-full flex items-center justify-center bg-slate-800/20 rounded-xl border border-white/5 border-dashed p-8 text-center">
                      <div className="max-w-xs">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Car className="w-8 h-8 text-gray-500" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Vehicle Allocation</h4>
                        <p className="text-gray-400 text-sm">
                          For {selectedType === 'rental' ? 'Rental' : 'Droping'} services, the vehicle type will be assigned based on your passenger count and availability by our admin.
                        </p>
                      </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
               <Button onClick={handleNext} className="bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 px-10 h-12 text-lg shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all">
                Review & Confirm
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
             key="step3"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="text-center py-10"
          >
             <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(74,222,128,0.4)]">
                <CheckCircle2 className="w-12 h-12 text-white" />
             </motion.div>
             <h2 className="text-4xl font-black text-white mb-4">Booking Request Received!</h2>
             <div className="max-w-lg mx-auto bg-slate-800/50 p-8 rounded-2xl border border-white/10 mb-8">
               <p className="text-gray-300 mb-6 leading-relaxed">
                 Your booking for <span className="text-yellow-500 font-bold capitalize">{selectedType}</span> has been submitted successfully.
               </p>
               
               {selectedType === 'regular' && (
                 <div className="flex flex-col gap-2 p-4 bg-black/20 rounded-xl mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Seats Selected:</span>
                      <span className="text-white font-bold">{formData.selectedSeats.join(', ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Amount:</span>
                      <span className="text-yellow-400 font-bold">Rp {(formData.selectedSeats.length * 150000).toLocaleString()}</span>
                    </div>
                 </div>
               )}

               <p className="text-sm text-gray-400">Our admin team will verify your request and contact you via WhatsApp shortly for payment confirmation.</p>
             </div>
             
             <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.href = '/dashboard'} className="bg-slate-800 text-white border border-white/10 h-12 px-6 hover:bg-slate-700">
                   Back to Dashboard
                </Button>
                <Button className="bg-[#25D366] hover:bg-[#20BA5C] text-white font-bold h-12 px-6">
                   Contact Admin via WhatsApp
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BookingLayout>
  );
};

export default Keberangkatan;