import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle2, AlertCircle, Camera, Navigation, Loader2 } from 'lucide-react';

const SOURCE_LABELS = {
  EXIF_GPS: { label: 'GPS Data', icon: '🛰️', color: 'emerald' },
  PLUS_CODE: { label: 'Plus Code', icon: '📍', color: 'blue' },
  ADDRESS_STRING: { label: 'Image Metadata', icon: '🏷️', color: 'purple' },
  MANUAL: { label: 'Manual Selection', icon: '👆', color: 'orange' },
  BROWSER_GPS: { label: 'Browser GPS', icon: '📱', color: 'cyan' },
};

/**
 * LocationDetector component — shows the result of EXIF location extraction.
 * 
 * Props:
 * - status: 'idle' | 'detecting' | 'found' | 'not_found' | 'error'
 * - source: 'EXIF_GPS' | 'PLUS_CODE' | 'ADDRESS_STRING' | 'MANUAL' | 'BROWSER_GPS'
 * - address: { state, district, city, area, fullAddress }
 * - onManualSelect: () => void — callback when user clicks "select manually"
 */
const LocationDetector = ({ status, source, address, onManualSelect }) => {
  if (status === 'idle') return null;

  const sourceInfo = SOURCE_LABELS[source] || SOURCE_LABELS.MANUAL;

  return (
    <AnimatePresence mode="wait">
      {status === 'detecting' && (
        <motion.div
          key="detecting"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl p-4 flex items-center space-x-3 shadow-sm"
        >
          <div className="relative">
            <div className="w-8 h-8 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
            <MapPin className="w-4 h-4 text-[#0284C7] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0369A1]">Detecting location from photo...</p>
            <p className="text-xs text-[#0284C7]/80 mt-0.5">Scanning EXIF metadata, GPS tags, and Plus Codes</p>
          </div>
        </motion.div>
      )}

      {status === 'found' && (
        <motion.div
          key="found"
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
              <span className="text-sm font-bold text-[#166534]">📍 Location auto-detected from photo</span>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-white text-[#16A34A] border border-[#BBF7D0]">
              {sourceInfo.icon} {sourceInfo.label}
            </span>
          </div>

          {address?.fullAddress && (
            <p className="text-xs text-[#334155] pl-7 line-clamp-2">{address.fullAddress}</p>
          )}

          <div className="flex items-center justify-between pl-7">
            <div className="flex items-center space-x-4 text-[11px] text-[#6B7280]">
              {address?.city && <span>🏙️ {address.city}</span>}
              {address?.district && <span>📍 {address.district}</span>}
              {address?.state && <span>🗺️ {address.state}</span>}
            </div>
            {onManualSelect && (
              <button
                type="button"
                onClick={onManualSelect}
                className="text-[11px] text-[#0284C7] hover:text-[#0369A1] font-medium underline underline-offset-2 transition-colors"
              >
                Wrong location? Change manually
              </button>
            )}
          </div>
        </motion.div>
      )}

      {status === 'not_found' && (
        <motion.div
          key="not_found"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-[#D97706]" />
            <div>
              <p className="text-sm font-semibold text-[#92400E]">📍 No location found in photo</p>
              <p className="text-xs text-[#B45309] mt-0.5">Using your browser location instead. You can drag the map marker to adjust.</p>
            </div>
          </div>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 flex items-center space-x-3 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
          <p className="text-xs text-[#991B1B]">Location detection failed. Using browser location as fallback.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationDetector;
