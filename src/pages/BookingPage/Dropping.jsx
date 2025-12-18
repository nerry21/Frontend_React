// src/pages/BookingPage/Dropping.jsx
import { motion } from 'framer-motion';
import { Clock, Info, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DroppingStep = ({
  bookingData,
  setBookingData,
  handleLocationChange,
  addLocation,
  removeLocation,
  calculatePrice,
  finalTotal,
  onBack,
  onNext,
}) => {
  const isRental = bookingData.category === 'Rental';

  return (
    <motion.div
      key="dropping-step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="text-yellow-400" /> Schedule & Route (
            {bookingData.category})
          </h2>

          {/* route */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label className="text-gray-400 mb-2 block">Origin City</Label>
              <select
                className="w-full bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                value={bookingData.from}
                onChange={(e) =>
                  setBookingData({ ...bookingData, from: e.target.value })
                }
              >
                <option value="Rokan Hulu">Rokan Hulu</option>
                <option value="Pekanbaru">Pekanbaru</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">
                Destination City
              </Label>
              <select
                className="w-full bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                value={bookingData.to}
                onChange={(e) =>
                  setBookingData({ ...bookingData, to: e.target.value })
                }
              >
                <option value="Pekanbaru">Pekanbaru</option>
                <option value="Rokan Hulu">Rokan Hulu</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Date</Label>
              <Input
                type="date"
                value={bookingData.date}
                onChange={(e) =>
                  setBookingData({ ...bookingData, date: e.target.value })
                }
                className="bg-slate-900 border-gray-600 text-white h-12"
              />
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Time</Label>
              <select
                className="w-full bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none h-12"
                value={bookingData.time}
                onChange={(e) =>
                  setBookingData({ ...bookingData, time: e.target.value })
                }
              >
                <option>08:00 WIB</option>
                <option>10:00 WIB</option>
                <option>14:00 WIB</option>
                <option>16:00 WIB</option>
                <option>20:00 WIB</option>
              </select>
            </div>
          </div>

          {/* rental / dropping notes */}
          <div className="space-y-6 border-t border-gray-700 pt-6">
            {isRental && (
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30 mb-4">
                <h4 className="text-blue-400 font-bold flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" /> Rental Info
                </h4>
                <p className="text-sm text-gray-300">
                  Price excludes BBM, Driver Meals, Tolls, and
                  Accommodations.
                </p>
                <div className="mt-4">
                  <Label className="text-gray-400 mb-2 block">
                    Duration (Days)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={bookingData.rentalDuration}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        rentalDuration: e.target.value,
                      })
                    }
                    className="bg-slate-900 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}

            {!isRental && (
              <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-500/30 mb-4">
                <h4 className="text-yellow-400 font-bold flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" /> Dropping Rules
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  <li>Max 6-7 Passengers.</li>
                  <li>
                    Standard Price (750k) includes 1 Pickup & 1 Dropoff.
                  </li>
                  <li>
                    Multiple locations (Max 5) increase price to 900k.
                  </li>
                  <li>Includes: BBM, Driver Meal, Tol.</li>
                </ul>
                <div className="mt-4">
                  <Label className="text-gray-400 mb-2 block">
                    Passenger Count
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="7"
                    value={bookingData.passengerCount}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        passengerCount: parseInt(e.target.value || '0', 10),
                      })
                    }
                    className="bg-slate-900 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}

            {/* pickup locations */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-gray-400">Pickup Location(s)</Label>
                {!isRental && (
                  <Button
                    type="button"
                    onClick={() => addLocation('pickup')}
                    size="sm"
                    variant="ghost"
                    className="text-yellow-400 hover:bg-yellow-400/10 h-6"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                )}
              </div>
              {bookingData.pickupLocations.map((loc, idx) => (
                <div key={`pick-${idx}`} className="flex gap-2 mb-2">
                  <Input
                    placeholder={
                      idx === 0
                        ? 'Main Pickup Point'
                        : `Pickup Point #${idx + 1}`
                    }
                    value={loc}
                    onChange={(e) =>
                      handleLocationChange('pickup', idx, e.target.value)
                    }
                    className="bg-slate-900 border-gray-600 text-white"
                  />
                  {bookingData.pickupLocations.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeLocation('pickup', idx)}
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* dropoff locations */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-gray-400">
                  Destination Location(s)
                </Label>
                {!isRental && (
                  <Button
                    type="button"
                    onClick={() => addLocation('dropoff')}
                    size="sm"
                    variant="ghost"
                    className="text-yellow-400 hover:bg-yellow-400/10 h-6"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                )}
              </div>
              {bookingData.dropoffLocations.map((loc, idx) => (
                <div key={`drop-${idx}`} className="flex gap-2 mb-2">
                  <Input
                    placeholder={
                      idx === 0
                        ? 'Main Destination'
                        : `Destination #${idx + 1}`
                    }
                    value={loc}
                    onChange={(e) =>
                      handleLocationChange('dropoff', idx, e.target.value)
                    }
                    className="bg-slate-900 border-gray-600 text-white"
                  />
                  {bookingData.dropoffLocations.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeLocation('dropoff', idx)}
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* summary */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-gray-700 shadow-xl sticky top-24">
          <h3 className="text-lg font-bold text-white mb-4">Summary</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Category</span>
              <span className="text-white font-medium">
                {bookingData.category}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Route</span>
              <span className="text-white font-medium text-right">
                {bookingData.from} <br />↓<br /> {bookingData.to}
              </span>
            </div>
            {!isRental && (
              <div className="text-xs text-gray-500 mt-2 bg-slate-900 p-2 rounded">
                {bookingData.pickupLocations.length} Pickup(s),{' '}
                {bookingData.dropoffLocations.length} Dropoff(s)
              </div>
            )}
            {isRental && (
              <div className="flex justify-between text-gray-400">
                <span>Duration</span>
                <span className="text-white font-medium">
                  {bookingData.rentalDuration} day(s)
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Estimated Total</span>
              <span className="text-xl font-bold text-yellow-400">
                Rp {finalTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 border-gray-600"
            >
              Back
            </Button>
            <Button
              onClick={onNext}
              className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DroppingStep;
