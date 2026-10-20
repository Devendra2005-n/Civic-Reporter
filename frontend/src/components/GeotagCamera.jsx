import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import useUserLocation from '../hooks/useLocation';

const GeotagCamera = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [address, setAddress] = useState('Fetching address...');
  const location = useUserLocation();

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access is required for geotagging. Please allow camera access in your browser settings.");
      onClose();
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  useEffect(() => {
    if (location?.address) {
      setAddress(location.address);
    } else if (location?.lat && location?.lng) {
      setAddress(`Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`);
    }
  }, [location]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw overlay background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    const overlayHeight = 100;
    ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);
    
    // Draw Timestamp & Coordinates
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textBaseline = 'top';
    const timestamp = new Date().toLocaleString();
    ctx.fillText(timestamp, 15, canvas.height - 85);
    
    if (location?.lat && location?.lng) {
      ctx.fillText(`GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`, 15, canvas.height - 55);
    }
    
    ctx.font = '16px Arial';
    ctx.fillText(address || '', 15, canvas.height - 25);
    
    // Convert to file
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `geotagged_${Date.now()}.webp`, { type: 'image/webp' });
      onCapture(file);
    }, 'image/webp', 0.9);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
        <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition text-white">
          <X className="w-6 h-6" />
        </button>
        <button onClick={toggleCamera} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition text-white">
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="min-w-full min-h-full object-cover"
        />
        
        {/* Overlay Preview */}
        <div className="absolute bottom-32 left-4 right-4 bg-black/60 rounded-xl p-4 backdrop-blur-sm border border-white/20 text-white">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-1" />
            <div>
              <p className="font-bold text-sm">{new Date().toLocaleString()}</p>
              {(location?.lat && location?.lng) ? (
                <p className="text-sm font-mono text-blue-300">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-sm text-yellow-400 animate-pulse">Acquiring GPS...</p>
              )}
              <p className="text-xs text-gray-300 mt-1 truncate max-w-[250px]">{address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center bg-gradient-to-t from-black to-transparent">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={capturePhoto}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.5)]"
        >
          <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-black" />
          </div>
        </motion.button>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default GeotagCamera;
