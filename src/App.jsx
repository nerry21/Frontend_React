// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import Dashboard from '@/pages/Dashboard';
import ServiceSelection from '@/pages/ServiceSelection';

// Booking main page (index.jsx di folder BookingPage)
import BookingPage from '@/pages/BookingPage';

// Semua sub-booking di dalam folder BookingPage
import BookingPulsa from '@/pages/BookingPage/BookingPulsa';
import BookingHotel from '@/pages/BookingPage/Hotel';
import BookingAirport from '@/pages/BookingPage/Airport';
import BookingRental from '@/pages/BookingPage/BookingRental';
import BookingWisata from '@/pages/BookingPage/BookingWisata';
import BookingPesawat from '@/pages/BookingPage/BookingPesawat';

// STEP-2 per layanan
import Reguler from '@/pages/BookingPage/Reguler';
import Dropping from '@/pages/BookingPage/Dropping';
import RentalStep from '@/pages/BookingPage/Rental';
import PaketBarang from '@/pages/BookingPage/PaketBarang';

import Keberangkatan from '@/pages/Keberangkatan';
import FinancialReports from '@/pages/FinancialReports/index.jsx'; // ✅ FIX DI SINI

import VehicleReports from '@/pages/VehicleReports';
import PassengerInfo from '@/pages/PassengerInfo';
import TripInformation from '@/pages/TripInformation';
import DriverInfo from '@/pages/DriverInfo';
import AdminUserData from '@/pages/AdminUserData';

import ValidasiPembayaran from '@/pages/ValidasiPembayaran';
import PengaturanKeberangkatan from '@/pages/PengaturanKeberangkatan';
import AkunDriver from '@/pages/AkunDriver';

import Unauthorized from '@/pages/Unauthorized';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// --------- Placeholder DepartureInfo ----------
const DepartureInfo = () => (
  <div style={{ padding: '2rem', color: 'white' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
      Departure Info
    </h1>
    <p>Halaman Departure Info belum dibuat sebagai page terpisah. Ini placeholder sementara.</p>
  </div>
);

// --------- PrivateRoute ----------
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    if (hasRole(['owner', 'admin'])) return <Navigate to="/dashboard" replace />;
    if (hasRole(['driver', 'mitra', 'customer', 'user'])) return <Navigate to="/booking" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// semua role yang boleh booking
const BOOKING_ROLES = ['owner', 'admin', 'mitra', 'driver', 'customer', 'user'];

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Dashboard → OWNER & ADMIN */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin']}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Services */}
        <Route
          path="/services"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <ServiceSelection />
            </PrivateRoute>
          }
        />

        {/* Booking utama & sub-routes */}
        <Route
          path="/booking"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <BookingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/pulsa"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <BookingPulsa />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/hotel"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <BookingHotel />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/airport"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <BookingAirport />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/rental"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <BookingRental />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/wisata"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <BookingWisata />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/pesawat"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <BookingPesawat />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/keberangkatan"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <Keberangkatan />
            </PrivateRoute>
          }
        />

        {/* STEP-2 booking per layanan */}
        <Route
          path="/booking/reguler/step-2"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <Reguler />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/dropping/step-2"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <Dropping />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/rental/step-2"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <RentalStep />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/paket-barang/step-2"
          element={
            <PrivateRoute allowedRoles={BOOKING_ROLES}>
              <PaketBarang />
            </PrivateRoute>
          }
        />

        {/* Financial Reports → owner */}
        <Route
          path="/financial-reports"
          element={
            <PrivateRoute allowedRoles={['owner']}>
              <FinancialReports />
            </PrivateRoute>
          }
        />

        {/* Vehicle Reports → owner & admin */}
        <Route
          path="/vehicle-reports"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin']}>
              <VehicleReports />
            </PrivateRoute>
          }
        />

        {/* Departure Info placeholder → owner & admin */}
        <Route
          path="/departure-info"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin']}>
              <DepartureInfo />
            </PrivateRoute>
          }
        />

        {/* Trip Information → owner, admin, mitra, driver */}
        <Route
          path="/trip-information"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin', 'mitra', 'driver']}>
              <TripInformation />
            </PrivateRoute>
          }
        />

        {/* Passenger Info → owner & admin */}
        <Route
          path="/passenger-info"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin']}>
              <PassengerInfo />
            </PrivateRoute>
          }
        />

        {/* Driver Info → owner, admin, mitra, driver */}
        <Route
          path="/driver-info"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin', 'mitra', 'driver']}>
              <DriverInfo />
            </PrivateRoute>
          }
        />

        {/* Admin & User Data → owner & admin */}
        <Route
          path="/admin-user-data"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin']}>
              <AdminUserData />
            </PrivateRoute>
          }
        />

        {/* Validasi Pembayaran → owner & admin */}
        <Route
          path="/validasi-pembayaran"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin']}>
              <ValidasiPembayaran />
            </PrivateRoute>
          }
        />

        {/* Pengaturan Keberangkatan → owner, admin, mitra, driver */}
        <Route
          path="/pengaturan-keberangkatan"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin', 'mitra', 'driver']}>
              <PengaturanKeberangkatan />
            </PrivateRoute>
          }
        />

        {/* Akun Driver → owner, admin, driver */}
        <Route
          path="/akun-driver"
          element={
            <PrivateRoute allowedRoles={['owner', 'admin', 'driver']}>
              <AkunDriver />
            </PrivateRoute>
          }
        />

        {/* fallback 404 → ke landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
        <AppRoutes />
        <Toaster />
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;
