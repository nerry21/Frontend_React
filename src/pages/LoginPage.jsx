import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import MalayPattern from '@/components/MalayPattern';

const FloatingInput = ({ label, icon: Icon, type, value, onChange, id }) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative mb-6 group">
      <div
        className={`relative flex items-center bg-slate-900/50 border rounded-xl transition-all duration-500 ${
          focused || value
            ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)] bg-slate-900/80'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="pl-4 text-gray-500 transition-colors duration-300 group-hover:text-gray-300">
          <Icon className={`w-5 h-5 transition-colors ${focused ? 'text-yellow-500' : ''}`} />
        </div>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-14 pl-3 pr-10 bg-transparent text-white focus:outline-none pt-4 pb-1 text-base font-medium z-10"
        />
        <motion.label
          htmlFor={id}
          initial={false}
          animate={{
            y: focused || value ? -12 : 0,
            scale: focused || value ? 0.75 : 1,
            x: focused || value ? -10 : 0,
            color: focused || value ? '#EAB308' : '#6B7280',
          }}
          transition={{ duration: 0.2 }}
          className="absolute left-10 top-4 pointer-events-none origin-left font-medium"
        >
          {label}
        </motion.label>

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-gray-500 hover:text-white transition-colors z-20"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  // 3D Tilt Logic
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (event) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      x.set(event.clientX - rect.left - rect.width / 2);
      y.set(event.clientY - rect.top - rect.height / 2);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      setStatus('error');
      setErrorMsg('Email dan password wajib diisi.');
      toast({
        title: 'Form belum lengkap',
        description: 'Mohon isi email dan password.',
        variant: 'destructive',
      });
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    const result = await login(formData.email.trim(), formData.password);

    if (result.success) {
      setStatus('success');
      toast({
        title: 'Welcome Back!',
        description: 'Redirecting to dashboard...',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } else {
      setStatus('error');
      setErrorMsg(result.message || 'Invalid credentials provided.');
    }
  };

  const onChangeField = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (status === 'error') {
      setStatus('idle');
      setErrorMsg('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden perspective-1000">
      <Helmet>
        <title>Login - LK Travel</title>
      </Helmet>

      <MalayPattern />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/80 to-slate-950 z-0" />

      <motion.div
        ref={cardRef}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden [transform:translateZ(0)]">
          {/* Decorative Glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/20 rounded-full blur-3xl" />

          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate('/')}
            className="flex items-center text-gray-400 hover:text-white mb-8 text-sm transition-colors relative z-10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </motion.button>

          <div className="text-center mb-10 relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20 transform rotate-3"
            >
              <span className="text-5xl font-black text-slate-900">LK</span>
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your premium account</p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10">
            <FloatingInput
              id="email"
              label="Email Address"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={onChangeField('email')}
            />

            <FloatingInput
              id="password"
              label="Password"
              icon={Lock}
              type="password"
              value={formData.password}
              onChange={onChangeField('password')}
            />

            <div className="flex justify-end mb-8">
              <a
                href="#"
                className="text-sm text-yellow-500 hover:text-yellow-400 font-medium transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            <AnimatePresence mode="wait">
              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 text-red-400 text-sm overflow-hidden"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{errorMsg}</p>
                </motion.div>
              )}
              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-start gap-3 text-green-400 text-sm overflow-hidden"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p>Login successful!</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-slate-900 font-bold text-lg shadow-lg shadow-yellow-500/20 relative overflow-hidden group transition-all duration-300"
            >
              {status === 'loading' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </motion.div>
              ) : (
                <span className="relative z-10 group-hover:scale-105 transition-transform inline-block">
                  Sign In
                </span>
              )}
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
          </form>

          <div className="mt-8 text-center relative z-10">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-yellow-500 font-bold hover:text-yellow-400 underline decoration-yellow-500/30 underline-offset-4 hover:decoration-yellow-500"
              >
                Register Now
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
