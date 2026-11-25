import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, MapPin, CheckCircle2, AlertCircle, Compass, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  formatDateTimeGMT,
  formatCoordinates,
  fetchWeather,
  reverseGeocodeDetails,
  createMiniMapCanvas,
  drawGeotagBanner,
  fetchIPLocation,
} from '../utils/geotagRenderer';

const GeotagCamera = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mapCanvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Location & Geotag States
  const [coords, setCoords] = useState({ lat: null, lng: null, accuracy: null });
  const [locationState, setLocationState] = useState('acquiring'); // 'acquiring' | 'locked' | 'fallback' | 'denied'
  const [geoDetails, setGeoDetails] = useState({
    placeName: 'Acquiring location...',
    street: 'Locating street & coordinates...',
    city: '',
    country: '',
    state: '',
    district: '',
    fullAddress: '',
  });
  const [weather, setWeather] = useState({ temp: 24, icon: '⛅', text: '⛅ 24°C' });
  const [currentTime, setCurrentTime] = useState(formatDateTimeGMT(new Date()));
  const [mapDataUrl, setMapDataUrl] = useState(null);

  // Ticking live clock for the overlay
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatDateTimeGMT(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update reverse geocoding, weather, and mini-map when coordinates change
  const updateLocationDetails = useCallback(async (lat, lng) => {
    if (lat == null || lng == null) return;
    try {
      const [details, wx, miniMap] = await Promise.all([
        reverseGeocodeDetails(lat, lng),
        fetchWeather(lat, lng),
        createMiniMapCanvas(lat, lng, 180, 150, 16),
      ]);

      setGeoDetails(details);
      setWeather(wx);
      mapCanvasRef.current = miniMap;
      try {
        setMapDataUrl(miniMap.toDataURL());
      } catch (err) {
        console.warn('MiniMap preview dataURL error:', err);
      }
    } catch (err) {
      console.error('Error updating location details:', err);
    }
  }, []);

  // Multi-tier Location Acquisition:
  // Starts IP Geolocation immediately in parallel with GPS so coordinates are instant
  useEffect(() => {
    let watchId = null;
    let isMounted = true;
    let hasGpsLocked = false;

    // Fast instant IP location lookup (runs immediately in parallel)
    const runFastIpLookup = async () => {
      try {
        const ipData = await fetchIPLocation();
        if (isMounted && !hasGpsLocked && ipData && ipData.lat && ipData.lng) {
          setCoords({ lat: ipData.lat, lng: ipData.lng, accuracy: 2500 });
          setLocationState((prev) => (prev === 'locked' ? 'locked' : 'fallback'));
          await updateLocationDetails(ipData.lat, ipData.lng);
        }
      } catch (err) {
        console.warn('Fast IP lookup error:', err);
      }
    };

    runFastIpLookup();

    // In parallel, request high-accuracy GPS if supported
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isMounted) return;
          hasGpsLocked = true;
          const { latitude, longitude, accuracy } = pos.coords;
          setCoords({ lat: latitude, lng: longitude, accuracy });
          setLocationState('locked');
          updateLocationDetails(latitude, longitude);
        },
        (err) => {
          console.warn('GPS position request failed or denied:', err.message);
          // If GPS fails or is denied, IP location is already active as fallback
          if (isMounted && !coords.lat) {
            runFastIpLookup();
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );

      // Continuous watch to refine accuracy
      try {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!isMounted) return;
            hasGpsLocked = true;
            const { latitude, longitude, accuracy } = pos.coords;
            setCoords({ lat: latitude, lng: longitude, accuracy });
            setLocationState('locked');
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
      } catch (watchErr) {
        console.warn('WatchPosition error:', watchErr);
      }
    }

    return () => {
      isMounted = false;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [updateLocationDetails]);

  // Camera stream handler
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraError(err.message || 'Permission denied');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture & Stamp Geotag Photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Ensure valid coordinates
    let currentLat = coords.lat;
    let currentLng = coords.lng;

    if (currentLat == null || currentLng == null) {
      const fallback = await fetchIPLocation();
      currentLat = fallback.lat;
      currentLng = fallback.lng;
    }

    // Ensure mini-map is ready
    let miniMapCanvas = mapCanvasRef.current;
    if (!miniMapCanvas) {
      miniMapCanvas = await createMiniMapCanvas(currentLat, currentLng, 180, 150, 16);
      mapCanvasRef.current = miniMapCanvas;
    }

    const captureTimestamp = formatDateTimeGMT(new Date());

    // Stamp the high-fidelity geotag banner
    drawGeotagBanner({
      ctx,
      width: canvas.width,
      height: canvas.height,
      lat: currentLat,
      lng: currentLng,
      placeName: geoDetails.placeName || 'Civic Location',
      street: geoDetails.street || `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`,
      weatherText: weather.text || '⛅ 24°C',
      timestamp: captureTimestamp,
      mapCanvas: miniMapCanvas,
    });

    // Package the geotag metadata to pass to parent
    const geotagData = {
      lat: currentLat,
      lng: currentLng,
      accuracy: coords.accuracy,
      city: geoDetails.city,
      country: geoDetails.country,
      placeName: geoDetails.placeName,
      street: geoDetails.street,
      state: geoDetails.state,
      district: geoDetails.district,
      fullAddress: geoDetails.fullAddress,
      weatherText: weather.text,
      timestamp: captureTimestamp,
      coordinatesText: formatCoordinates(currentLat, currentLng, 4),
    };

    // Convert canvas to image file
    canvas.toBlob(
      (blob) => {
        setIsCapturing(false);
        if (!blob) return;
        const file = new File([blob], `geotagged_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file, geotagData);
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between overflow-hidden select-none">
      {/* Flash effect on shutter */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Top Header Controls */}
      <div className="w-full px-4 pt-4 pb-3 flex justify-between items-center bg-gradient-to-b from-black/85 via-black/40 to-transparent z-20">
        <button
          type="button"
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full text-white backdrop-blur-md cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* GPS / Location Status Badge */}
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/15 bg-black/50 text-xs font-semibold text-white shadow-lg">
          {locationState === 'locked' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
              <span className="text-emerald-300">
                GPS Locked {coords.accuracy ? `(±${Math.round(coords.accuracy)}m)` : ''}
              </span>
            </>
          )}
          {locationState === 'fallback' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38BDF8]" />
              <span className="text-sky-300">Network Location Active</span>
            </>
          )}
          {locationState === 'acquiring' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-amber-300">Acquiring Location...</span>
            </>
          )}
          {locationState === 'denied' && (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300">Using Default Location</span>
            </>
          )}
        </div>

        {/* Camera Flip Button */}
        <button
          type="button"
          onClick={toggleCamera}
          className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full text-white backdrop-blur-md cursor-pointer"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* Camera Live Viewfinder / Error Screen */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden bg-black">
        {cameraError ? (
          <div className="flex flex-col items-center justify-center px-6 text-center max-w-md z-30">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Camera Permission Blocked</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Your browser has denied camera access. Please click the lock or camera icon in your browser URL address bar, allow camera permissions, and try again.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Upload Photo Instead
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Viewfinder frame guide */}
            <div className="absolute inset-6 sm:inset-10 border border-white/20 rounded-2xl pointer-events-none" />

            {/* LIVE GEOTAG BANNER OVERLAY PREVIEW (matching reference image) */}
            <div className="absolute bottom-6 left-3 right-3 sm:left-6 sm:right-6 max-w-2xl mx-auto shadow-2xl rounded-lg overflow-hidden border border-white/25 backdrop-blur-md">
              <div className="flex flex-row items-stretch h-[115px] sm:h-[135px]">
                {/* Left Mini-Map Preview */}
                <div className="w-[110px] sm:w-[140px] relative bg-slate-200 shrink-0 overflow-hidden flex items-center justify-center border-r border-white/20">
                  {mapDataUrl ? (
                    <img
                      src={mapDataUrl}
                      alt="Mini Map"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <MapPin className="w-7 h-7 text-red-500 animate-bounce" />
                      <span className="text-[10px] text-slate-600 font-bold mt-1">Map Loading</span>
                    </div>
                  )}
                </div>

                {/* Right Information Panel (Dark Translucent) */}
                <div className="flex-1 bg-black/75 p-2.5 sm:p-3.5 flex flex-col justify-between text-white overflow-hidden">
                  {/* Row 1: City Country & Weather */}
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-extrabold text-sm sm:text-lg tracking-tight truncate text-white drop-shadow">
                      {geoDetails.placeName || 'Civic Location'}
                    </h3>
                    <span className="text-xs sm:text-sm font-bold text-white shrink-0 drop-shadow ml-1">
                      {weather.text || '⛅ 24°C'}
                    </span>
                  </div>

                  {/* Row 2: Street / Locality */}
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-200 truncate drop-shadow">
                    {geoDetails.street || (coords.lat ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Locating street...')}
                  </p>

                  {/* Row 3: Coordinates */}
                  <p className="text-[11px] sm:text-xs font-bold text-white tracking-wide font-mono drop-shadow">
                    {formatCoordinates(coords.lat, coords.lng, 4)}
                  </p>

                  {/* Row 4: Live Date/Time & GMT */}
                  <p className="text-[10px] sm:text-xs font-bold text-slate-200 drop-shadow truncate">
                    {currentTime}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Shutter Controls */}
      <div className="w-full pb-8 pt-4 flex justify-center items-center bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={isCapturing || !!cameraError}
          onClick={capturePhoto}
          className="relative w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.6)] hover:shadow-[0_0_35px_rgba(255,255,255,0.9)] transition-all cursor-pointer disabled:opacity-50"
        >
          <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-black" />
          </div>
        </motion.button>
      </div>

      {/* Offscreen Canvas for Rendering Captured Geotag Photo */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default GeotagCamera;
