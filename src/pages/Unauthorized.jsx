// src/pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
      <h1 className="text-3xl font-bold mb-4">Akses Ditolak</h1>
      <p className="text-gray-400 mb-6">
        Kamu tidak punya hak akses untuk halaman ini.
      </p>
      <Button onClick={() => navigate('/dashboard')}>
        Kembali ke Dashboard
      </Button>
    </div>
  );
};

export default Unauthorized;
