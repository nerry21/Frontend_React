// src/pages/BookingPage/Hotel.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  MapPin,
  Users,
  CheckCircle2,
  Search,
  Star,
  CreditCard,
  Banknote,
  QrCode,
  Info,
  Award,
} from 'lucide-react';

import BookingLayout from '@/components/BookingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// --- MOCK DATA ---
const HOTELS_DATA = [
  {
    id: 1,
    name: 'Grand Hawaii Hotel',
    location: 'Pekanbaru City Center, Pekanbaru',
    rating: 8.2,
    reviews: 7338,
    price: 312_513,
    originalPrice: 415_000,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070',
    facilities: ['AC', 'Restaurant', '24-Hour Front Desk', 'Parking', 'Elevator', 'WiFi'],
    description:
      'Staying at Grand Hawaii Hotel is a good choice when you are visiting Pekanbaru City Center. 24-hours front desk is available to serve you, from check-in to check-out.',
    rooms: [
      {
        id: 'r1',
        name: 'Superior Twin',
        bed: '2 Twin Bed',
        size: '24.0 m²',
        price: 312_513,
        breakfast: false,
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070',
      },
      {
        id: 'r2',
        name: 'Superior Twin with Breakfast',
        bed: '2 Twin Bed',
        size: '24.0 m²',
        price: 357_155,
        breakfast: true,
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2070',
      },
      {
        id: 'r3',
        name: 'Deluxe King',
        bed: '1 King Bed',
        size: '28.0 m²',
        price: 428_586,
        breakfast: true,
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074',
      },
    ],
  },
  {
    id: 2,
    name: 'KHAS Pekanbaru Hotel',
    location: 'Pekanbaru City Center, Pekanbaru',
    rating: 8.4,
    reviews: 6400,
    price: 357_499,
    originalPrice: 476_666,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070',
    facilities: ['AC', 'Restaurant', 'Swimming Pool', 'Parking', 'Elevator', 'WiFi'],
    description: 'High quality service and luxury amenities for a memorable stay.',
    rooms: [
      {
        id: 'k1',
        name: 'Deluxe Room',
        bed: '1 Double Bed',
        size: '26.0 m²',
        price: 357_499,
        breakfast: false,
        image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070',
      },
      {
        id: 'k2',
        name: 'Executive Suite',
        bed: '1 King Bed',
        size: '40.0 m²',
        price: 850_000,
        breakfast: true,
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070',
      },
    ],
  },
  {
    id: 3,
    name: 'Hotel Alpha Pekanbaru',
    location: 'Pekanbaru City Center, Pekanbaru',
    rating: 8.1,
    reviews: 2300,
    price: 296_780,
    originalPrice: 395_706,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070',
    facilities: ['Massage', 'Restaurant', 'WiFi', 'Parking'],
    description: 'Strategic location, easy to access. Good facilities comfortable hotel.',
    rooms: [
      {
        id: 'a1',
        name: 'Standard Room',
        bed: '1 Queen Bed',
        size: '20.0 m²',
        price: 296_780,
        breakfast: false,
        image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2070',
      },
    ],
  },
  {
    id: 4,
    name: 'Aryaduta Pekanbaru',
    location: 'Pekanbaru City Center, Pekanbaru',
    rating: 8.3,
    reviews: 4500,
    price: 460_673,
    originalPrice: 552_826,
    image: 'https://images.unsplash.com/photo-1571896349842-6e53ce41e887?q=80&w=2070',
    facilities: ['Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'],
    description: 'Experience world-class service at Aryaduta Pekanbaru.',
    rooms: [
      {
        id: 'ar1',
        name: 'Superior Room',
        bed: '2 Single Beds',
        size: '32.0 m²',
        price: 460_673,
        breakfast: true,
        image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=2070',
      },
    ],
  },
];

