import React from 'react';
import SeatMapBase from './SeatMapBase';

const SeatSelector = ({
  selectedSeats = [],
  onSeatSelect,
  bookedSeats = [],
  pricePerSeat = 0,
  maxSeats = 6,
}) => {
  return (
    <SeatMapBase
      seatIds={['1', '2', '3', '4', '5']}
      selectedSeats={selectedSeats}
      bookedSeats={bookedSeats}
      onSeatSelect={onSeatSelect}
      pricePerSeat={pricePerSeat}
      maxSeats={maxSeats}
      headerSubtitle="Travel • Layout 1-2-2"
      noteText="Anak umur 4 tahun dikenakan tiket"
      theme={{
        primary: '#2563eb',
        primaryBorder: '#1d4ed8',
        headerBg: '#eff6ff',
        headerBorder: '#dbeafe',
        legendSelectedBg: '#dbeafe',
        legendSelectedBorder: '#bfdbfe',
        badgeColor: '#2563eb',
        textPrimary: '#0f172a',
        secondaryText: '#475569',
        availableFill: '#eff6ff',
        availableStroke: '#93c5fd',
        bookedFill: '#e2e8f0',
        bookedStroke: '#94a3b8',
      }}
      seatColumnWidth={240}
      totalBarStyle={{
        variant: 'gradient',
        gradient:
          'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(59,130,246,1) 60%, rgba(99,102,241,1) 100%)',
      }}
    />
  );
};

export default SeatSelector;
