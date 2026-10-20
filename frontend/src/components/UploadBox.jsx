import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Image as ImageIcon, X, Camera } from 'lucide-react';
import GeotagCamera from './GeotagCamera';

const UploadBox = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
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

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload(file, url);
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
    if (inputRef.current) inputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onUpload(null, null);
  };

  const handleCameraCapture = (e) => {
    e.stopPropagation();
    setShowCamera(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      {showCamera && (
        <GeotagCamera 
          onCapture={(file) => {
            setShowCamera(false);
            processFile(file);
          }} 
          onClose={() => setShowCamera(false)} 
        />
      )}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`relative bg-[#0B0F19] rounded-3xl p-10 border-2 transition-all duration-300 ${
          dragActive 
            ? "border-blue-400 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.3)]" 
            : "border-dashed border-white/20 hover:border-blue-400/50 hover:bg-white/5 pointer-events-auto shadow-2xl shadow-black/50"
        } cursor-pointer min-h-[360px] flex flex-col items-center justify-center text-center overflow-hidden`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {/* Decorative corner glows */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 blur-2xl rounded-full"></div>

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
              className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden group shadow-lg"
            >
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <button 
                  onClick={removeImage}
                  className="bg-red-500/90 text-white p-4 rounded-full hover:bg-red-500 shadow-xl shadow-red-500/20 transform hover:scale-110 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center space-y-5"
            >
              <motion.div 
                animate={dragActive ? { y: -10, scale: 1.1 } : { y: 0, scale: 1 }}
                className="p-5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full inline-block backdrop-blur-md border border-white/10 shadow-lg"
              >
                <UploadCloud className="w-14 h-14 text-blue-400" />
              </motion.div>
              <div>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400 mb-2">
                  Drop evidence here
                </p>
                <p className="text-base text-gray-400 font-medium">or click to browse your files</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
                <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  <ImageIcon className="w-4 h-4" />
                  <span>JPG, PNG up to 10MB</span>
                </div>
                
                <button
                  onClick={handleCameraCapture}
                  className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 rounded-full border border-blue-500/30 hover:from-blue-600/50 hover:to-purple-600/50 transition-all font-semibold hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo</span>
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
