import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const FAB = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show FAB after a tiny delay to allow initial load, 
    // but don't show it on the submit page itself or login/signup.
    const hiddenRoutes = ['/submit', '/login', '/signup'];
    if (hiddenRoutes.includes(location.pathname)) {
      setIsVisible(false);
    } else {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 z-50 flex items-center justify-center group"
        >
          {/* Glow effect behind */}
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <Link
            to="/submit"
            className="relative flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all border border-white/20"
          >
            <Plus className="w-6 h-6" />
            <span className="font-bold text-sm">Report Issue</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FAB;
