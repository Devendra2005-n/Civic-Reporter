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
          className="flex items-center gap-2 text-[#4B5563] hover:text-[#0284C7] transition-colors mb-6 group px-3.5 py-1.5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm hover:border-[#BAE6FD] hover:bg-[#F0F9FF]"
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-semibold text-xs">Back</span>
        </motion.button>
      </MagneticButton>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Visual Evidence Section */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="lg:col-span-3 rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] p-2 shadow-sm h-fit sticky top-28"
        >
          {/* Image Toggle Tabs */}
          {hasAfterImage && (
             <div className="flex rounded-xl overflow-hidden p-1 mb-2 bg-[#F3F4F6]">
               <div className="flex space-x-1 flex-1">
                 <button 
                   onClick={() => setShowAfterImage(false)}
                   className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                     !showAfterImage 
                       ? 'bg-white text-[#0284C7] shadow-sm border border-[#E5E7EB]' 
                       : 'text-[#6B7280] hover:text-[#0F172A]'
                   }`}
                 >
                   <ImageIcon className="w-3.5 h-3.5" />
                   <span>Before</span>
                 </button>
                 <button 
                   onClick={() => setShowAfterImage(true)}
                   className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                     showAfterImage 
                       ? 'bg-white text-[#16A34A] shadow-sm border border-[#E5E7EB]' 
                       : 'text-[#6B7280] hover:text-[#0F172A]'
                   }`}
                 >
                   <CheckCircle2 className="w-3.5 h-3.5" />
                   <span>After ✨</span>
                 </button>
               </div>
             </div>
          )}
          
          {/* Main Image Display */}
          <div className="relative aspect-[4/3] w-full bg-[#F3F4F6] rounded-xl overflow-hidden group cursor-zoom-in border border-[#E5E7EB]"
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mb-2 leading-tight">
              {complaint.problemType}
            </h1>
            
            {/* Meta Info Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B7280]">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#E5E7EB] shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                <span className="max-w-[200px] truncate text-[#334155] font-medium">
                  {complaint.locationAddress || 'Location not specified'}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#E5E7EB] shadow-sm">
                <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-[#334155] font-medium">{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>
              
              {complaint.userName && (
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#E5E7EB] shadow-sm">
                  <span className="text-xs">👤</span>
                  <span className="text-[#334155] font-medium">{complaint.userName}</span>
                </div>
              )}

              <button 
                onClick={() => {
                  copyToClipboard('#' + formatComplaintId(complaint));
                  setCopiedId(true);
                  setTimeout(() => setCopiedId(false), 2000);
                }}
                className="flex items-center gap-1.5 bg-[#F0F9FF] hover:bg-[#E0F2FE] px-3 py-1.5 rounded-full border border-[#BAE6FD] transition-colors group cursor-pointer"
                title="Copy Complaint ID"
              >
                <span className="font-mono text-xs font-bold text-[#0284C7]">#{formatComplaintId(complaint)}</span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#0284C7]" />
                )}
              </button>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <StatusTracker status={complaint.status} />
          </div>

          {/* Authority & Department Cards */}
          <div className="grid grid-cols-1 gap-3">
            {complaint.authorityBody && (
              <div className="flex items-center gap-3 p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#BAE6FD] flex items-center justify-center text-xl">
                  {authorityLabel.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-[#0284C7] font-semibold uppercase tracking-wider">Complaint Authority</p>
                  <p className="text-sm font-bold text-[#0F172A]">{complaint.authorityBody}</p>
                </div>
                <Shield className="w-4 h-4 text-[#0284C7]" />
              </div>
            )}

            {complaint.department && (
              <div className="flex items-center gap-3 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0284C7]" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider">Department</p>
                  <p className="text-sm font-bold text-[#0F172A]">{complaint.department}</p>
                </div>
              </div>
            )}
          </div>

          {/* Formal Letter Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-[#0F172A] uppercase tracking-wider">
                <FileText className="w-4 h-4 text-[#0284C7]" />
                <span>Formal Complaint Letter</span>
              </h3>
              
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-1.5 bg-white hover:bg-[#F0F9FF] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0284C7] transition-all border border-[#E5E7EB] hover:border-[#BAE6FD] shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl text-[#334155] leading-relaxed border border-[#E5E7EB] border-l-4 border-l-[#0284C7] shadow-sm">
              <div className="font-serif text-sm whitespace-pre-wrap">
                {complaint.formalLetter || complaint.description}
              </div>
            </div>

            {/* Translated Letter */}
            {complaint.translatedLetter && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold flex items-center gap-2 text-[#0F172A] uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-[#0284C7]" />
                  <span>Translated Version</span>
                </h3>
                <div className="bg-[#F9FAFB] p-5 rounded-2xl text-[#334155] leading-relaxed border border-[#E5E7EB] border-l-4 border-l-[#F97316] shadow-sm">
                  <div className="text-sm whitespace-pre-wrap">
                    {complaint.translatedLetter}
                  </div>
                </div>
              </div>
            )}

            {/* Additional User Issues */}
            {complaint.additionalIssues && complaint.additionalIssues.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold flex items-center gap-2 text-[#0F172A] uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-[#0284C7]" />
                  <span>Additional User Updates</span>
                </h3>
                <div className="space-y-3">
                  {complaint.additionalIssues.map((issue, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl text-[#334155] border border-[#E5E7EB] border-l-4 border-l-[#7C3AED] shadow-sm">
                      <p className="text-xs text-[#6B7280] mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(issue.addedAt).toLocaleString()}
                      </p>
                      <div className="whitespace-pre-wrap text-sm">
                        {issue.description}
                      </div>
                      {issue.imageUrl && (
                        <div className="mt-3">
                          <img src={issue.imageUrl} alt="Issue update" className="rounded-lg border border-[#E5E7EB] max-h-60 object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upvote Support Section */}
          <div className="pt-2">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#EF4444] fill-current" />
                  Support this issue
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {hasUpvoted 
                    ? 'You supported this! Click to undo.' 
                    : 'Upvotes help flag issues to authorities faster.'}
                </p>
              </div>
              
              <button 
                onClick={handleUpvote}
                disabled={upvoting}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm ${
                  hasUpvoted 
                    ? 'bg-[#16A34A] text-white' 
                    : 'bg-[#0284C7] hover:bg-[#0369A1] text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                <span>{hasUpvoted ? 'Supported' : 'Support'}</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-bold">{complaint.upvotes}</span>
              </button>
            </div>
          </div>

          {/* Citizen Resolution Badge & Button Section */}
          <div className="pt-1">
            {complaint.status === "Resolved" || complaint.status === "RESOLVED" ? (
              complaint.resolvedByType === "Citizen" ? (
                <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 bg-white border border-[#FDE68A] rounded-full flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#92400E]">Solved by Community Hero</h3>
                    <p className="text-xs text-[#B45309]">
                      <strong>{complaint.resolvedByUserName}</strong> resolved this issue for the community!
                    </p>
                    {complaint.resolutionRemarks && (
                      <p className="text-xs text-[#92400E] mt-1 italic">"{complaint.resolutionRemarks}"</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 bg-white border border-[#BBF7D0] rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#166534]">Resolved by Authority</h3>
                    <p className="text-xs text-[#15803D]">This issue has been officially resolved by municipal teams.</p>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-[#F0F9FF] rounded-xl border border-[#BAE6FD] p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#0284C7]" />
                    Did you solve this?
                  </p>
                  <p className="text-xs text-[#0369A1] mt-0.5">
                    If you or the community fixed this issue, claim credit as a Community Hero!
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (!isAuthenticated) return toast.error("Please login first!");
                    setShowCitizenResolveModal(true);
                  }}
                  className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  I Solved This!
                </button>
              </div>
            )}
          </div>
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
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white p-6 sm:p-8 rounded-2xl w-full max-w-md border border-[#E5E7EB] shadow-2xl relative max-h-[90vh] overflow-y-auto text-[#0F172A]"
            >
              <button 
                onClick={() => {
                  setShowCitizenResolveModal(false);
                  setCitizenResolveImage(null);
                  setCitizenResolveImagePreview(null);
                  setCitizenResolveRemarks('');
                }} 
                className="absolute top-5 right-5 text-[#6B7280] hover:text-[#0F172A] transition-colors"
              >
                <X className="w-5 h-5"/>
              </button>
              
              <h3 className="text-xl font-bold text-[#0F172A] mb-1 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#D97706]" />
                Community Resolution
              </h3>
              <p className="text-xs text-[#6B7280] mb-5">
                Upload a photo proving this issue has been resolved.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0284C7]" />
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
                    className="w-full text-xs text-[#6B7280] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F0F9FF] file:text-[#0284C7] hover:file:bg-[#E0F2FE] transition-all cursor-pointer"
                  />
                  {citizenResolveImagePreview && (
                    <div className="mt-3 relative w-full h-36 rounded-xl overflow-hidden border border-[#E5E7EB]">
                      <img src={citizenResolveImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setCitizenResolveImage(null);
                          setCitizenResolveImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Remarks</label>
                  <textarea 
                    value={citizenResolveRemarks} 
                    onChange={(e) => setCitizenResolveRemarks(e.target.value)} 
                    placeholder="How was it resolved?"
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] resize-none h-20" 
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowCitizenResolveModal(false);
                    setCitizenResolveImage(null);
                    setCitizenResolveImagePreview(null);
                    setCitizenResolveRemarks('');
                  }} 
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs border border-[#D1D5DB] text-[#334155] hover:bg-[#F9FAFB] transition-colors"
                  disabled={isSubmittingResolve}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCitizenResolve} 
                  disabled={isSubmittingResolve}
                  className="flex-1 py-2.5 px-4 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center"
                >
                  {isSubmittingResolve ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim Resolution'}
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
