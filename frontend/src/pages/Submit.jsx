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
import { useLanguage } from '../context/LanguageContext';
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

const mapContainerStyle = { width: '100%', height: '300px', borderRadius: '1rem', position: 'relative' };
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
  const { t } = useLanguage();
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

  const handleUpload = async (uploadedFile, url, geotagData = null) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setPreview(url);
    setImageValidation(null);
    setRateLimitError(null);
    setExifStatus('idle');
    setStep(2);
    
    let exifPromise = Promise.resolve();
    
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

      // If geotag camera provided location, use it directly
      if (geotagData && geotagData.lat != null && geotagData.lng != null) {
        const lat = geotagData.lat;
        const lng = geotagData.lng;
        console.log(`✅ GEOTAG CAMERA GPS found: ${lat}, ${lng}`);

        const address = {
          state: geotagData.state || '',
          district: geotagData.district || '',
          city: geotagData.city || '',
          area: geotagData.street || '',
          fullAddress: geotagData.fullAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };

        setExifStatus('found');
        setExifSource('EXIF_GPS');
        setExifAddress(address);
        setLocationSource('EXIF_GPS');

        const newPos = { lat, lng };
        setMapCenter(newPos);
        setMarkerPos(newPos);
        handleDetectAuthority(lat, lng);

        toast.success('📍 Location captured from geotag photo!', { duration: 3000 });
      } else {
        // ✅ EXIF LOCATION EXTRACTION — CLIENT-SIDE FIRST (most reliable on mobile)
        // Parse EXIF directly from the File object in the browser.
        // This is critical because mobile browsers may strip EXIF during HTTP upload.
        setExifStatus('detecting');
        exifPromise = (async () => {
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
      }

      // Ensure browser location is available for AI context
      let locationAddress = geotagData?.fullAddress || location.address || '';
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

  const steps = [
    t('step_upload', 'Upload'), 
    t('step_analyze', 'Analyze'), 
    t('step_submit', 'Submit')
  ];

  // Enhanced Stepper Component
  const Stepper = () => {
    return (
      <div className="flex items-center justify-center mb-10">
        <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-[#E5E7EB] shadow-sm">
          {steps.map((s, idx) => {
            const num = idx + 1;
            const isActive = step === num;
            const isCompleted = step > num;
            
            return (
              <div key={s} className="flex items-center">
                <div className="relative">
                  <div className={`flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                    isActive 
                      ? 'bg-[#0284C7] text-white shadow-sm' 
                      : isCompleted 
                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                        : 'bg-[#F9FAFB] text-[#6B7280]'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isActive ? 'bg-white/20' : 'bg-[#E5E7EB]'
                        }`}>
                          {num}
                        </span>
                        <span className="hidden sm:inline">{s}</span>
                      </span>
                    )}
                  </div>
                </div>
                
                {idx < steps.length - 1 && (
                  <div className="w-8 h-0.5 mx-1.5 bg-[#E5E7EB]">
                    <div className={`h-full ${isCompleted ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}`} />
                  </div>
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
        <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-md mb-6 border border-[#E5E7EB] bg-white">
          <img src={preview} className="w-full h-full object-cover" alt="Analyzing" />
          
          {/* Subtle light overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/20" />
          
          {/* Scanning line */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0284C7] to-transparent shadow-[0_0_15px_rgba(2,132,199,0.8)]"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#38BDF8]" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#38BDF8]" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#38BDF8]" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#38BDF8]" />
          
          {/* AI Status Badge */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <motion.div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#BAE6FD] shadow-sm"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Cpu className="w-3.5 h-3.5 text-[#0284C7] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#0284C7]">Analyzing Issue...</span>
            </motion.div>
          </div>
        </div>
        
        {/* Analysis text */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#0284C7]">
            <ScanLine className="w-4 h-4 animate-spin" />
            <span className="text-sm font-semibold">Scanning image with AI model...</span>
          </div>
          
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#0284C7]"
                animate={{ 
                  scale: [1, 1.4, 1],
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
    <div className="min-h-screen pt-6 sm:pt-8 px-4 sm:px-6 relative max-w-5xl mx-auto pb-20">
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
            className="text-3xl sm:text-4xl font-extrabold mb-2 text-center text-[#0F172A]"
          >
            {t('nav_report')}
          </motion.h1>
          <p className="text-[#6B7280] text-center mb-6 text-sm">{t('submit_upload_sub', 'Upload a photo, and our AI will document the rest.')}</p>
          
          {/* Image Validation Error Banner */}
          {imageValidation && !imageValidation.isValid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mb-6 bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex items-start space-x-3 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#991B1B]">Invalid Image Detected</h4>
                <p className="text-xs text-[#DC2626] mt-0.5">{imageValidation.reason}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">Detected: {imageValidation.detectedContent}</p>
                <p className="text-xs text-[#6B7280] mt-2">Please upload a valid civic issue image (pothole, garbage, broken streetlight, drainage, etc.)</p>
              </div>
            </motion.div>
          )}

          {/* Rate Limit Error Banner */}
          {rateLimitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mb-6 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex items-start space-x-3 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#92400E]">Daily Limit Reached</h4>
                <p className="text-xs text-[#B45309] mt-0.5">{rateLimitError.message}</p>
                <p className="text-xs text-[#6B7280] mt-1">You have submitted {rateLimitError.currentCount}/{rateLimitError.dailyLimit} complaints today. Try again tomorrow.</p>
              </div>
            </motion.div>
          )}

          {/* Reputation Block Banner */}
          {reputationBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mb-6 bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex items-start space-x-3 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#991B1B]">Account Restricted</h4>
                <p className="text-xs text-[#DC2626] mt-0.5">Your account has been restricted due to too many invalid or spam complaints.</p>
                <p className="text-xs text-[#6B7280] mt-1">Contact admin to restore your submission privileges.</p>
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
            className="bg-white p-6 sm:p-8 rounded-2xl max-w-4xl mx-auto space-y-8 border border-[#E5E7EB] shadow-sm text-[#0F172A]"
          >
            {/* Duplicate warning banner */}
            {duplicateWarning && duplicateResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex items-start space-x-3 cursor-pointer hover:bg-[#FEF3C7] transition-all shadow-sm"
                onClick={() => setShowDuplicateModal(true)}
              >
                <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[#92400E]">{duplicateResults.length} Similar Complaint{duplicateResults.length !== 1 ? 's' : ''} Found</h4>
                  <p className="text-xs text-[#B45309] mt-0.5">
                    Our AI detected existing reports that match yours ({duplicateResults[0]?.similarityPercent}% similarity). Help avoid duplicates by supporting them.
                  </p>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowDuplicateModal(true); }}
                    className="inline-flex items-center space-x-1.5 mt-2 px-3 py-1.5 bg-white text-[#92400E] hover:bg-[#FDE68A] border border-[#FDE68A] rounded-lg transition-all font-semibold text-xs shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Review & Upvote Existing</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Top Analysis Header */}
            <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-[#E5E7EB]">
              <div className="w-full md:w-1/4 rounded-xl overflow-hidden shadow-sm border border-[#E5E7EB] relative h-36 flex-shrink-0">
                <img src={preview} alt="Thumb" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur text-[10px] font-bold rounded text-white">
                  Evidence
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-[#0F172A]">
                  {aiData?.aiFallback ? 'Template Generated' : 'AI Analysis Complete'}
                </h3>
                {aiData?.aiFallback && (
                  <p className="text-xs text-[#D97706] mt-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    AI temporarily unavailable — please review and edit the details below
                  </p>
                )}
                {aiData && (
                  <div className="mt-3 bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] flex flex-col">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-xs text-[#6B7280] font-medium">Confidence Score</span>
                      <span className="text-sm font-bold text-[#0284C7]">{Math.round((aiData.confidence || 0) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((aiData.confidence || 0) * 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-[#0284C7] rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== AUTHORITY DETECTION SECTION ===== */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#6B7280] flex items-center space-x-1.5 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Detected Authority</span>
              </label>
              
              {authorityLoading ? (
                <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#6B7280] text-xs">Detecting local authority...</span>
                </div>
              ) : authorityInfo ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Authority Badge */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF]">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {AUTHORITY_TYPES.find(a => a.value === authorityInfo.authorityType)?.icon || '🏛️'}
                      </span>
                      <div>
                        <p className="font-bold text-[#0F172A] text-sm">{authorityInfo.authorityBody}</p>
                        <p className="text-xs text-[#6B7280]">
                          {authorityInfo.authorityTitle} • {authorityInfo.displayAddress}
                        </p>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-[#0284C7] border border-[#BAE6FD]">
                      {authorityInfo.confidence}% Confidence
                    </div>
                  </div>

                  {/* Manual Override */}
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-[#6B7280] whitespace-nowrap">Not correct? Override:</span>
                    <div className="flex space-x-2 flex-1">
                      {AUTHORITY_TYPES.map(({ value, label, icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleAuthorityOverride(value)}
                          className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                            authorityOverride === value
                              ? 'bg-[#0284C7] border-[#0284C7] text-white shadow-sm'
                              : 'bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-[#F9FAFB]'
                          }`}
                        >
                          <span>{icon}</span>
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] text-xs">
                  Location needed to detect authority. Please enable location access.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Metadata & Map */}
              <div className="space-y-5">
                <div>
                  <LocationDetector
                    status={exifStatus}
                    source={exifSource}
                    address={exifAddress}
                    onManualSelect={() => {
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

                  <label className="block text-xs font-bold text-[#6B7280] mb-2 mt-4 flex items-center space-x-1.5 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Exact Location</span>
                  </label>
                  <div className="p-1.5 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] mb-2 overflow-hidden relative shadow-sm">
                    {!isLoaded ? (
                      <div className="h-[280px] w-full flex items-center justify-center bg-white"><Loader /></div>
                    ) : (
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={15}
                        options={{ disableDefaultUI: true, zoomControl: true, mapId: 'civic_map' }}
                        onLoad={(map) => setMapInstance(map)}
                      >
                        {markerPos && mapInstance && <AdvancedMarker map={mapInstance} position={markerPos} draggable={true} onDragEnd={onMarkerDragEnd} />}
                      </GoogleMap>
                    )}
                    <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-[#E5E7EB] text-xs shadow-md flex items-start space-x-2">
                       <MapPin className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                       <span className="flex-1 font-medium text-[#0F172A]">{authorityInfo?.displayAddress || location.address || "Drag marker to adjust location"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">Problem Type</label>
                    <input 
                      type="text" required
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition-all font-medium"
                      value={formData.problemType}
                      onChange={(e) => handleProblemTypeChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">Severity</label>
                    <select 
                      className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition-all font-medium"
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
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1.5 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Suggested Department</span>
                  </label>
                  <input 
                    type="text"
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Formal Letter + Language */}
              <div className="space-y-5">
                <div className="flex justify-between items-center mb-[-0.5rem]">
                  <label className="block text-xs font-bold text-[#6B7280] flex items-center space-x-1.5 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Formal Complaint</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={downloadPDF}
                    className="flex items-center space-x-1.5 bg-[#F0F9FF] hover:bg-[#E0F2FE] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0284C7] transition-all border border-[#BAE6FD]"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* English Letter */}
                <div className="bg-[#F9FAFB] text-[#1E293B] p-5 rounded-xl border border-[#E5E7EB] border-l-4 border-l-[#0284C7] shadow-sm relative">
                  <p className="text-[11px] text-[#6B7280] font-bold uppercase tracking-wider mb-2">English Document</p>
                  <textarea
                    value={formData.formalLetter || ""}
                    onChange={(e) => setFormData({...formData, formalLetter: e.target.value})}
                    rows="9"
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-normal resize-y leading-relaxed text-[#1E293B] focus:outline-none"
                  />
                </div>

                {/* Language Selector */}
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-[#0284C7] shrink-0" />
                  <span className="text-xs text-[#6B7280] whitespace-nowrap">Translate to:</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleTranslate(e.target.value)}
                    className="flex-1 bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] transition-all"
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
                    <div className="bg-[#F9FAFB] text-[#1E293B] p-5 rounded-xl border border-[#E5E7EB] border-l-4 border-l-[#F97316] shadow-sm relative">
                      <p className="text-[11px] text-[#6B7280] font-bold uppercase tracking-wider mb-2">
                        {LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName || ''} Document
                      </p>
                      {translating ? (
                        <div className="flex items-center space-x-2 py-6 justify-center">
                          <div className="w-4 h-4 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[#6B7280] text-xs">Translating to {LANGUAGES.find(l => l.code === selectedLanguage)?.name}...</span>
                        </div>
                      ) : (
                        <textarea
                          value={translatedLetter}
                          onChange={(e) => setTranslatedLetter(e.target.value)}
                          rows="7"
                          className="w-full bg-transparent border-none focus:ring-0 text-sm font-normal resize-y leading-relaxed text-[#1E293B] focus:outline-none"
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
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              className={`w-full py-4 rounded-xl text-base font-semibold flex justify-center text-white mt-8 transition-all shadow-sm ${
                isSubmitting ? 'bg-[#9CA3AF]' : 'bg-[#0284C7] hover:bg-[#0369A1]'
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-white p-8 sm:p-12 rounded-2xl max-w-xl mx-auto text-center border border-[#E5E7EB] shadow-sm relative"
          >
            {/* Success Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-[#16A34A]" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[#0F172A]">
              Complaint Submitted!
            </h2>
            
            <p className="text-sm text-[#4B5563] mb-6">
              Thank you for helping improve your city 🙌
            </p>
            
            {authorityInfo && (
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3.5 mb-5 text-left">
                <p className="text-[11px] text-[#6B7280] mb-0.5">Complaint addressed to</p>
                <p className="text-sm font-semibold text-[#0F172A] flex items-center space-x-2">
                  <span>{AUTHORITY_TYPES.find(a => a.value === authorityInfo.authorityType)?.icon}</span>
                  <span>{authorityInfo.authorityBody}</span>
                </p>
              </div>
            )}

            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5 text-left mb-6">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-3">
                <span className="text-xs text-[#6B7280] font-medium">Complaint ID</span>
                <div className="flex items-center bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
                  <div className="px-3 py-1.5 font-mono font-bold text-xs text-[#0F172A] select-all">
                    #{submittedId}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      try {
                        copyToClipboard('#' + submittedId);
                        toast.success('Complaint ID copied to clipboard!');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        toast.error('Failed to copy. Please select text manually.');
                      }
                    }}
                    className="px-2.5 py-1.5 bg-[#F0F9FF] hover:bg-[#E0F2FE] transition-colors flex items-center justify-center border-l border-[#E5E7EB] cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#0284C7]" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-start space-x-2 text-xs">
                <MapPin className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                <span className="text-[#4B5563] leading-relaxed">{authorityInfo?.displayAddress || location.address || 'User Specified Location'}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-white hover:bg-[#F9FAFB] text-[#334155] transition-all border border-[#D1D5DB] shadow-sm"
              >
                View Dashboard
              </button>
              
              <button 
                onClick={() => navigate('/my-complaints')} 
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-[#0284C7] hover:bg-[#0369A1] text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Track Status
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Submit;
