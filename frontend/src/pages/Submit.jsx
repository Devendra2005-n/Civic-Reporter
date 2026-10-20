import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, FileText, MapPin, Navigation, Building2, User, Download, CheckCircle2, ChevronRight, Globe, Shield, ChevronDown, Sparkles, ScanLine, Cpu, Zap, ArrowRight, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadBox from '../components/UploadBox';
import Loader from '../components/Loader';
import LocationDetector from '../components/LocationDetector';
import DuplicateModal from '../components/DuplicateModal';
import { analyzeImage, createComplaint, checkDuplicate, detectAuthority, translateLetter, checkCanSubmit, extractLocationFromImage, reverseGeocodeLocation } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useUserLocation from '../hooks/useLocation';
import exifr from 'exifr';
import { getDepartment } from '../utils/departments';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import AdvancedMarker from '../components/AdvancedMarker';
import html2pdf from 'html2pdf.js';
import MagneticButton from '../components/MagneticButton';
import TiltCard from '../components/TiltCard';
import { copyToClipboard } from '../utils/clipboard';
import { formatComplaintId } from '../utils/formatters';

const mapContainerStyle = { width: '100%', height: '300px', borderRadius: '1rem' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi as fallback

// Supported Indian languages for translation
const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
];

const AUTHORITY_TYPES = [
  { value: "gram_panchayat", label: "Gram Panchayat", icon: "🏘️", title: "The Sarpanch" },
  { value: "municipal_council", label: "Municipal Council", icon: "🏛️", title: "The Chief Officer" },
  { value: "municipal_corporation", label: "Municipal Corporation", icon: "🏙️", title: "The Municipal Commissioner" },
];

