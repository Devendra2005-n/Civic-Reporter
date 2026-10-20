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
          className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center space-x-3"
        >
          <div className="relative">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <MapPin className="w-4 h-4 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-300">Detecting location from photo...</p>
            <p className="text-xs text-blue-400/60 mt-0.5">Scanning EXIF metadata, GPS tags, and Plus Codes</p>
          </div>
        </motion.div>
      )}

      {status === 'found' && (
        <motion.div
          key="found"
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-300">📍 Location auto-detected from photo</span>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold bg-${sourceInfo.color}-500/20 text-${sourceInfo.color}-300 border border-${sourceInfo.color}-500/30`}
              style={{
                backgroundColor: `var(--source-bg, rgba(16, 185, 129, 0.15))`,
                color: `var(--source-text, rgb(110, 231, 183))`,
                borderColor: `var(--source-border, rgba(16, 185, 129, 0.3))`,
              }}
            >
              {sourceInfo.icon} Source: {sourceInfo.label}
            </span>
          </div>

          {address?.fullAddress && (
            <p className="text-xs text-gray-400 pl-7 line-clamp-2">{address.fullAddress}</p>
          )}

          <div className="flex items-center justify-between pl-7">
            <div className="flex items-center space-x-4 text-[11px] text-gray-500">
              {address?.city && <span>🏙️ {address.city}</span>}
              {address?.district && <span>📍 {address.district}</span>}
              {address?.state && <span>🗺️ {address.state}</span>}
            </div>
            {onManualSelect && (
              <button
                type="button"
                onClick={onManualSelect}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
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
          className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-sm font-semibold text-orange-300">📍 No location found in photo</p>
              <p className="text-xs text-orange-400/60 mt-0.5">Using your browser location instead. You can drag the map marker to adjust.</p>
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
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center space-x-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-xs text-red-300">Location detection failed. Using browser location as fallback.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationDetector;