// --- SMALL COMPONENT: GUEST SELECTOR ---
const GuestSelector = ({ guests, setGuests }) => {
  const [isOpen, setIsOpen] = useState(false);

  const update = (key, delta) => {
    setGuests((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 bg-slate-800 border border-slate-700 h-12 px-4 rounded-lg cursor-pointer hover:border-yellow-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Users className="w-5 h-5 text-gray-500" />
        <span className="text-white text-sm">
          {guests.adults} Adult(s), {guests.children} Child, {guests.rooms} Room
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-14 right-0 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
          {['adults', 'children', 'rooms'].map((key) => (
            <div key={key} className="flex items-center justify-between mb-4 last:mb-0">
              <span className="capitalize text-white font-medium">{key}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => update(key, -1)}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700"
                >
                  -
                </button>
                <span className="w-4 text-center text-white">{guests[key]}</span>
                <button
                  type="button"
                  onClick={() => update(key, 1)}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-white hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            className="w-full mt-2 bg-blue-600 hover:bg-blue-500"
            onClick={() => setIsOpen(false)}
          >
            Done
          </Button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

const BookingHotel = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Search State
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
  });
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });

  // Selection State
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Booking Form State
  const [contactDetails, setContactDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [specialRequests, setSpecialRequests] = useState({
    smoking: false,
    connecting: false,
    highFloor: false,
  });
  const [paymentMethod, setPaymentMethod] = useState('');

  const handleSearch = () => {
    // Bisa tambahkan validasi kalau mau
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const selectHotel = (hotel) => {
    setSelectedHotel(hotel);
    setStep(3);
    window.scrollTo(0, 0);
  };

  const selectRoom = (room) => {
    setSelectedRoom(room);
    setStep(4);
    window.scrollTo(0, 0);
  };

  const processPayment = () => {
    if (!paymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(6);
      window.scrollTo(0, 0);
    }, 2000);
  };

  // --- STEP 1: SEARCH ---
  if (step === 1) {
    return (
      <BookingLayout
        title="Hotel Booking"
        subtitle="Find comfortable stays at best prices"
        step={1}
      >
        <Helmet>
          <title>Hotel Search - LK Travel</title>
        </Helmet>

        <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 p-8 rounded-3xl border border-blue-500/20 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10">
            <div className="md:col-span-4 space-y-2">
              <Label className="text-blue-200 ml-1">
                City, Destination, or Hotel Name
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="e.g. Pekanbaru"
                  className="pl-10 h-12 bg-slate-800 border-slate-700 text-white focus:border-yellow-500"
                  value={searchParams.location}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      location: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="md:col-span-4 space-y-2">
              <Label className="text-blue-200 ml-1">
                Check-in & Check-out Dates
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  className="h-12 bg-slate-800 border-slate-700 text-white"
                  value={searchParams.checkIn}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      checkIn: e.target.value,
                    })
                  }
                />
                <Input
                  type="date"
                  className="h-12 bg-slate-800 border-slate-700 text-white"
                  value={searchParams.checkOut}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      checkOut: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="md:col-span-3 space-y-2">
              <Label className="text-blue-200 ml-1">Guests & Rooms</Label>
              <GuestSelector guests={guests} setGuests={setGuests} />
            </div>

            <div className="md:col-span-1 flex items-end">
              <Button
                type="button"
                onClick={handleSearch}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-white font-bold mb-4">Popular Destinations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Pekanbaru',
                img: 'https://images.unsplash.com/photo-1584988078696-6d60a5e8c20d?q=80&w=2070',
                hotels: '120+ Hotels',
              },
              {
                name: 'Rokan Hulu',
                img: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=2070',
                hotels: '45+ Hotels',
              },
              {
                name: 'Dumai',
                img: 'https://images.unsplash.com/photo-1544985368-21d37a85d26a?q=80&w=2070',
                hotels: '30+ Hotels',
              },
            ].map((dest, i) => (
              <div
                key={i}
                className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer"
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors z-10" />
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-4 left-4 z-20">
                  <h4 className="text-xl font-bold text-white">{dest.name}</h4>
                  <p className="text-sm text-gray-200">{dest.hotels}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </BookingLayout>
    );
  }

  // --- STEP 2: HOTEL LISTING ---
  if (step === 2) {
    return (
      <BookingLayout
        title="Select Hotel"
        subtitle={`${HOTELS_DATA.length} properties found`}
        step={2}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar (simplified) */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-4">Filter Results</h3>
              <div className="space-y-3 text-gray-300 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-700 border-slate-600"
                  />
                  Free Cancellation
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-700 border-slate-600"
                  />
                  Breakfast Included
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded bg-slate-700 border-slate-600"
                  />
                  4 Stars & Up
                </label>
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-4">Price Range</h3>
              <input type="range" className="w-full accent-yellow-500" />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Rp 0</span>
                <span>Rp 5jt+</span>
              </div>
            </div>
          </div>

          {/* Hotel List */}
          <div className="lg:col-span-3 space-y-4">
            {HOTELS_DATA.map((hotel) => (
              <div
                key={hotel.id}
                className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex flex-col md:flex-row hover:border-yellow-500/50 transition-all"
              >
                <div className="md:w-64 h-48 md:h-auto relative shrink-0">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{' '}
                    {hotel.rating}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-blue-400 mb-2">
                      <MapPin className="w-3 h-3" /> {hotel.location}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {hotel.facilities.slice(0, 4).map((f) => (
                        <span
                          key={f}
                          className="text-xs bg-slate-700 text-gray-300 px-2 py-1 rounded"
                        >
                          {f}
                        </span>
                      ))}
                      {hotel.facilities.length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{hotel.facilities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-4 border-t border-slate-700 pt-3">
                    <div className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Free Cancellation
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 line-through">
                        Rp {hotel.originalPrice.toLocaleString()}
                      </div>
                      <div className="text-xl font-bold text-orange-500">
                        Rp {hotel.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Exclude taxes &amp; fees
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => selectHotel(hotel)}
                        className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Select Room
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </BookingLayout>
    );
  }

  // --- STEP 3: HOTEL DETAILS & ROOMS ---
  if (step === 3 && selectedHotel) {
    return (
      <BookingLayout
        title={selectedHotel.name}
        subtitle={selectedHotel.location}
        step={2}
      >
        <div className="space-y-8">
          {/* Hotel Hero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-64 md:h-80">
            <div className="md:col-span-2 rounded-2xl overflow-hidden relative">
              <img
                src={selectedHotel.image}
                className="w-full h-full object-cover"
                alt="Main"
              />
            </div>
            <div className="grid grid-rows-2 gap-4">
              <div className="rounded-2xl overflow-hidden bg-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1560185893-a55cbc8c57e5?q=80&w=2070"
                  className="w-full h-full object-cover"
                  alt="Pool"
                />
              </div>
              <div className="rounded-2xl overflow-hidden bg-slate-800 relative">
                <img
                  src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070"
                  className="w-full h-full object-cover"
                  alt="Room"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-black/40 transition-colors">
                  See All Photos
                </div>
              </div>
            </div>
          </div>

          {/* Info Tabs (dummy UI) */}
          <div className="flex gap-8 border-b border-slate-700 pb-4">
            <button className="text-blue-400 font-bold border-b-2 border-blue-400 pb-4 -mb-4">
              Overview
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              Rooms
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              Location
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              Reviews
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  About This Hotel
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {selectedHotel.description}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Main Facilities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedHotel.facilities.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-gray-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Room List */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Available Room Types
                </h3>
                <div className="space-y-4">
                  {selectedHotel.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex flex-col md:flex-row"
                    >
                      <div className="md:w-56 h-48 md:h-auto relative shrink-0">
                        <img
                          src={room.image}
                          className="w-full h-full object-cover"
                          alt={room.name}
                        />
                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                          {room.size}
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">
                            {room.name}
                          </h4>
                          <div className="text-sm text-gray-400 mb-2">
                            {room.bed}
                          </div>
                          <div className="flex gap-2">
                            <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50">
                              Free Cancellation
                            </span>
                            {room.breakfast && (
                              <span className="text-xs bg-orange-900/30 text-orange-400 px-2 py-1 rounded border border-orange-900/50">
                                Breakfast Included
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-4">
                          <div>
                            <div className="text-xs text-gray-500 line-through">
                              Rp {(room.price * 1.2).toLocaleString()}
                            </div>
                            <div className="text-xl font-bold text-orange-500">
                              Rp {room.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              / room / night
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => selectRoom(room)}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                          >
                            Choose
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rating Summary */}
            <div className="space-y-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {selectedHotel.rating}
                  </div>
                  <div>
                    <div className="font-bold text-white">Very Good</div>
                    <div className="text-sm text-gray-400">
                      {selectedHotel.reviews} reviews
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {['Cleanliness', 'Comfort', 'Location', 'Service'].map(
                    (c) => (
                      <div key={c}>
                        <div className="flex justify-between text-xs text-gray-300 mb-1">
                          <span>{c}</span>
                          <span>8.{Math.floor(Math.random() * 9)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[85%]" />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingLayout>
    );
  }

  // --- STEP 4: REVIEW & GUEST DETAILS ---
  if (step === 4 && selectedRoom && selectedHotel) {
    return (
      <BookingLayout
        title="Review Booking"
        subtitle="Please review your booking details"
        step={3}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Details */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-500" /> Contact Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    className="bg-slate-900 border-slate-600 mt-1"
                    value={contactDetails.name}
                    onChange={(e) =>
                      setContactDetails({
                        ...contactDetails,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    className="bg-slate-900 border-slate-600 mt-1"
                    value={contactDetails.email}
                    onChange={(e) =>
                      setContactDetails({
                        ...contactDetails,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Phone Number</Label>
                  <Input
                    className="bg-slate-900 border-slate-600 mt-1"
                    value={contactDetails.phone}
                    onChange={(e) =>
                      setContactDetails({
                        ...contactDetails,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Special Request */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-yellow-500" /> Special Request
              </h3>
              <div className="space-y-3">
                {[
                  { id: 'smoking', label: 'Non-smoking Room' },
                  { id: 'connecting', label: 'Connecting Rooms' },
                  { id: 'highFloor', label: 'High Floor' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-3 p-3 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded bg-slate-900 border-slate-500"
                      checked={specialRequests[opt.id]}
                      onChange={() =>
                        setSpecialRequests((prev) => ({
                          ...prev,
                          [opt.id]: !prev[opt.id],
                        }))
                      }
                    />
                    <span className="text-gray-300">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-yellow-500" /> Payment
                Method
              </h3>
              <div className="space-y-3">
                {[
                  { id: 'qris', label: 'QRIS', icon: QrCode },
                  { id: 'transfer', label: 'Bank Transfer', icon: Banknote },
                  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
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
              type="button"
              onClick={processPayment}
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-900/20"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl overflow-hidden text-slate-900 shadow-xl">
              <div className="p-4 bg-blue-50 text-blue-900 font-bold border-b border-blue-100 flex items-center gap-2">
                <HotelIcon className="w-5 h-5" /> Booking Summary
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-bold text-lg">{selectedHotel.name}</h4>
                  <p className="text-sm text-gray-500">
                    {selectedHotel.location}
                  </p>
                </div>
                <div className="flex gap-4 text-sm border-y border-gray-100 py-4">
                  <div className="flex-1">
                    <span className="text-gray-500 block mb-1">Check-in</span>
                    <span className="font-bold">
                      {searchParams.checkIn || '26 Dec 2025'}
                    </span>
                    <span className="text-xs text-gray-400 block">
                      From 14:00
                    </span>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div className="flex-1">
                    <span className="text-gray-500 block mb-1">
                      Check-out
                    </span>
                    <span className="font-bold">
                      {searchParams.checkOut || '27 Dec 2025'}
                    </span>
                    <span className="text-xs text-gray-400 block">
                      Before 12:00
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block mb-1">
                    Room Type
                  </span>
                  <span className="font-bold block">{selectedRoom.name}</span>
                  <span className="text-xs text-gray-500">
                    {guests.rooms} Room(s), {guests.adults} Guest(s)
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2 text-gray-600 text-sm">
                  <span>Room Price</span>
                  <span>Rp {selectedRoom.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-gray-600 text-sm">
                  <span>Taxes &amp; Fees</span>
                  <span>
                    Rp {(selectedRoom.price * 0.1).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-lg text-orange-600 pt-4 border-t border-gray-200">
                  <span>Total Price</span>
                  <span>
                    Rp {(selectedRoom.price * 1.1).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BookingLayout>
    );
  }

  // --- STEP 6: SUCCESS / VOUCHER ---
  if (step === 6 && selectedRoom && selectedHotel) {
    const bookingId = `HTL-${Math.floor(Math.random() * 100000)}`;

    return (
      <BookingLayout
        title="Booking Confirmed"
        subtitle="Your hotel voucher is ready"
        step={4}
      >
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-400">
              Your booking ID is{' '}
              <span className="text-yellow-500 font-mono">{bookingId}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-left text-slate-900 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award className="w-32 h-32" />
            </div>

            <div className="border-b-2 border-dashed border-gray-200 pb-6 mb-6">
              <h3 className="text-2xl font-black mb-1">
                {selectedHotel.name}
              </h3>
              <p className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {selectedHotel.location}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                  Check-in
                </span>
                <div className="text-lg font-bold">
                  {searchParams.checkIn || '26 Dec 2025'}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                  Check-out
                </span>
                <div className="text-lg font-bold">
                  {searchParams.checkOut || '27 Dec 2025'}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                  Room Type
                </span>
                <div className="text-lg font-bold">{selectedRoom.name}</div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                  Guests
                </span>
                <div className="text-lg font-bold">
                  {guests.adults} Adults, {guests.children} Kids
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
              <span className="font-bold text-gray-500">Total Paid</span>
              <span className="font-bold text-xl text-green-600">
                Rp {(selectedRoom.price * 1.1).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              type="button"
              onClick={() => window.print()}
              variant="outline"
              className="border-slate-600 text-gray-300 hover:text-white"
            >
              Download Invoice
            </Button>
            <Button
              type="button"
              onClick={() => (window.location.href = '/dashboard')}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </BookingLayout>
    );
  }

  return null;
};

// Helper Icon for Summary
const HotelIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
    <path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16" />
    <path d="M8 7h.01" />
    <path d="M16 7h.01" />
    <path d="M12 7h.01" />
    <path d="M12 12h.01" />
    <path d="M16 12h.01" />
    <path d="M8 12h.01" />
  </svg>
);

export default BookingHotel;
