// src/routes/RoleRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RoleRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, loadingAuth, currentUser } = useAuth();

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-gray-300">
        <span>Checking permission...</span>
      </div>
    );
  }

  // Belum login → lempar ke login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = String(currentUser?.role || '').toLowerCase();
  const canAccess = allowedRoles
    .map((r) => r.toLowerCase())
    .includes(role);

  // Role tidak diizinkan → arahkan ke halaman "Tidak punya akses"
  if (!canAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Role OK → render halaman aslinya
  return children;
};

export default RoleRoute;
