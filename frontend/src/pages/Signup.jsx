import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendOTP, verifyOTP } from '../services/api';
import { UserPlus, Mail, Lock, User, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PasswordStrength = ({ password }) => {
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*]/.test(pwd)) score++;
    return score;
  };
  const strength = getStrength(password);
  const levels = [
    { label: 'Weak', color: 'bg-red-500', width: '25%' },
    { label: 'Fair', color: 'bg-orange-500', width: '50%' },
    { label: 'Good', color: 'bg-amber-500', width: '75%' },
    { label: 'Strong', color: 'bg-emerald-500', width: '100%' },
  ];
  if (password.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2.5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#6B7280]">Password Strength</span>
        <span className={`text-xs font-semibold ${strength === 0 ? 'text-red-500' : strength === 1 ? 'text-orange-500' : strength === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
          {levels[strength]?.label || 'Weak'}
        </span>
      </div>
      <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${levels[strength]?.color || 'bg-red-500'}`} initial={{ width: 0 }} animate={{ width: levels[strength]?.width || '25%' }} transition={{ duration: 0.3 }} />
      </div>
      <p className="text-xs text-[#6B7280] mt-1">{strength < 2 && 'Use 8+ chars with uppercase, numbers & symbols'}</p>
    </motion.div>
  );
};

const AnimatedInput = ({ type, value, onChange, label, icon: Icon, showToggle, onToggle, disabled }) => {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={label}
        className="w-full bg-white border border-[#D1D5DB] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-all disabled:opacity-50"
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
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // OTP states
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP verify
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Validate form & send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName) return setError('Please enter your name.');
    if (!cleanEmail) return setError('Please enter your email.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setOtpSending(true);
    try {
      await sendOTP(cleanEmail, cleanName);
      setStep(2);
      setCountdown(300); // 5 min
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
      toast.success(`Verification code sent to ${cleanEmail}! Please check your Gmail. 📧`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  // Handle OTP input with auto-advance
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP then create account
  const handleVerifyAndSignup = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return setError('Please enter the complete 6-digit OTP.');

    setError('');
    setOtpVerifying(true);
    const cleanEmail = email.trim();
    const cleanName = name.trim();
    try {
      const verifyRes = await verifyOTP(cleanEmail, otpString);
      if (!verifyRes.data.verified) {
        setError('Invalid OTP. Please try again.');
        setOtpVerifying(false);
        return;
      }
      // OTP verified — now create Firebase account
      try {
        await signup(cleanName, cleanEmail, password);
      } catch (signupErr) {
        if (signupErr.code === 'auth/email-already-in-use') {
          // Account was already registered in Auth during previous try; log in seamlessly
          await login(cleanEmail, password);
        } else {
          throw signupErr;
        }
      }
      toast.success('Account created successfully! 🚀');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.code;
      const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password is too weak.',
      };
      setError(messages[msg] || msg || 'Signup failed. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 240 || otpSending) return;
    setOtpSending(true);
    setError('');
    const cleanEmail = email.trim();
    const cleanName = name.trim();
    try {
      await sendOTP(cleanEmail, cleanName);
      setCountdown(300);
      setOtp(['', '', '', '', '', '']);
      toast.success(`New OTP sent to ${cleanEmail}! 📧`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 text-[#334155]">
      {/* Background Video */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/clean1.mp4" type="video/mp4" />
          <source src="/Clean1.mp4" type="video/mp4" />
        </video>
        {/* Subtle overlay so card and text remain crystal clear */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
      </div>

      {/* Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-2xl shadow-xl p-7 sm:p-8"
      >
        <AnimatePresence mode="wait">
          {/* ===================== STEP 1: REGISTRATION FORM ===================== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Create your account</h1>
                <p className="text-sm text-[#6B7280] mt-1">Join thousands making their cities cleaner & safer</p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-[#DC2626]">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">Full Name</label>
                  <AnimatedInput type="text" value={name} onChange={(e) => setName(e.target.value)} label="Devendra Patil" icon={User} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">Email Address</label>
                  <AnimatedInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} label="name@example.com" icon={Mail} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">Password</label>
                  <AnimatedInput
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    label="Create strong password"
                    icon={Lock}
                    showToggle
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                  <PasswordStrength password={password} />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={otpSending}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-[#0284C7] hover:bg-[#0369A1] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {otpSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Sending verification code...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
                <p className="text-xs text-[#6B7280]">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#0284C7] hover:text-[#0369A1] font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* ===================== STEP 2: OTP VERIFICATION ===================== */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Verify Your Email</h1>
                <p className="text-xs text-[#6B7280] mt-1">We sent a 6-digit verification code to</p>
                <p className="text-xs font-semibold text-[#0284C7] mt-0.5 bg-[#F0F9FF] border border-[#BAE6FD] px-3 py-1 rounded-full inline-block">
                  {email}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-[#DC2626]">{error}</p>
                </div>
              )}

              {/* OTP Input Grid */}
              <div className="flex justify-center gap-2 sm:gap-3 mb-5" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 sm:w-12 h-14 text-center text-xl font-bold rounded-xl border bg-white text-[#0F172A] focus:outline-none transition-all ${
                      digit
                        ? 'border-[#0284C7] ring-2 ring-[#0284C7]/20 bg-[#F0F9FF]'
                        : 'border-[#D1D5DB] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20'
                    }`}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="text-center mb-6">
                {countdown > 0 ? (
                  <p className="text-xs text-[#6B7280]">
                    Code expires in <span className="font-semibold text-[#0F172A]">{formatTime(countdown)}</span>
                  </p>
                ) : (
                  <p className="text-xs font-medium text-[#DC2626]">Code expired! Please request a new one.</p>
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyAndSignup}
                disabled={otpVerifying || otp.join('').length !== 6}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-[#0284C7] hover:bg-[#0369A1] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {otpVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Verifying & Setting Up...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Create Account</span>
                  </>
                )}
              </button>

              {/* Resend & Back */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setOtp(['', '', '', '', '', '']); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#0F172A] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 240 || otpSending}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${otpSending ? 'animate-spin' : ''}`} /> Resend Code
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Signup;
