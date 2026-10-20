import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, ScanSearch } from 'lucide-react';
import { useState, useEffect } from 'react';

const aiSteps = [
  "Analyzing image...",
  "Detecting issue...",
  "Evaluating severity...",
  "Generating complaint..."
];

const Loader = ({ text }) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (text) return; // If specific text provided, don't cycle
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1 < aiSteps.length ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, [text]);

  const displayText = text || aiSteps[stepIndex];

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Outer rotating dashed ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dashed border-blue-500/30"
        />
        {/* Inner rotating solid ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-2 rounded-full border-2 border-t-purple-500 border-r-transparent border-b-blue-500 border-l-transparent opacity-80"
        />
        {/* Center Glow */}
        <div className="absolute inset-4 bg-blue-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
        {/* Icon */}
        <ScanSearch className="w-12 h-12 text-blue-300 relative z-10" />
      </div>
      
      <div className="flex flex-col items-center space-y-2 mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-xl font-medium"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-gradient">{displayText}</span>
          </motion.div>
        </AnimatePresence>
        
        <p className="text-sm text-gray-500 font-mono tracking-widest uppercase mt-4">
          Processing...
        </p>
      </div>
    </div>
  );
};

export default Loader;
