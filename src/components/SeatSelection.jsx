import React from 'react';
import SeatMapBase from './SeatMapBase';

const SeatSelection = ({
  selectedSeats = [],
  onSeatSelect,
  bookedSeats = [],
  pricePerSeat = 125000,
  maxSeats = 6,
}) => {
  return (
    <SeatMapBase
      seatIds={['1A', '2A', '3A', '4A', '5A']}
      selectedSeats={selectedSeats}
      bookedSeats={bookedSeats}
      onSeatSelect={onSeatSelect}
      pricePerSeat={pricePerSeat}
      maxSeats={maxSeats}
      headerSubtitle="Innova • Layout 1-2-2"
      noteText="Anak umur 4 tahun wajib tiket penuh"
      theme={{
        primary: '#ca8a04',
        primaryBorder: '#eab308',
        headerBg: '#fff7ed',
        headerBorder: '#fef3c7',
        legendSelectedBg: '#fef9c3',
        legendSelectedBorder: '#fef08a',
        badgeColor: '#f59e0b',
        textPrimary: '#0f172a',
        secondaryText: '#475569',
        availableFill: '#eff6ff',
        availableStroke: '#60a5fa',
        bookedFill: '#e2e8f0',
        bookedStroke: '#94a3b8',
      }}
      totalBarStyle={{ variant: 'simple' }}
    />
  );
};

export default SeatSelection;
