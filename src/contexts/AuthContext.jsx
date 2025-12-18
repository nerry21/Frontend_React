// src/contexts/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

const AuthContext = createContext(null);

// Bisa diganti dengan ENV kalau nanti pakai:
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const API_BASE_URL = 'http://localhost:8080/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Restore session dari localStorage saat pertama kali load
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      const savedToken = localStorage.getItem('token');

      // Kalau dua-duanya ada → restore
      if (savedUser && savedToken) {
        setCurrentUser(JSON.parse(savedUser));
        setToken(savedToken);
        setIsAuthenticated(true);
      } else {
        // Kalau cuma salah satu yang ada → bersihkan
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Error restore auth from localStorage:', err);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  // LOGIN ke backend
  const login = async (email, password) => {
    try {
      const payload = {
        email: email.trim(),
        password: password || '',
      };

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Kalau pakai cookie JWT di backend, aktifkan:
        // credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = 'Login gagal. Periksa email/password.';
        try {
          const errorData = await res.json();
          if (errorData?.error) message = errorData.error;
        } catch {
          // abaikan error parse JSON
        }
        return { success: false, message };
      }

      const data = await res.json();
      const user = data.user;
      const jwtToken = data.token;

      if (!user || !jwtToken) {
        return {
          success: false,
          message: 'Response login tidak valid dari server.',
        };
      }

      setCurrentUser(user);
      setToken(jwtToken);
      setIsAuthenticated(true);

      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', jwtToken);
      } catch (err) {
        console.error('Gagal menyimpan ke localStorage:', err);
      }

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        message: 'Tidak bisa terhubung ke server. Pastikan backend berjalan.',
      };
    }
  };

  // REGISTER ke backend
  const register = async (userData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        let message = 'Registrasi gagal.';
        try {
          const errorData = await res.json();
          if (errorData?.error) message = errorData.error;
        } catch {
          // abaikan error parse JSON
        }
        return { success: false, message };
      }

      return { success: true };
    } catch (err) {
      console.error('Register error:', err);
      return {
        success: false,
        message: 'Tidak bisa terhubung ke server.',
      };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setToken(null);
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    } catch (err) {
      console.error('Gagal menghapus localStorage:', err);
    }
  };

  // ✅ Helper: cek apakah currentUser punya salah satu role yang diizinkan
  const hasRole = (allowedRoles = []) => {
    if (!currentUser || !currentUser.role) return false;
    if (!Array.isArray(allowedRoles)) {
      // kalau ada yang iseng kirim string, tetap di-handle
      allowedRoles = [allowedRoles];
    }
    const userRole = String(currentUser.role).toLowerCase();
    return allowedRoles
      .map((r) => String(r).toLowerCase())
      .includes(userRole);
  };

  // Saat masih restore session, tampilkan loader sederhana agar tidak blank
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-gray-300">
        <span>Loading session...</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        token,        // ⬅️ sekarang token juga tersedia di context
        loadingAuth,
        login,
        register,
        logout,
        hasRole,      // ✅ diexpose di context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
