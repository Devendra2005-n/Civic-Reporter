import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

// Clean SaaS input component
const AnimatedInput = ({ 
  type, 
  value, 
  onChange, 
  label,
  icon: Icon,
  error,
  showToggle,
  onToggle,
  disabled
}) => {
  return (
    <div className="relative">
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={label}
          className="w-full bg-white border border-[#D1D5DB] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition-all disabled:opacity-50"
        />
        
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] transition-colors"
          >
            {type === 'password' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-[#DC2626] text-xs mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 🎉');
      navigate('/');
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      };
      setError(messages[err.code] || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[#F9FAFB]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-8 rounded-2xl w-full max-w-md border border-[#E5E7EB] shadow-sm text-[#0F172A]"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6 text-[#0284C7]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">
            Welcome Back
          </h1>
          <p className="text-[#6B7280] text-xs">
            Sign in to Civic Reporter to continue
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 mb-5 flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <p className="text-xs text-[#DC2626] font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatedInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email Address"
            icon={Mail}
          />

          <AnimatedInput
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            icon={Lock}
            showToggle
            onToggle={() => setShowPassword(!showPassword)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#E5E7EB] text-center">
          <p className="text-xs text-[#6B7280]">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-[#0284C7] hover:text-[#0369A1] font-semibold transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
