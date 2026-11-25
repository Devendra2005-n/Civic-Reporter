import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Image as ImageIcon, X, Camera, MapPin } from 'lucide-react';
import GeotagCamera from './GeotagCamera';

const UploadBox = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [geotagMeta, setGeotagMeta] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file, geotagData = null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setGeotagMeta(geotagData);
    onUpload(file, url, geotagData);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setPreview(null);
    setGeotagMeta(null);
    if (inputRef.current) inputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onUpload(null, null, null);
  };

  const handleCameraCapture = (e) => {
    e.stopPropagation();
    setShowCamera(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      {showCamera && (
        <GeotagCamera 
          onCapture={(file, geotagData) => {
            setShowCamera(false);
            processFile(file, geotagData);
          }} 
          onClose={() => setShowCamera(false)} 
        />
      )}
      <motion.div
        whileHover={{ scale: 1.005 }}
        className={`relative bg-white/90 backdrop-blur-md rounded-2xl p-10 border-2 transition-all duration-300 ${
          dragActive 
            ? "border-[#0284C7] bg-[#F0F9FF] shadow-lg" 
            : "border-dashed border-[#CBD5E1] hover:border-[#0284C7] hover:bg-white/95 pointer-events-auto shadow-md"
        } cursor-pointer min-h-[360px] flex flex-col items-center justify-center text-center overflow-hidden`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {/* Standard file picker */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {/* Camera capture input (Android/iOS) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          className="hidden"
        />

        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
          {preview ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden group shadow-sm border border-[#E5E7EB]"
            >
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
              />

              {/* Geotag Indicator Pill */}
              {geotagMeta && (
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-1.5 border border-white/20 text-white text-xs font-semibold shadow-lg pointer-events-none">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Geotagged: {geotagMeta.coordinatesText || `${geotagMeta.lat?.toFixed(4)}, ${geotagMeta.lng?.toFixed(4)}`}</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <button 
                  onClick={removeImage}
                  className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 shadow-md transform hover:scale-110 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center space-y-4"
            >
              <motion.div 
                animate={dragActive ? { y: -6, scale: 1.05 } : { y: 0, scale: 1 }}
                className="p-5 bg-[#F0F9FF] rounded-2xl inline-block border border-[#BAE6FD]"
              >
                <UploadCloud className="w-12 h-12 text-[#0284C7]" />
              </motion.div>
              <div>
                <p className="text-xl font-bold text-[#0F172A] mb-1">
                  Drop evidence here
                </p>
                <p className="text-sm text-[#6B7280]">or click to browse your files</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-4">
                <div className="flex items-center space-x-2 text-xs font-medium text-[#6B7280] bg-[#F3F4F6] px-3.5 py-1.5 rounded-full border border-[#E5E7EB]">
                  <ImageIcon className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>JPG, PNG up to 10MB</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#0284C7] text-white rounded-full hover:bg-[#0369A1] transition-all text-xs font-semibold shadow-sm cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Geotag Photo</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UploadBox;
