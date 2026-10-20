import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getComplaintById, upvoteComplaint, citizenResolveComplaint, uploadImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ThumbsUp, MapPin, ArrowLeft, Clock, AlertTriangle, Image as ImageIcon, CheckCircle2, Building2, Shield, Download, Globe, Heart, X, ChevronLeft, ChevronRight, Share2, Maximize2, Copy, Check, FileText, Trophy, Loader2 } from 'lucide-react';
import StatusTracker from '../components/StatusTracker';
import MagneticButton from '../components/MagneticButton';
import TiltCard from '../components/TiltCard';
import html2pdf from 'html2pdf.js';
import exifr from 'exifr';
import { copyToClipboard } from '../utils/clipboard';
import { formatComplaintId } from '../utils/formatters';
import toast from 'react-hot-toast';

const AUTHORITY_LABELS = {
  gram_panchayat: { label: 'Gram Panchayat', icon: '🏡' },
  municipal_council: { label: 'Municipal Council', icon: '🏛️' },
  municipal_corporation: { label: 'Municipal Corporation', icon: '🏢' },
};

const Details = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [showAfterImage, setShowAfterImage] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [burstParticles, setBurstParticles] = useState([]);
  const [copiedId, setCopiedId] = useState(false);
  
  // Citizen Resolve State
  const [showCitizenResolveModal, setShowCitizenResolveModal] = useState(false);
  const [citizenResolveImage, setCitizenResolveImage] = useState(null);
  const [citizenResolveImagePreview, setCitizenResolveImagePreview] = useState(null);
  const [citizenResolveRemarks, setCitizenResolveRemarks] = useState('');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  const pdfRef = useRef();

  // Heart Burst Animation Component
  const HeartBurst = ({ x, y }) => {
    const particles = [...Array(12)].map((_, i) => ({
      id: i,
      angle: (i * 30) * (Math.PI / 180),
      distance: 50 + Math.random() * 50,
      scale: 0.5 + Math.random() * 0.5,
      color: ['#ef4444', '#f472b6', '#fb7185', '#fbbf24'][Math.floor(Math.random() * 4)],
    }));

    return (
      <div className="fixed pointer-events-none z-50" style={{ left: x - 20, top: y - 20 }}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(p.angle) * p.distance,
              y: Math.sin(p.angle) * p.distance,
              scale: [0, p.scale, 0],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute"
          >
            <Heart className="w-5 h-5 fill-current" style={{ color: p.color }} />
          </motion.div>
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 0] }}
          transition={{ duration: 0.5 }}
          className="absolute"
        >
          <Heart className="w-10 h-10 text-red-500 fill-current" />
        </motion.div>
      </div>
    );
  };

  // Image Gallery Lightbox
  const Lightbox = () => {
    const images = [
      { url: complaint?.imageUrl, label: 'Before' },
      ...(complaint?.afterImageUrl ? [{ url: complaint.afterImageUrl, label: 'After' }] : []),
    ].filter(Boolean);

    const nextImage = () => setLightboxIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
        onClick={() => setShowLightbox(false)}
      >
        <button
          className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          onClick={() => setShowLightbox(false)}
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={lightboxIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-5xl max-h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]?.url}
              alt={images[lightboxIndex]?.label}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-medium">
              {images[lightboxIndex]?.label}
            </div>
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </motion.div>
    );
  };

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const res = await getComplaintById(id);
        setComplaint(res.data);
        // Check if the current user has already upvoted
        if (user && res.data.upvotedBy) {
          setHasUpvoted(res.data.upvotedBy.includes(user.uid));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaint();
  }, [id, user]);

  const handleUpvote = async (e) => {
    if (upvoting) return;
    if (!isAuthenticated) {
      alert('Please login to upvote!');
      return;
    }
    
    // Trigger heart burst animation at click position
    if (e && !hasUpvoted) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const id = Date.now();
      setBurstParticles((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setBurstParticles((prev) => prev.filter((p) => p.id !== id));
      }, 1000);
    }
    
    setUpvoting(true);
    try {
      const res = await upvoteComplaint(id, user.uid);
      setComplaint(res.data);
      if (res.data.upvotedBy) {
        setHasUpvoted(res.data.upvotedBy.includes(user.uid));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpvoting(false);
    }
  };

  const handleCitizenResolve = async () => {
    if (!citizenResolveImage) {
      toast.error("Please upload a proof image.");
      return;
    }
    if (!citizenResolveRemarks.trim()) {
      toast.error("Please add some remarks about how it was solved.");
      return;
    }

    setIsSubmittingResolve(true);
    try {
      toast.loading("Uploading image...", { id: "resolveUpload" });
      const uploadRes = await uploadImage(citizenResolveImage);
      const uploadedUrl = uploadRes.data.imageUrl;
      
      toast.loading("Updating resolution...", { id: "resolveUpload" });
      const res = await citizenResolveComplaint(id, {
        proofImageUrl: uploadedUrl,
        remarks: citizenResolveRemarks
      });

      toast.success("Thank you! You are a Community Hero!", { id: "resolveUpload" });
      setComplaint(res.data);
      setShowCitizenResolveModal(false);
      setCitizenResolveImage(null);
      setCitizenResolveImagePreview(null);
      setCitizenResolveRemarks('');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to mark as resolved.", { id: "resolveUpload" });
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  const downloadPDF = () => {
    const element = pdfRef.current;
    if (!element) return;
    
    element.style.position = 'static';
    element.style.left = '0';
    element.style.opacity = '1';
    
    html2pdf().from(element).set({
      margin: [0.75, 0.75, 0.75, 0.75],
      filename: `Complaint_${complaint?.problemType || 'Report'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).save().then(() => {
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.opacity = '0';
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 text-white">
        <div className="w-12 h-12 border-4 border-purple-500 border-b-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen pt-24 px-6 text-center text-white">
        <h2 className="text-2xl font-bold bg-white/10 p-12 rounded-2xl glass-panel inline-block">Complaint Not Found</h2>
      </div>
    );
  }

  const hasAfterImage = complaint.status === 'Resolved' && complaint.afterImageUrl;
  const authorityLabel = AUTHORITY_LABELS[complaint.authorityType] || AUTHORITY_LABELS.municipal_corporation;

  return (
    <div className="min-h-screen pt-24 pb-24 px-6 max-w-6xl mx-auto">
      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && <Lightbox />}
      </AnimatePresence>
      
      {/* Heart Burst Particles */}
      {burstParticles.map((p) => (
        <HeartBurst key={p.id} x={p.x} y={p.y} />
      ))}
      {/* Hidden PDF Container */}
      <div
        ref={pdfRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: 'Georgia, "Times New Roman", serif',
          width: '7.5in',
          padding: '40px 50px',
          lineHeight: '1.8',
          fontSize: '13px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', color: '#1a1a1a' }}>FORMAL COMPLAINT</h2>
          <p style={{ fontSize: '11px', color: '#666' }}>Civic Issue Report — Smart Civic Reporter</p>
        </div>
        
        <div style={{ whiteSpace: 'pre-wrap', marginBottom: '25px', fontSize: '13px', lineHeight: '1.8' }}>
          {complaint.formalLetter || complaint.description || 'No complaint letter available.'}
        </div>

        {complaint.translatedLetter && (
          <div style={{ borderTop: '1px solid #ccc', marginTop: '30px', paddingTop: '20px' }}>
            <p style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Translated Version
            </p>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.8' }}>
              {complaint.translatedLetter}
            </div>
          </div>
        )}

        <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '15px', fontSize: '10px', color: '#999' }}>
          <p>Date: {new Date(complaint.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          {complaint.authorityBody && <p>Authority: {complaint.authorityBody}</p>}
          <p>Location: {complaint.locationAddress || 'Not specified'}</p>
          <p>Generated by Smart Civic Reporter</p>
        </div>
      </div>

      {/* Enhanced Back Button */}
      <MagneticButton strength={0.1}>
        <motion.button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group px-4 py-2 rounded-xl hover:bg-white/5"
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </motion.button>
      </MagneticButton>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Visual Evidence Section - Apple-level Gallery */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="lg:col-span-3 rounded-3xl overflow-hidden glass-premium border border-white/10 p-1.5 shadow-2xl h-fit sticky top-28"
        >
          {/* Image Toggle Tabs */}
          {hasAfterImage && (
             <div className="flex rounded-t-2xl overflow-hidden p-1.5 mb-1.5">
               <div className="flex bg-black/20 rounded-xl p-1 space-x-1 flex-1">
                 <motion.button 
                   onClick={() => setShowAfterImage(false)}
                   className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                     !showAfterImage 
                       ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                       : 'text-gray-400 hover:text-white hover:bg-white/5'
                   }`}
                   whileHover={{ scale: !showAfterImage ? 1 : 1.02 }}
                   whileTap={{ scale: 0.98 }}
                 >
                   <ImageIcon className="w-4 h-4" />
                   <span>Before</span>
                 </motion.button>
                 <motion.button 
                   onClick={() => setShowAfterImage(true)}
                   className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                     showAfterImage 
                       ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                       : 'text-gray-400 hover:text-white hover:bg-white/5'
                   }`}
                   whileHover={{ scale: showAfterImage ? 1 : 1.02 }}
                   whileTap={{ scale: 0.98 }}
                 >
                   <CheckCircle2 className="w-4 h-4" />
                   <span>After ✨</span>
                 </motion.button>
               </div>
             </div>
          )}
          
          {/* Main Image Display */}
          <div className="relative aspect-[4/3] w-full bg-slate-800/50 rounded-2xl overflow-hidden group cursor-zoom-in"
               onClick={() => setShowLightbox(true)}>
             <AnimatePresence mode="wait">
               <motion.div
                  key={showAfterImage ? 'after' : 'before'}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute inset-0"
               >
                 <img 
                    src={showAfterImage ? complaint.afterImageUrl : complaint.imageUrl} 
                    alt="Evidence" 
                    className="w-full h-full object-cover"
                 />
               </motion.div>
             </AnimatePresence>
             
             {/* Hover Overlay */}
             <motion.div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
             >
               <motion.div
                  initial={{ scale: 0.8 }}
                  whileHover={{ scale: 1 }}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-white font-medium"
               >
                 <Maximize2 className="w-5 h-5" />
                 <span>View Full Size</span>
               </motion.div>
             </motion.div>

             {/* Corner Badge */}
             <div className="absolute top-4 left-4">
               <motion.div 
                  className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${
                    complaint.severity === 'High' 
                      ? 'bg-red-500/30 border-red-500/50 text-red-300' 
                      : complaint.severity === 'Medium'
                        ? 'bg-yellow-500/30 border-yellow-500/50 text-yellow-300'
                        : 'bg-green-500/30 border-green-500/50 text-green-300'
                  }`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
               >
                 {complaint.severity} Priority
               </motion.div>
             </div>

             {/* Status Badge */}
             <div className="absolute top-4 right-4">
               <div className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${
                  complaint.status === 'Resolved'
                    ? 'bg-green-500/30 border-green-500/50 text-green-300'
                    : complaint.status === 'In Progress'
                      ? 'bg-blue-500/30 border-blue-500/50 text-blue-300'
                      : 'bg-orange-500/30 border-orange-500/50 text-orange-300'
                }`}>
                 {complaint.status}
               </div>
             </div>
          </div>

          {/* Thumbnail Strip */}
          {hasAfterImage && (
            <div className="flex gap-2 mt-2 px-1">
              {[complaint.imageUrl, complaint.afterImageUrl].map((img, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setShowAfterImage(idx === 1)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    showAfterImage === (idx === 1) 
                      ? 'border-blue-500 ring-2 ring-blue-500/30' 
                      : 'border-transparent hover:border-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {showAfterImage === (idx === 1) && (
                    <motion.div
                      layoutId="activeThumb"
                      className="absolute inset-0 border-2 border-blue-500 rounded-xl"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Text Details Section - Apple-Level UI */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Title Section */}
          <div>
            <motion.h1 
              className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {complaint.problemType}
            </motion.h1>
            
            {/* Meta Info Row */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <motion.div 
                className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="max-w-[200px] truncate">
                  {complaint.locationAddress || 'Location not specified'}
                </span>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                whileHover={{ scale: 1.02 }}
              >
                <Clock className="w-4 h-4 text-purple-400" />
                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </motion.div>
              
              {complaint.userName && (
                <motion.div 
                  className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="text-pink-400">👤</span>
                  <span>{complaint.userName}</span>
                </motion.div>
              )}

              <motion.button 
                onClick={() => {
                  copyToClipboard('#' + formatComplaintId(complaint));
                  setCopiedId(true);
                  setTimeout(() => setCopiedId(false), 2000);
                }}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors group"
                whileHover={{ scale: 1.02 }}
                title="Copy Complaint ID"
              >
                <span className="font-mono text-xs text-gray-300">ID: #{formatComplaintId(complaint)}</span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Status Timeline */}
          <motion.div 
            className="glass-premium p-5 rounded-2xl border border-white/10"
            whileHover={{ borderColor: 'rgba(255,255,255,0.15)' }}
          >
            <StatusTracker status={complaint.status} />
          </motion.div>

          {/* Authority & Department Cards */}
          <div className="grid grid-cols-1 gap-3">
            {complaint.authorityBody && (
              <motion.div 
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl"
                whileHover={{ scale: 1.01, borderColor: 'rgba(16,185,129,0.3)' }}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                  {authorityLabel.icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-emerald-400/70 font-medium uppercase tracking-wider">Complaint Authority</p>
                  <p className="text-sm font-semibold text-emerald-300">{complaint.authorityBody}</p>
                </div>
                <Shield className="w-5 h-5 text-emerald-400/50" />
              </motion.div>
            )}

            {complaint.department && (
              <motion.div 
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl"
                whileHover={{ scale: 1.01, borderColor: 'rgba(59,130,246,0.3)' }}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-blue-400/70 font-medium uppercase tracking-wider">Department</p>
                  <p className="text-sm font-semibold text-blue-300">{complaint.department}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Formal Letter Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-200">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span>Formal Complaint Letter</span>
              </h3>
              
              <motion.button 
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-blue-500/20 hover:border-blue-500/40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </motion.button>
            </div>

            <motion.div 
              className="glass-premium p-6 rounded-2xl text-gray-300 leading-relaxed border border-white/10 relative overflow-hidden"
              whileHover={{ borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
              <div className="pl-4 font-serif text-[15px] whitespace-pre-wrap">
                {complaint.formalLetter || complaint.description}
              </div>
            </motion.div>

            {/* Translated Letter */}
            {complaint.translatedLetter && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-200">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <span>Translated Version</span>
                </h3>
                <div className="glass-premium p-6 rounded-2xl text-gray-300 leading-relaxed border border-white/10">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500" />
                  <div className="pl-4 text-[15px] whitespace-pre-wrap">
                    {complaint.translatedLetter}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Additional User Issues */}
            {complaint.additionalIssues && complaint.additionalIssues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pt-2"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-purple-300">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span>Additional User Updates</span>
                </h3>
                <div className="space-y-4">
                  {complaint.additionalIssues.map((issue, idx) => (
                    <div key={idx} className="glass-premium p-6 rounded-2xl text-gray-300 border border-purple-500/20 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl" />
                      <p className="text-xs text-purple-400/80 mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(issue.addedAt).toLocaleString()}
                      </p>
                      <div className="pl-2 whitespace-pre-wrap text-[15px]">
                        {issue.description}
                      </div>
                      {issue.imageUrl && (
                        <div className="mt-4 pl-2">
                          <img src={issue.imageUrl} alt="Issue update" className="rounded-xl border border-white/10 max-h-60 object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Heart Burst Upvote Section */}
          <motion.div 
            className="pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="glass-premium rounded-2xl border border-white/10 relative">
              {/* Background with overflow-hidden for rounded corners */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 animate-pulse" />
              </div>
              
              <div className="relative z-10 p-6 flex flex-wrap items-center gap-6">
                <div className="text-center sm:text-left flex-1 min-w-[240px]">
                  <p className="font-bold text-lg text-white flex items-center justify-center sm:justify-start gap-2">
                    <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                    Support this issue
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {hasUpvoted 
                      ? 'You supported this! Click to undo.' 
                      : 'Upvotes help flag issues to authorities faster.'}
                  </p>
                </div>
                
                <div className="shrink-0 mx-auto sm:mr-0 sm:ml-auto">
                  <MagneticButton strength={0.2}>
                    <motion.button 
                      onClick={handleUpvote}
                      disabled={upvoting}
                      className={`relative flex items-center gap-3 px-8 py-4 rounded-2xl font-bold shadow-xl transition-all overflow-hidden group ${
                        hasUpvoted 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-green-500/30' 
                          : 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 shadow-pink-500/30'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                        initial={{ x: '-200%' }}
                        whileHover={{ x: '200%' }}
                        transition={{ duration: 0.6 }}
                      />
                      
                      <span className="relative flex items-center gap-2">
                        {upvoting ? (
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          <Heart className={`w-5 h-5 ${hasUpvoted ? 'fill-white' : ''}`} />
                        )}
                        <span className="text-xl">{complaint.upvotes}</span>
                      </span>
                      <span className="relative text-sm font-normal opacity-90 border-l border-white/30 pl-3">
                        {hasUpvoted ? 'Supported' : 'Support'}
                      </span>
                    </motion.button>
                    </MagneticButton>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Citizen Resolution Badge & Button Section */}
            <motion.div 
              className="pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {complaint.status === "Resolved" || complaint.status === "RESOLVED" ? (
                complaint.resolvedByType === "Citizen" ? (
                  <div className="glass-premium rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-yellow-400">Solved by Community Hero</h3>
                      <p className="text-sm text-gray-300">
                        <strong>{complaint.resolvedByUserName}</strong> stepped up and resolved this issue for the community!
                      </p>
                      {complaint.resolutionRemarks && (
                        <p className="text-sm text-gray-400 mt-2 italic">"{complaint.resolutionRemarks}"</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-premium rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-400">Resolved by Authority</h3>
                      <p className="text-sm text-gray-300">This issue has been officially resolved by the authorities.</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="glass-premium rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 flex flex-wrap items-center gap-6">
                  <div className="text-center sm:text-left flex-1 min-w-[240px]">
                    <p className="font-bold text-lg text-white flex items-center justify-center sm:justify-start gap-2">
                      <Trophy className="w-5 h-5 text-blue-400" />
                      Did you solve this?
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      If you or the community fixed this issue, claim credit as a Community Hero!
                    </p>
                  </div>
                  <div className="shrink-0 mx-auto sm:mr-0 sm:ml-auto">
                    <button 
                      onClick={() => {
                        if (!isAuthenticated) return toast.error("Please login first!");
                        setShowCitizenResolveModal(true);
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      I Solved This!
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Citizen Resolution Modal */}
        <AnimatePresence>
          {showCitizenResolveModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#0B0F19] p-8 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => {
                    setShowCitizenResolveModal(false);
                    setCitizenResolveImage(null);
                    setCitizenResolveImagePreview(null);
                    setCitizenResolveRemarks('');
                  }} 
                  className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5"/>
                </button>
                
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  Community Resolution
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  Upload a photo proving this issue has been resolved.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Proof Photo (Required)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setCitizenResolveImage(file);
                          setCitizenResolveImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all cursor-pointer"
                    />
                    {citizenResolveImagePreview && (
                      <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden border border-white/10">
                        <img src={citizenResolveImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            setCitizenResolveImage(null);
                            setCitizenResolveImagePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Remarks</label>
                    <textarea 
                      value={citizenResolveRemarks} 
                      onChange={(e) => setCitizenResolveRemarks(e.target.value)} 
                      placeholder="How was it resolved?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24" 
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowCitizenResolveModal(false);
                      setCitizenResolveImage(null);
                      setCitizenResolveImagePreview(null);
                      setCitizenResolveRemarks('');
                    }} 
                    className="flex-1 py-3 px-4 rounded-xl font-bold border border-white/10 text-white hover:bg-white/5 transition-colors"
                    disabled={isSubmittingResolve}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCitizenResolve} 
                    disabled={isSubmittingResolve}
                    className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center"
                  >
                    {isSubmittingResolve ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Claim Resolution'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

export default Details;
