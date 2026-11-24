import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Map, FileText, Camera, Sparkles, Zap, Shield, Activity } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import TiltCard from '../components/TiltCard';
import MagneticButton from '../components/MagneticButton';
import { useAuth } from '../context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

// Typewriter Effect Hook
const useTypewriter = (text, speed = 50, delay = 0) => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 1000);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayText, showCursor };
};

// Floating 3D Element Component
const FloatingElement = ({ children, delay = 0, duration = 6, yOffset = 20 }) => (
  <motion.div
    animate={{
      y: [0, -yOffset, 0],
      rotateY: [0, 5, 0, -5, 0],
      rotateX: [0, -3, 0, 3, 0],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
    style={{ transformStyle: 'preserve-3d' }}
  >
    {children}
  </motion.div>
);

// Parallax Wrapper
const ParallaxSection = ({ children, offset = 50 }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  );
};

const Home = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const stepsContainer = useRef(null);

  useGSAP(() => {
    gsap.from('.gsap-step-card', {
      scrollTrigger: {
        trigger: stepsContainer.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
      y: 100,
      opacity: 0,
      rotationX: 45,
      transformOrigin: 'top center',
      stagger: 0.2,
      duration: 0.8,
      ease: 'back.out(1.7)'
    });
  }, { scope: stepsContainer });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  const { displayText: titleText } = useTypewriter('Report Civic Issues', 60, 500);
  const { displayText: subtitleText, showCursor } = useTypewriter('With Model Precision', 60, 1200);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  const stats = [
    { value: '10K+', label: 'Issues Reported', icon: Activity },
    { value: '85%', label: 'Resolution Rate', icon: Zap },
    { value: '50+', label: 'Cities Covered', icon: Map },
  ];

  return (
    <div className="min-h-screen pt-24 font-sans relative overflow-x-hidden">
      {/* Background decorations removed for pure black theme */}

      {/* Hero Section with Parallax */}
      <motion.div
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-[90vh] flex items-center"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-6 text-center relative z-10"
        >
          {/* Badge with Glow */}
          <motion.div variants={itemVariants} className="inline-block mb-6 mt-16">
            <motion.span
              className="bg-[#F0F9FF] px-5 py-2.5 text-sm font-semibold rounded-full text-[#0284C7] border border-[#BAE6FD] inline-flex items-center gap-2 shadow-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Sparkles className="w-4 h-4 text-[#0284C7]" />
              Pytorch Model-Powered Civic Reporting
            </motion.span>
          </motion.div>

          {/* Main Heading with Typewriter */}
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-[#0F172A]">
              <span className="block mb-2">{titleText}</span>
              <span className="block text-[#0284C7] relative inline-block">
                {subtitleText}
                {showCursor && (
                  <motion.span
                    className="absolute -right-1 top-0 w-1 h-full bg-[#0284C7]"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl md:text-2xl text-[#4B5563] max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Empowering citizens to build better cities.
            <strong className="text-[#0284C7] font-semibold"> Snap a photo</strong> of civic issues,
            and our <strong className="text-[#0284C7] font-semibold">Model</strong> will automatically
            classify, localize, and analyze them.
          </motion.p>

          {/* CTA Buttons with Magnetic Effect */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            {!isAdmin && (
              <MagneticButton strength={0.2}>
                <motion.button
                  onClick={() => navigate('/submit')}
                  className="relative group px-8 py-4 bg-[#0284C7] text-white font-semibold rounded-xl hover:bg-[#0369A1] shadow-sm transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative flex items-center gap-3">
                    <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>Report an Issue</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </MagneticButton>
            )}

            <MagneticButton strength={0.15}>
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="group px-8 py-4 bg-white text-[#334155] font-semibold rounded-xl border border-[#E5E7EB] hover:border-[#BAE6FD] hover:text-[#0284C7] hover:bg-[#F0F9FF] shadow-sm transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-3">
                  <Map className="w-5 h-5 text-[#0284C7]" />
                  <span>View Dashboard</span>
                </span>
              </motion.button>
            </MagneticButton>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 + index * 0.2 }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-5 h-5 text-[#0284C7]" />
                  <span className="text-3xl md:text-4xl font-extrabold text-[#0F172A]">{stat.value}</span>
                </div>
                <p className="text-sm font-medium text-[#6B7280]">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-[#D1D5DB] rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Features Section with Parallax */}
      <ParallaxSection offset={30}>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#0284C7] font-semibold text-xs tracking-wider uppercase bg-[#F0F9FF] border border-[#BAE6FD] px-3 py-1 rounded-full">
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 text-[#0F172A]">
              Three Steps to <span className="text-[#0284C7]">Better Cities</span>
            </h2>
          </motion.div>

          <div ref={stepsContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ perspective: '1000px' }}>
            {[
              {
                icon: Camera,
                step: '01',
                title: 'Snap a Photo',
                desc: 'Capture any civic issue clearly. Our Model recognizes potholes, broken lights, garbage, and more.',
                color: 'sky',
                delay: 0
              },
              {
                icon: FileText,
                step: '02',
                title: 'AI Auto-Fills',
                desc: 'Advanced AI generates formal complaints, extracts severity levels, and translates to local languages.',
                color: 'sky',
                delay: 0.2
              },
              {
                icon: Shield,
                step: '03',
                title: 'Track & Resolve',
                desc: 'Monitor progress on the live city map, upvote urgent issues, and celebrate resolutions.',
                color: 'sky',
                delay: 0.4
              }
            ].map((feature, index) => (
              <div
                key={feature.step}
                className="gsap-step-card"
              >
                <div className="bg-white p-8 rounded-2xl h-full relative overflow-hidden group border border-[#E5E7EB] hover:border-[#BAE6FD] hover:shadow-md transition-all duration-300 flex flex-col shadow-sm">
                  {/* Blue Top Accent Line on hover */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#0284C7] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                  
                  {/* Subtle Watermark Step Number */}
                  <div className="absolute right-6 bottom-4 text-7xl font-black text-[#F3F4F6] pointer-events-none group-hover:text-[#E0F2FE] transition-all duration-300 select-none">
                    {feature.step}
                  </div>

                  <div className="relative z-10 flex-1 flex flex-col">
                    {/* Header row: Icon + Step */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] flex items-center justify-center border border-[#BAE6FD] text-[#0284C7]">
                        <feature.icon className="w-6 h-6 text-[#0284C7]" />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-[#6B7280] uppercase">
                        Step {feature.step}
                      </span>
                    </div>

                    <div className="mt-2">
                      <h3 className="text-lg font-bold mb-2 text-[#0F172A] group-hover:text-[#0284C7] transition-colors duration-200">
                        {feature.title}
                      </h3>
                      <p className="text-[#4B5563] leading-relaxed text-sm">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ParallaxSection>

      {/* Tech Stack / Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          className="bg-white rounded-2xl p-8 md:p-12 relative overflow-hidden border border-[#E5E7EB] shadow-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7] bg-[#F0F9FF] px-3 py-1 rounded-full border border-[#BAE6FD]">
                Machine Intelligence
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4 text-[#0F172A]">
                Powered by <span className="text-[#0284C7]">Pytorch Model</span>
              </h2>
              <p className="text-[#4B5563] mb-8 text-base leading-relaxed">
                Our platform leverages state-of-the-art machine learning models
                to automatically detect, classify, and prioritize civic issues
                with unprecedented accuracy.
              </p>

              <div className="space-y-3">
                {[
                  { label: 'Computer Vision', desc: 'YOLO-based object detection', icon: Sparkles },
                  { label: 'Natural Language', desc: 'GPT-powered letter generation', icon: FileText },
                  { label: 'Smart Detection', desc: 'Geolocation & duplicate checking', icon: Zap },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#BAE6FD] hover:bg-[#F0F9FF]/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#0284C7]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0F172A]">{item.label}</p>
                      <p className="text-xs text-[#6B7280]">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Animated Tech Visualization */}
            <div className="relative h-64 md:h-96 w-full flex items-center justify-center mt-8 md:mt-0">
              <FloatingElement delay={0} duration={8}>
                <motion.div
                  className="w-48 h-48 bg-[#F0F9FF] rounded-3xl border border-[#BAE6FD] shadow-sm flex items-center justify-center relative z-10"
                  style={{ transform: 'rotateY(15deg) rotateX(-10deg)' }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Activity className="w-16 h-16 text-[#0284C7]" />
                </motion.div>
              </FloatingElement>

              {/* Orbiting Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                {[0, 120, 240].map((deg, i) => (
                  <motion.div
                    key={deg}
                    className="absolute w-3 h-3 bg-[#38BDF8] rounded-full shadow-sm"
                    animate={{
                      x: [0, Math.cos((deg * Math.PI) / 180) * 120, 0],
                      y: [0, Math.sin((deg * Math.PI) / 180) * 120, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "linear"
                    }}
                    style={{ translateX: '-50%', translateY: '-50%' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
