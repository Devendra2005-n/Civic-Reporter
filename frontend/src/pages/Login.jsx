import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import MagneticButton from '../components/MagneticButton';

// Memoized video background bypassing React Virtual DOM to prevent ANY crashes or stuttering
const VideoBackground = React.memo(({ src }) => (
  <div className="absolute inset-0 z-0 pointer-events-none bg-black">
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <video 
            autoplay 
            loop 
            muted 
            playsinline 
            style="transform: translateZ(0); will-change: transform;"
            class="w-full h-full object-cover"
            src="${src}"
          ></video>
        `
      }}
      className="w-full h-full absolute inset-0"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/80 to-[#0B0F19]" />
  </div>
));

// Floating blob component for animated background
const FloatingBlob = ({ color, size, top, left, delay, duration }) => (
  <motion.div
    className={`absolute rounded-full blur-[80px] opacity-30 pointer-events-none ${color}`}
    style={{ 
      width: size, 
      height: size, 
      top, 
      left,
    }}
    animate={{
      x: [0, 30, -20, 0],
      y: [0, -30, 20, 0],
      scale: [1, 1.2, 0.9, 1],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  />
);

// Animated input component with floating label
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <motion.div
        className="relative"
        animate={{
          boxShadow: isFocused 
            ? '0 0 0 2px rgba(59, 130, 246, 0.4)' 
            : '0 0 0 0px rgba(59, 130, 246, 0)',
        }}
        style={{ borderRadius: 'var(--radius-xs)' }}
      >
        <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
          isFocused ? 'text-blue-400' : 'text-gray-400'
        }`} />
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={label}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent border border-white/20 rounded-[var(--radius-xs)] pl-12 pr-12 py-3.5 text-white placeholder-gray-400 focus:outline-none transition-all disabled:opacity-50"
        />
        
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {type === 'password' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </motion.div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </motion.p>
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
    <div className="min-h-screen flex flex-col justify-center lg:items-end relative overflow-hidden px-6 lg:pr-24 xl:pr-32 pt-28 pb-8 text-slate-100">
      {/* Video Background */}
      <VideoBackground src="sc4.mp4" />

      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[#0B0F19]/60 z-0" />

      {/* Decorative PNG Sticker Placeholder */}
      <div
        className="hidden lg:block absolute left-0 lg:left-4 xl:left-12 bottom-0 z-20 pointer-events-none origin-bottom"
      >
        <img 
          src="/new.png" 
          alt="Decorative Sticker" 
          className="w-[500px] lg:w-[800px] xl:w-[1000px] h-auto max-h-[80vh] object-contain object-left-bottom drop-shadow-[0_0_40px_rgba(0,0,0,0.5)] opacity-90"
        />
      </div>

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="p-6 md:p-8 rounded-[var(--radius-xs)] w-full max-w-md relative z-10 border border-white/10 shadow-2xl bg-transparent"
      >
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10">
          {/* Header */}
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-extrabold mb-1">
              Welcome <span className="text-gradient">Back</span>
            </h1>
            <p className="text-gray-400 text-xs">
              Sign in to continue
            </p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AnimatedInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Email Address"
                icon={Mail}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AnimatedInput
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Password"
                icon={Lock}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <MagneticButton strength={0.15} className="w-full">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-[var(--radius-xs)] font-bold text-white relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Animated Background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600"
                    animate={{
                      backgroundPosition: loading ? ['0% 50%', '100% 50%', '0% 50%'] : '0% 50%',
                    }}
                    transition={{
                      duration: 3,
                      repeat: loading ? Infinity : 0,
                      ease: "linear"
                    }}
                    style={{ backgroundSize: '200% 200%' }}
                  />
                  
                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    initial={{ x: '-200%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.6 }}
                  />
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="text-sm">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">Sign In</span>
                      </>
                    )}
                  </span>
                </motion.button>
              </MagneticButton>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div 
            className="mt-5 pt-4 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors relative group"
              >
                Create one
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300" />
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