const Submit = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const location = useUserLocation();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateResults, setDuplicateResults] = useState([]);
  const [complaintEmbedding, setComplaintEmbedding] = useState(null);
  const [formData, setFormData] = useState({
    problemType: '',
    severity: 'Medium',
    description: '',
    formalLetter: '',
    department: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPos, setMarkerPos] = useState(null);
  const [submittedId, setSubmittedId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Image validation state
  const [imageValidation, setImageValidation] = useState(null);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [reputationBlocked, setReputationBlocked] = useState(false);

  // Authority detection state
  const [authorityInfo, setAuthorityInfo] = useState(null);
  const [authorityLoading, setAuthorityLoading] = useState(false);
  const [authorityOverride, setAuthorityOverride] = useState('');

  // Translation state
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedLetter, setTranslatedLetter] = useState('');
  const [translating, setTranslating] = useState(false);

  // EXIF location detection state
  const [exifStatus, setExifStatus] = useState('idle'); // 'idle' | 'detecting' | 'found' | 'not_found' | 'error'
  const [exifSource, setExifSource] = useState('');
  const [exifAddress, setExifAddress] = useState(null);
  const [locationSource, setLocationSource] = useState('BROWSER_GPS');

  const [mapInstance, setMapInstance] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    mapIds: ['civic_map'],
  });

  const pdfRef = useRef();

  // Auto-detect location on mount
  useEffect(() => {
    location.detectLocation();
  }, []);

  useEffect(() => {
    if (location.lat && location.lng) {
      setMapCenter({ lat: location.lat, lng: location.lng });
      setMarkerPos({ lat: location.lat, lng: location.lng });
      // Auto-detect authority when location is available
      handleDetectAuthority(location.lat, location.lng);
    }
  }, [location.lat, location.lng]);

  // Detect authority from coordinates
  const handleDetectAuthority = async (lat, lng) => {
    setAuthorityLoading(true);
    try {
      const res = await detectAuthority(lat, lng);
      setAuthorityInfo(res.data);
      setAuthorityOverride(res.data.authorityType);
    } catch (err) {
      console.error('Authority detection failed:', err);
    } finally {
      setAuthorityLoading(false);
    }
  };

  // Handle authority type override
  const handleAuthorityOverride = (newType) => {
    setAuthorityOverride(newType);
    if (authorityInfo) {
      const selected = AUTHORITY_TYPES.find(a => a.value === newType);
      const placeName = authorityInfo.address?.village || authorityInfo.address?.town || authorityInfo.address?.city || 'Unknown';
      
      const updatedInfo = {
        ...authorityInfo,
        authorityType: newType,
        authorityTitle: selected.title,
        authorityBody: `${selected.label} ${placeName}`,
        confidence: 100, // User manually confirmed
        detectionMethod: 'manual_override',
      };
      
      // Regenerate letter header
      const addr = authorityInfo.address || {};
      let letterHeader;
      if (newType === 'gram_panchayat') {
        const talukaLine = addr.taluka ? `Taluka ${addr.taluka},\n` : '';
        const districtLine = addr.district ? `District ${addr.district}` : '';
        const stateLine = addr.state ? `, ${addr.state}` : '';
        letterHeader = `To,\n${selected.title},\n${selected.label} ${placeName},\n${talukaLine}${districtLine}${stateLine}`;
      } else {
        const districtLine = addr.district ? `\nDistrict ${addr.district}` : '';
        const stateLine = addr.state ? `, ${addr.state}` : '';
        letterHeader = `To,\n${selected.title},\n${selected.label} ${placeName},${districtLine}${stateLine}`;
      }
      updatedInfo.letterHeader = letterHeader;
      
      setAuthorityInfo(updatedInfo);
    }
  };

  // Handle language translation
  const handleTranslate = async (langCode) => {
    setSelectedLanguage(langCode);
    if (langCode === 'en') {
      setTranslatedLetter('');
      return;
    }
    if (!formData.formalLetter) return;

    setTranslating(true);
    try {
      const res = await translateLetter(formData.formalLetter, langCode);
      setTranslatedLetter(res.data.translatedText);
    } catch (err) {
      console.error('Translation failed:', err);
      toast.error('Translation failed. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleUpload = async (uploadedFile, url) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setPreview(url);
    setImageValidation(null);
    setRateLimitError(null);
    setExifStatus('idle');
    setStep(2);
    
    try {
      // Check reputation before proceeding
      if (userData?.uid) {
        try {
          const repRes = await checkCanSubmit(userData.uid);
          if (!repRes.data.canSubmit) {
            setReputationBlocked(true);
            toast.error('Your account has been restricted due to too many invalid complaints.', { duration: 5000 });
            setStep(1);
            return;
          }
        } catch {}
      }

      // ✅ EXIF LOCATION EXTRACTION — CLIENT-SIDE FIRST (most reliable on mobile)
      // Parse EXIF directly from the File object in the browser.
      // This is critical because mobile browsers may strip EXIF during HTTP upload.
      setExifStatus('detecting');
      const exifPromise = (async () => {
        try {
          // Step 1: Try client-side EXIF parsing (instant, works on mobile)
          console.log('📍 Attempting client-side EXIF parse...');
          const exif = await exifr.parse(uploadedFile, {
            gps: true,
            tiff: true,
            xmp: true,
            iptc: true,
          }).catch(() => null);

          if (exif) {
            console.log('📍 Client EXIF keys:', Object.keys(exif).join(', '));
          }

          // Check for GPS coordinates in client-side EXIF
          if (exif && exif.latitude != null && exif.longitude != null) {
            const lat = exif.latitude;
            const lng = exif.longitude;
            console.log(`✅ CLIENT-SIDE EXIF GPS found: ${lat}, ${lng}`);

            // Reverse geocode to get structured address
            let address = { state: '', district: '', city: '', area: '', fullAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}` };
            try {
              const geoRes = await reverseGeocodeLocation(lat, lng);
              address = geoRes.data;
            } catch (geoErr) {
              console.warn('📍 Reverse geocode failed, using coords only:', geoErr.message);
            }

            setExifStatus('found');
            setExifSource('EXIF_GPS');
            setExifAddress(address);
            setLocationSource('EXIF_GPS');

            const newPos = { lat, lng };
            setMapCenter(newPos);
            setMarkerPos(newPos);
            handleDetectAuthority(lat, lng);

            toast.success('📍 Location detected from photo!', { duration: 3000 });
            return; // Done — no need for server fallback
          }

          // Step 2: Client didn't find GPS — try server-side (checks Plus Code, Address, etc.)
          console.log('📍 No client-side GPS, trying server extraction...');
          try {
            const serverRes = await extractLocationFromImage(uploadedFile);
            const serverData = serverRes.data;
            console.log('📍 Server EXIF result:', serverData);

            if (serverData.found) {
              setExifStatus('found');
              setExifSource(serverData.source);
              setExifAddress(serverData.address);
              setLocationSource(serverData.source);

              const newPos = { lat: serverData.latitude, lng: serverData.longitude };
              setMapCenter(newPos);
              setMarkerPos(newPos);
              handleDetectAuthority(serverData.latitude, serverData.longitude);

              toast.success('📍 Location detected from photo!', { duration: 3000 });
              return;
            }
          } catch (serverErr) {
            console.warn('📍 Server extraction failed:', serverErr.message);
          }

          // Step 3: Nothing found anywhere — fallback
          setExifStatus('not_found');
          setLocationSource('BROWSER_GPS');
          console.log('📍 No EXIF location — using browser GPS fallback');
        } catch (err) {
          console.error('📍 EXIF extraction error:', err);
          setExifStatus('error');
          setLocationSource('BROWSER_GPS');
        }
      })();

      // Ensure browser location is available for AI context
      let locationAddress = location.address || '';
      if (!locationAddress && !location.loading) {
        try {
          await location.detectLocation();
          await new Promise(r => setTimeout(r, 500));
        } catch {}
        locationAddress = location.address || '';
      }

      // Use the detected authority info if available
      const userName = userData?.name || '';
      const res = await analyzeImage(uploadedFile, { userName, locationAddress, authorityInfo });
      const data = res.data;

      setAiData(data);
      setFinalImageUrl(data.imageUrl);

      // ✅ IMAGE VALIDATION CHECK
      if (data.imageValidation && !data.imageValidation.isValid) {
        setImageValidation(data.imageValidation);
        toast.error(`❌ Invalid image: ${data.imageValidation.reason}`, { duration: 6000 });
        setStep(1);
        return;
      }
      setImageValidation(data.imageValidation);

      // Show toast if AI returned a fallback response (API quota/key issue)
      if (data.aiFallback) {
        toast('⚠️ AI analysis temporarily unavailable. A template complaint has been generated — please review and edit.', { icon: '🤖', duration: 6000 });
        setFormData({
          problemType: data.problemType || 'other',
          severity: data.severity || 'Medium',
          formalLetter: data.formalLetter || '',
          description: data.description || 'AI unavailable — please describe the issue manually',
          department: getDepartment(data.problemType || 'other'),
        });
      } else if (
        data.problemType === "None" ||
        (data.confidence || 0) < 0.5 ||
        !data.problemType
      ) {
        toast('⚠️ AI is not confident. Please select problem manually.', { icon: '🤔' });
        setFormData({
          problemType: '',
          severity: 'Medium',
          description: data.description || 'Issue reported manually',
          formalLetter: data.formalLetter || '',
          department: 'General Municipal Department',
        });
      } else {
        setFormData({
          problemType: data.problemType,
          severity: data.severity,
          formalLetter: data.formalLetter,
          description: data.description || "Issue reported by user",
          department: getDepartment(data.problemType),
        });
      }

      // Wait for EXIF to finish before duplicates check (uses the best location)
      await exifPromise.catch(() => {});

      // ✅ AI-based duplicate detection using semantic similarity
      try {
        const locationData = {
          state: exifAddress?.state || authorityInfo?.address?.state || '',
          district: exifAddress?.district || authorityInfo?.address?.district || '',
          city: exifAddress?.city || authorityInfo?.address?.city || authorityInfo?.address?.town || '',
          area: exifAddress?.area || authorityInfo?.address?.village || authorityInfo?.address?.suburb || '',
        };
        const dupeRes = await checkDuplicate(
          data.problemType,
          data.description || '',
          locationData
        );
        
        // Store the embedding for later use during submission (avoids recomputation)
        if (dupeRes.data.embedding) {
          setComplaintEmbedding(dupeRes.data.embedding);
        }

        if (dupeRes.data.duplicate && dupeRes.data.similarComplaints?.length > 0) {
          setDuplicateResults(dupeRes.data.similarComplaints);
          setDuplicateWarning(true);
          setShowDuplicateModal(true);
          // Don't block — user can still proceed from the modal
        } else {
          setDuplicateWarning(null);
          setDuplicateResults([]);
        }
      } catch (dupeErr) {
        console.warn('Duplicate check failed (non-blocking):', dupeErr.message);
        setDuplicateWarning(null);
      }

      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error('Error analyzing image: ' + (err.response?.data?.message || err.message));
      setStep(1);
    }
  };

  const handleProblemTypeChange = (value) => {
    setFormData({ ...formData, problemType: value, department: getDepartment(value) });
  };

  const onMarkerDragEnd = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    // Re-detect authority for new position
    handleDetectAuthority(lat, lng);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRateLimitError(null);
    try {
      const dataToSubmit = {
        ...formData,
        imageUrl: finalImageUrl || preview,
        userId: userData?.uid || '',
        userName: userData?.name || 'Anonymous',
        userEmail: userData?.email || '',
        location: {
          lat: markerPos?.lat || location.lat || 0,
          lng: markerPos?.lng || location.lng || 0,
          address: authorityInfo?.displayAddress || location.address || 'User Specified Location',
        },
        state: exifAddress?.state || authorityInfo?.address?.state || '',
        district: exifAddress?.district || authorityInfo?.address?.district || '',
        city: exifAddress?.city || authorityInfo?.address?.city || authorityInfo?.address?.town || '',
        area: exifAddress?.area || authorityInfo?.address?.village || authorityInfo?.address?.suburb || '',
        authorityType: authorityInfo?.authorityType || 'municipal_corporation',
        authorityBody: authorityInfo?.authorityBody || '',
        locationSource: locationSource || 'BROWSER_GPS',
        translatedLetter: translatedLetter || '',
        translatedLanguage: selectedLanguage !== 'en' ? selectedLanguage : '',
        // Pass validation data to backend
        imageValidation: imageValidation || {},
        // Pass user's actual GPS for location verification
        userLocation: {
          lat: location.lat || 0,
          lng: location.lng || 0,
        },
        // Pass embedding from duplicate check (avoids recomputation)
        embedding: complaintEmbedding || [],
      };
      const res = await createComplaint(dataToSubmit);
      setSubmittedId(formatComplaintId(res.data) || res.data?._id || 'CMP-10X');
      setShowDuplicateModal(false);
      setStep(4);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 429) {
        setRateLimitError(err.response.data);
        toast.error(`⛔ Rate limit: ${err.response.data.message}`, { duration: 5000 });
      } else {
        toast.error('Failed to submit complaint');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = () => {
    const element = pdfRef.current;
    if (!element) return;
    
    // Make visible for rendering
    element.style.position = 'static';
    element.style.left = '0';
    element.style.opacity = '1';
    
    html2pdf().from(element).set({
      margin: [0.75, 0.75, 0.75, 0.75],
      filename: `Complaint_${formData.problemType || 'Report'}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).save().then(() => {
      // Hide back after rendering
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.opacity = '0';
    });
  };

  // Get confidence color
  const getConfidenceColor = (conf) => {
    if (conf >= 80) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    if (conf >= 60) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
  };

  const steps = ["Upload", "Analyze", "Submit"];

  // Enhanced Stepper Component
  const Stepper = () => {
    return (
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-2xl border border-white/10">
          {steps.map((s, idx) => {
            const num = idx + 1;
            const isActive = step === num;
            const isCompleted = step > num;
            
            return (
              <div key={s} className="flex items-center">
                <motion.div 
                  className="relative"
                  whileHover={!isCompleted ? { scale: 1.05 } : {}}
                >
                  {/* Glow effect for active step */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-md"
                      animate={{ opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  
                  <div className={`relative flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                      : isCompleted 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          isActive ? 'bg-white/20' : 'bg-white/10'
                        }`}>
                          {num}
                        </span>
                        <span className="hidden sm:inline">{s}</span>
                      </span>
                    )}
                  </div>
                </motion.div>
                
                {idx < steps.length - 1 && (
                  <motion.div 
                    className="w-12 h-0.5 mx-2"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ originX: 0 }}
                  >
                    <div className={`h-full rounded-full ${
                      isCompleted ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-white/10'
                    }`} />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // AI Scanning Animation Component
  const AIScanningAnimation = () => {
    return (
      <div className="relative flex flex-col items-center">
        {/* Image with scanning effect */}
        <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl mb-8">
          <img src={preview} className="w-full h-full object-cover" alt="Analyzing" />
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/90 via-[#0B0F19]/50 to-[#0B0F19]/30" />
          
          {/* Scanning line */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60" />
          
          {/* AI Status Badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold text-cyan-300">AI Analyzing...</span>
            </motion.div>
          </div>
          
          {/* Scanning grid overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          </div>
        </div>
        
        {/* Analysis text */}
        <div className="text-center space-y-2">
          <motion.div
            className="flex items-center justify-center gap-2 text-cyan-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ScanLine className="w-5 h-5" />
            <span className="text-sm font-medium">Scanning image for issues...</span>
          </motion.div>
          
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-36 md:pt-40 px-6 relative max-w-5xl mx-auto pb-24">
      {/* Hidden PDF Container — always in DOM, positioned offscreen */}
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
          {formData.formalLetter || 'No complaint letter generated.'}
        </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '5px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>Incident Location Details</h3>
          <p style={{ fontSize: '12px', margin: '5px 0', color: '#555' }}>
            <strong>Address:</strong> {authorityInfo?.displayAddress || location.address || 'User Specified Location'}
          </p>
          {(markerPos?.lat || location.lat) ? (
            <>
              <p style={{ fontSize: '12px', margin: '5px 0', color: '#555' }}>
                <strong>Coordinates (Lat, Lng):</strong> {markerPos?.lat || location.lat}, {markerPos?.lng || location.lng}
              </p>
              <p style={{ fontSize: '12px', margin: '5px 0' }}>
                <a href={`https://www.google.com/maps/search/?api=1&query=${markerPos?.lat || location.lat},${markerPos?.lng || location.lng}`} target="_blank" rel="noreferrer" style={{ color: '#0066cc', textDecoration: 'underline' }}>
                  View Exact Location on Google Maps
                </a>
              </p>
            </>
          ) : null}
        </div>

        {translatedLetter && (
          <>
            <div style={{ borderTop: '1px solid #ccc', marginTop: '30px', paddingTop: '20px' }}>
              <p style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'Translation'} Version
              </p>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.8' }}>
                {translatedLetter}
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '15px', fontSize: '10px', color: '#999' }}>
          <p>Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          {authorityInfo && <p>Authority: {authorityInfo.authorityBody}</p>}
          <p>Location: {authorityInfo?.displayAddress || location.address || 'Not specified'}</p>
          <p>Generated by Smart Civic Reporter</p>
        </div>
      </div>

      {/* Enhanced Progress Stepper */}
      {step < 4 && <Stepper />}

      {step === 1 && (
        <motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold mb-2 text-center"
          >
            <span className="text-gradient">Report an Issue</span>
          </motion.h1>
          <p className="text-gray-400 text-center mb-4">Upload a photo, and our AI will document the rest.</p>
          
          {/* Image Validation Error Banner */}
          {imageValidation && !imageValidation.isValid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start space-x-4"
            >
              <AlertCircle className="w-7 h-7 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-lg font-bold text-red-400">❌ Invalid Image Detected</h4>
                <p className="text-sm text-red-200 mt-1">{imageValidation.reason}</p>
                <p className="text-xs text-red-300/60 mt-2">Detected: {imageValidation.detectedContent}</p>
                <p className="text-xs text-gray-400 mt-3">Please upload a valid civic issue image (pothole, garbage, broken streetlight, drainage, etc.)</p>
              </div>
            </motion.div>
          )}

          {/* Rate Limit Error Banner */}
          {rateLimitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 flex items-start space-x-4"
            >
              <AlertCircle className="w-7 h-7 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-lg font-bold text-orange-400">⛔ Daily Limit Reached</h4>
                <p className="text-sm text-orange-200 mt-1">{rateLimitError.message}</p>
                <p className="text-xs text-gray-400 mt-2">You have submitted {rateLimitError.currentCount}/{rateLimitError.dailyLimit} complaints today. Try again tomorrow.</p>
              </div>
            </motion.div>
          )}

          {/* Reputation Block Banner */}
          {reputationBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start space-x-4"
            >
              <AlertCircle className="w-7 h-7 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-lg font-bold text-red-400">🚫 Account Restricted</h4>
                <p className="text-sm text-red-200 mt-1">Your account has been restricted due to too many invalid or spam complaints.</p>
                <p className="text-xs text-gray-400 mt-2">Contact admin to restore your submission privileges.</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <UploadBox onUpload={handleUpload} />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center flex-col items-center mt-12"
          >
            <AIScanningAnimation />
          </motion.div>
        )}

        {step === 3 && (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-[#0B0F19] p-8 rounded-3xl max-w-4xl mx-auto space-y-8 border border-white/5"
          >
            {/* Duplicate warning banner — opens the detailed modal */}
            {duplicateWarning && duplicateResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start space-x-4 mb-6 shadow-lg shadow-amber-500/5 cursor-pointer hover:bg-amber-500/15 transition-all"
                onClick={() => setShowDuplicateModal(true)}
              >
                <AlertCircle className="w-7 h-7 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-amber-400">⚠️ {duplicateResults.length} Similar Complaint{duplicateResults.length !== 1 ? 's' : ''} Found</h4>
                  <p className="text-sm text-amber-200/80 mt-1">
                    Our AI detected existing reports that match yours ({duplicateResults[0]?.similarityPercent}% similarity). Help avoid duplicates by supporting them.
                  </p>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowDuplicateModal(true); }}
                    className="inline-flex items-center space-x-2 mt-3 px-4 py-2 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-xl transition-all font-semibold text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Review & Upvote Existing</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Top Analysis Header */}
            <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-white/10">
              <div className="w-full md:w-1/4 rounded-2xl overflow-hidden shadow-lg relative h-40 flex-shrink-0">
                <img src={preview} alt="Thumb" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur text-xs font-bold rounded-lg text-white">
                  Evidence
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className={`text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${aiData?.aiFallback ? 'from-amber-400 to-orange-400' : 'from-purple-400 to-pink-400'}`}>
                  {aiData?.aiFallback ? 'Template Generated' : 'AI Analysis Complete'}
                </h3>
                {aiData?.aiFallback && (
                  <p className="text-sm text-amber-300/80 mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    AI temporarily unavailable — please review and edit the details below
                  </p>
                )}
                {aiData && (
                  <div className="mt-4 bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm text-gray-400 font-medium tracking-wide">Confidence Score</span>
                      <span className="text-md font-bold text-purple-400">{Math.round((aiData.confidence || 0) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((aiData.confidence || 0) * 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== AUTHORITY DETECTION SECTION ===== */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-400 flex items-center space-x-2 uppercase tracking-wider">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Detected Authority</span>
              </label>
              
              {authorityLoading ? (
                <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-400 text-sm">Detecting local authority...</span>
                </div>
              ) : authorityInfo ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Authority Badge */}
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${getConfidenceColor(authorityInfo.confidence).bg} ${getConfidenceColor(authorityInfo.confidence).border}`}>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {AUTHORITY_TYPES.find(a => a.value === authorityInfo.authorityType)?.icon || '🏛️'}
                      </span>
                      <div>
                        <p className="font-bold text-white text-sm">{authorityInfo.authorityBody}</p>
                        <p className="text-xs text-gray-400">
                          {authorityInfo.authorityTitle} • {authorityInfo.displayAddress}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getConfidenceColor(authorityInfo.confidence).bg} ${getConfidenceColor(authorityInfo.confidence).text} border ${getConfidenceColor(authorityInfo.confidence).border}`}>
                      {authorityInfo.confidence}% Confidence
                    </div>
                  </div>

                  {/* Manual Override */}
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500 whitespace-nowrap">Not correct? Override:</span>
                    <div className="flex space-x-2 flex-1">
                      {AUTHORITY_TYPES.map(({ value, label, icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleAuthorityOverride(value)}
                          className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            authorityOverride === value
                              ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/10'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{icon}</span>
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {authorityInfo.confidence < 70 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
                      <p className="text-xs text-orange-300">Low confidence detection. Please verify the authority type above.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="glass-panel p-4 rounded-xl border border-white/10 text-gray-500 text-sm">
                  Location needed to detect authority. Please enable location access.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Metadata & Map */}
              <div className="space-y-6">
                <div>
                  {/* EXIF Location Detection Badge */}
                  <LocationDetector
                    status={exifStatus}
                    source={exifSource}
                    address={exifAddress}
                    onManualSelect={() => {
                      // Reset to browser location
                      if (location.lat && location.lng) {
                        setMapCenter({ lat: location.lat, lng: location.lng });
                        setMarkerPos({ lat: location.lat, lng: location.lng });
                        handleDetectAuthority(location.lat, location.lng);
                      }
                      setExifStatus('not_found');
                      setLocationSource('MANUAL');
                      toast('📍 Drag the marker to set location manually', { icon: '👆' });
                    }}
                  />

                  <label className="block text-sm font-semibold text-gray-400 mb-2 mt-4 flex items-center space-x-2 uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span>Exact Location</span>
                  </label>
                  <div className="glass-panel p-2 rounded-2xl border-white/5 mb-2 overflow-hidden relative">
                    {!isLoaded ? (
                      <div className="h-[300px] w-full flex items-center justify-center bg-white/5"><Loader /></div>
                    ) : (
                      <div style={{ filter: 'invert(90%) hue-rotate(180deg)', WebkitFilter: 'invert(90%) hue-rotate(180deg)' }}>
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={15}
                        options={{ disableDefaultUI: true, zoomControl: true, mapId: 'civic_map' }}
                        onLoad={(map) => setMapInstance(map)}
                      >
                        {markerPos && mapInstance && <AdvancedMarker map={mapInstance} position={markerPos} draggable={true} onDragEnd={onMarkerDragEnd} />}
                      </GoogleMap>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 right-4 bg-gray-900/80 backdrop-blur-md p-3 rounded-xl border border-white/10 text-sm shadow-xl flex items-start space-x-2">
                       <MapPin className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                       <span className="flex-1 font-medium">{authorityInfo?.displayAddress || location.address || "Drag marker to adjust location"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Problem Type</label>
                    <input 
                      type="text" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-semibold"
                      value={formData.problemType}
                      onChange={(e) => handleProblemTypeChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Severity</label>
                    <select 
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-semibold"
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    >
                      <option value="Low">Low - Not Urgent</option>
                      <option value="Medium">Medium - Needs Attention</option>
                      <option value="High">High - Emergency</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2 flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-green-400" />
                    <span>Suggested Department</span>
                  </label>
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Formal Letter + Language */}
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-[-0.5rem]">
                  <label className="block text-sm font-semibold text-gray-400 flex items-center space-x-2 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>Formal Complaint</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={downloadPDF}
                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-purple-500/20 hover:border-purple-500/40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* English Letter */}
                <div className="bg-black/40 text-gray-200 p-6 rounded-xl border border-white/10 shadow-inner overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">English Document</p>
                  <textarea
                    value={formData.formalLetter || ""}
                    onChange={(e) => setFormData({...formData, formalLetter: e.target.value})}
                    rows="10"
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium resize-y leading-relaxed focus:outline-none"
                    style={{ color: '#e5e7eb' }}
                  />
                </div>

                {/* Language Selector */}
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs text-gray-400 whitespace-nowrap">Translate to:</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleTranslate(e.target.value)}
                    className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Translated Letter */}
                {selectedLanguage !== 'en' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <div className="bg-black/40 text-gray-200 p-6 rounded-xl border border-white/10 shadow-inner overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
                        {LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName || ''} Document
                      </p>
                      {translating ? (
                        <div className="flex items-center space-x-3 py-8 justify-center">
                          <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-gray-500 text-sm">Translating to {LANGUAGES.find(l => l.code === selectedLanguage)?.name}...</span>
                        </div>
                      ) : (
                        <textarea
                          value={translatedLetter}
                          onChange={(e) => setTranslatedLetter(e.target.value)}
                          rows="8"
                          className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium resize-y leading-relaxed focus:outline-none"
                          style={{ color: '#e5e7eb' }}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <motion.button 
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full py-5 rounded-2xl text-lg font-bold flex justify-center text-white mt-8 transition-all ${
                isSubmitting ? 'bg-gray-600' : 
                duplicateWarning ? 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-xl shadow-amber-600/20 hover:shadow-amber-600/40' 
                : 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]'
              }`}
            >
              {isSubmitting ? 'Submitting to Authority...' : duplicateWarning ? 'Submit New Complaint' : 'Submit Official Complaint'}
            </motion.button>

            {/* Duplicate Detection Modal */}
            <DuplicateModal
              isOpen={showDuplicateModal}
              onClose={() => setShowDuplicateModal(false)}
              similarComplaints={duplicateResults}
              onSubmitAnyway={() => {
                setShowDuplicateModal(false);
                // Trigger form submit programmatically
                const fakeEvent = { preventDefault: () => {} };
                handleSubmit(fakeEvent);
              }}
              isSubmitting={isSubmitting}
            />
          </motion.form>
        )}

        {/* Status Step 4: Success Screen */}
        {step === 4 && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="glass-premium p-12 rounded-3xl max-w-xl mx-auto text-center relative overflow-hidden"
          >
            {/* Animated Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div 
                className="absolute top-0 right-0 w-96 h-96 bg-green-500/20 rounded-full blur-[100px]"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              />
            </div>

            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-green-400 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: '50%',
                }}
                animate={{
                  y: [-100, -200, -100],
                  x: [0, (i % 2 === 0 ? 30 : -30), 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
            
            {/* Success Icon */}
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="relative w-28 h-28 mx-auto mb-8"
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full"
                animate={{ 
                  boxShadow: [
                    '0 0 30px rgba(74,222,128,0.3)', 
                    '0 0 60px rgba(74,222,128,0.5)', 
                    '0 0 30px rgba(74,222,128,0.3)'
                  ] 
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-white" />
              </div>
              {/* Ring effect */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-400/30"
                animate={{ scale: [1, 1.3, 1.5], opacity: [0.5, 0.2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-extrabold mb-4 text-white"
            >
              Submitted!
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-gray-300 font-medium mb-6"
            >
              Thank you for helping improve your city 🙌
            </motion.p>
            
            {authorityInfo && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left"
              >
                <p className="text-xs text-gray-400 mb-1">Complaint addressed to</p>
                <p className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>{AUTHORITY_TYPES.find(a => a.value === authorityInfo.authorityType)?.icon}</span>
                  <span>{authorityInfo.authorityBody}</span>
                </p>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left mb-8"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <span className="text-gray-400 font-medium">Complaint ID</span>
                <div className="flex items-center bg-[#0f172a] border border-white/10 rounded-lg overflow-hidden shadow-inner">
                  <div className="px-4 py-2 font-mono font-bold text-white tracking-wider select-all">
                    #{submittedId}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      try {
                        copyToClipboard('#' + submittedId);
                        toast.success('Complaint ID copied to clipboard!', { position: 'bottom-center' });
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy', err);
                        toast.error('Failed to copy. Please select the text manually.');
                      }
                    }}
                    className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/40 transition-colors flex items-center justify-center border-l border-white/10 cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-gray-300 leading-relaxed font-medium">{authorityInfo?.displayAddress || location.address || 'User Specified Location'}</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex space-x-4"
            >
              <MagneticButton strength={0.15} className="flex-1">
                <motion.button 
                  onClick={() => navigate('/dashboard')} 
                  className="w-full py-4 px-6 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">View Dashboard</span>
                </motion.button>
              </MagneticButton>
              
              <MagneticButton strength={0.15} className="flex-1">
                <motion.button 
                  onClick={() => navigate('/my-complaints')} 
                  className="w-full py-4 px-6 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all relative overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500"
                    initial={{ x: '100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Track Status
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </MagneticButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Submit;
