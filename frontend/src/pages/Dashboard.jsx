import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import { GoogleMap, useJsApiLoader, InfoWindowF } from '@react-google-maps/api';
import AdvancedMarker from '../components/AdvancedMarker';
import { getComplaints, editComplaint, deleteComplaint } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import { 
  Filter, Layers, Clock, CheckCircle2, AlertTriangle, 
  Map as MapIcon, Plus, Shield, ArrowRight, Activity, 
  CheckCircle, Hourglass, AlertCircle, PhoneCall, BarChart2, 
  Lightbulb, Trash2, Droplets, ChevronRight, Building2,
  FileDown, Edit, User, X, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '12px' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 };

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1.5 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value || 0, {
        duration,
        onUpdate: (latest) => setDisplayValue(Math.round(latest)),
        ease: "easeOut"
      });
      return () => controls.stop();
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>{displayValue}</span>;
};

// Clean SaaS Stat Card
const StatCard = ({ value, label, icon: Icon, colorClass, borderClass, bgIconClass }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={`text-2xl sm:text-3xl font-extrabold ${colorClass}`}>
          <AnimatedCounter value={value} />
        </p>
      </div>
      <div className={`w-11 h-11 rounded-lg ${bgIconClass} ${borderClass} border flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userData, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scope, setScope] = useState(searchParams.get('tab') === 'my' ? 'my' : 'all');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [showMap, setShowMap] = useState(true);

  // Edit & Delete modal states
  const [selectedEditComplaint, setSelectedEditComplaint] = useState(null);
  const [editFormData, setEditFormData] = useState({ problemType: '', description: '' });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // PDF generation state
  const pdfRef = useRef(null);
  const [printingComplaint, setPrintingComplaint] = useState(null);

  // Synchronize scope with URL parameter if present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'my') {
      setScope('my');
    }
  }, [searchParams]);

  const handleScopeChange = (newScope) => {
    setScope(newScope);
    if (newScope === 'my') {
      setSearchParams({ tab: 'my' });
    } else {
      setSearchParams({});
    }
  };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    mapIds: ['civic_map'],
    libraries: ['marker']
  });

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await getComplaints();
        setComplaints(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  // Check if a complaint belongs to the currently logged in user
  const isComplaintOwned = (c) => {
    if (!user) return false;
    const userEmailNorm = (user.email || '').toLowerCase().trim();
    const cEmailNorm = (c.userEmail || '').toLowerCase().trim();
    return (
      c.userId === user.uid ||
      (userEmailNorm && cEmailNorm && userEmailNorm === cEmailNorm) ||
      (c.userName && userData?.name && c.userName.toLowerCase() === userData.name.toLowerCase())
    );
  };

  const myComplaintsCount = complaints.filter(isComplaintOwned).length;

  // Filter complaints by scope ('all' vs 'my')
  const scopedComplaints = scope === 'my'
    ? complaints.filter(isComplaintOwned)
    : complaints;

  const filtered = filter === 'All' 
    ? scopedComplaints 
    : scopedComplaints.filter(c => c.severity === filter || c.status === filter);

  // Edit actions
  const handleEditOpen = (complaint) => {
    setSelectedEditComplaint(complaint);
    setEditFormData({
      problemType: complaint.problemType || '',
      description: complaint.description || ''
    });
  };

  const handleEditSave = async () => {
    if (!editFormData.problemType.trim() || !editFormData.description.trim()) {
      toast.error('Title and description cannot be empty.');
      return;
    }
    setIsSubmittingEdit(true);
    try {
      const res = await editComplaint(selectedEditComplaint.id || selectedEditComplaint._id, editFormData);
      setComplaints(prev => prev.map(c => (c.id || c._id) === (selectedEditComplaint.id || selectedEditComplaint._id) ? res.data : c));
      toast.success('Complaint updated successfully!');
      setSelectedEditComplaint(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update complaint.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete actions
  const handleDeletePrompt = (complaint) => {
    setDeleteTarget(complaint);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteComplaint(deleteTarget.id || deleteTarget._id);
      setComplaints(prev => prev.filter(c => (c.id || c._id) !== (deleteTarget.id || deleteTarget._id)));
      toast.success('Complaint removed.');
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete complaint.');
    } finally {
      setIsDeleting(false);
    }
  };

  // PDF Download
  const handleDownloadPDF = (complaint) => {
    setPrintingComplaint(complaint);
    toast.loading('Generating formal PDF...', { id: 'pdf-gen' });
    setTimeout(() => {
      const element = pdfRef.current;
      if (!element) {
        toast.error('Could not prepare PDF.', { id: 'pdf-gen' });
        return;
      }
      html2pdf().from(element).set({
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `Complaint_${complaint.problemType || 'Report'}_${String(complaint.id || complaint._id).slice(-6)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      }).save().then(() => {
        toast.success('Complaint PDF downloaded!', { id: 'pdf-gen' });
        setPrintingComplaint(null);
      }).catch((err) => {
        console.error(err);
        toast.error('PDF generation failed.', { id: 'pdf-gen' });
        setPrintingComplaint(null);
      });
    }, 450);
  };

  // Stats calculation
  const totalCount = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const underReviewCount = complaints.filter(c => c.status === 'Pending' || c.status === 'Submitted' || c.status === 'Under Review').length;
  const highPriorityCount = complaints.filter(c => c.severity === 'High' && c.status !== 'Resolved').length;

  // Category breakdown calculation
  const getCategoryCount = (keyword) => {
    return complaints.filter(c => {
      const type = (c.problemType || '').toLowerCase();
      return type.includes(keyword);
    }).length;
  };

  const potholeCount = getCategoryCount('pothole');
  const streetlightCount = getCategoryCount('streetlight') || getCategoryCount('light');
  const garbageCount = getCategoryCount('garbage') || getCategoryCount('waste');
  const waterCount = getCategoryCount('water') || getCategoryCount('leak') || getCategoryCount('drain');

  const onMapLoad = useCallback((map) => {
    if (filtered.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      filtered.forEach(c => {
        if (c.location && c.location.lat && c.location.lng) {
          bounds.extend({ lat: c.location.lat, lng: c.location.lng });
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#334155] pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner / Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0284C7] mb-1">
          <span>Civic Reporter</span>
          <span>·</span>
          <span>Citizen Portal</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
              Welcome back{userData?.name ? `, ${userData.name}` : ''}!
            </h1>
            <p className="text-sm text-[#4B5563] mt-1">
              Let's make your community a better, cleaner, and safer place.
            </p>
          </div>

          {!isAdmin && (
            <Link
              to="/submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Report</span>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Action Callout Card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Report a Civic Issue</h2>
            <p className="text-xs sm:text-sm text-[#4B5563]">
              Spotted a pothole, open garbage dump, broken streetlight, or drainage issue? Help improve your city by reporting it.
            </p>
          </div>
        </div>
        <Link
          to="/submit"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-xs font-semibold transition-colors shrink-0"
        >
          <span>Report Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Stat Cards — Sky & Slate */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          value={totalCount} 
          label="Total Reports" 
          icon={Layers} 
          colorClass="text-[#0284C7]"
          borderClass="border-[#BAE6FD]"
          bgIconClass="bg-[#F0F9FF]"
        />
        <StatCard 
          value={resolvedCount} 
          label="Resolved" 
          icon={CheckCircle2} 
          colorClass="text-[#16A34A]"
          borderClass="border-[#BBF7D0]"
          bgIconClass="bg-[#F0FDF4]"
        />
        <StatCard 
          value={inProgressCount} 
          label="In Progress" 
          icon={Clock} 
          colorClass="text-[#D97706]"
          borderClass="border-[#FDE68A]"
          bgIconClass="bg-[#FFFBEB]"
        />
        <StatCard 
          value={underReviewCount} 
          label="Under Review" 
          icon={Hourglass} 
          colorClass="text-[#7C3AED]"
          borderClass="border-[#DDD6FE]"
          bgIconClass="bg-[#F5F3FF]"
        />
      </div>

      {/* High Priority Notice if any */}
      {highPriorityCount > 0 && (
        <div className="mb-8 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>{highPriorityCount} High Priority issue(s)</strong> require urgent attention from city municipal engineers.
            </span>
          </div>
          <button 
            onClick={() => setFilter('High')}
            className="text-rose-700 hover:text-rose-900 font-semibold underline shrink-0 cursor-pointer"
          >
            Filter High Priority
          </button>
        </div>
      )}

      {/* 2-Column Section: Issue Breakdown & Municipal Ward Desk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Column 1: Issue Breakdown */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#0284C7]" />
                <span>Issue Breakdown</span>
              </h3>
              <span className="text-xs font-semibold text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] px-2.5 py-0.5 rounded-full">
                {totalCount} Total
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                { name: 'Roads & Potholes', count: potholeCount, color: 'bg-[#F97316]', text: 'text-[#F97316]', icon: AlertTriangle },
                { name: 'Streetlights', count: streetlightCount, color: 'bg-[#D97706]', text: 'text-[#D97706]', icon: Lightbulb },
                { name: 'Waste & Sanitation', count: garbageCount, color: 'bg-[#16A34A]', text: 'text-[#16A34A]', icon: Trash2 },
                { name: 'Water & Drainage', count: waterCount, color: 'bg-[#0284C7]', text: 'text-[#0284C7]', icon: Droplets },
              ].map((cat) => {
                const pct = totalCount > 0 ? Math.round((cat.count / totalCount) * 100) : 0;
                return (
                  <div key={cat.name} className="text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-[#4B5563] flex items-center gap-1.5">
                        <cat.icon className={`w-3.5 h-3.5 ${cat.text}`} />
                        {cat.name}
                      </span>
                      <span className="font-semibold text-[#0F172A]">
                        {cat.count} <span className="text-[#9CA3AF] font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${cat.color} transition-all duration-500`} 
                        style={{ width: `${Math.max(pct, cat.count > 0 ? 5 : 0)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 2: Municipal Ward Desk */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0284C7]" />
                <span>Municipal Ward Desk</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                Active
              </span>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed mb-4">
              Direct municipal routing is active across all city wards. Standard high-priority resolution turnaround is <strong>under 48 hours</strong>.
            </p>

            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3 space-y-2.5 mb-4 text-xs">
              <div className="flex items-center justify-between text-[#334155]">
                <span className="text-[#6B7280] flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-[#0284C7]" /> Civic Helpline:
                </span>
                <span className="font-mono font-bold text-[#0F172A]">1800-123-2484</span>
              </div>
              <div className="flex items-center justify-between text-[#334155]">
                <span className="text-[#6B7280] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" /> Emergency Services:
                </span>
                <span className="font-mono font-bold text-[#DC2626]">112</span>
              </div>
            </div>
          </div>

          <Link
            to="/submit"
            className="w-full py-2.5 px-4 rounded-lg bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>File a New Grievance</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Interactive City Live Map Banner */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-[#0284C7]" />
            <h2 className="text-sm font-bold text-[#0F172A]">Live Issue Map</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
              {filtered.length} Locations Plotted
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Resolved
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> High Priority
              </span>
            </div>

            <button 
              onClick={() => setShowMap(!showMap)}
              className="text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] px-2.5 py-1 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD] hover:bg-[#E0F2FE] transition-colors cursor-pointer"
            >
              {showMap ? 'Collapse Map' : 'Expand Map'}
            </button>
          </div>
        </div>

        {showMap && (
          <div className="h-[280px] sm:h-[340px] rounded-lg overflow-hidden border border-[#E5E7EB] relative bg-[#F3F4F6]">
            {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#6B7280]">
                Loading map...
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={12}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  gestureHandling: 'cooperative',
                  mapId: 'civic_map',
                }}
                onLoad={(map) => { setMapInstance(map); onMapLoad(map); }}
              >
                {mapInstance && filtered.map(c => {
                  const getMarkerIcon = (complaint) => {
                    if (complaint.status === 'Resolved') return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
                    if (complaint.severity === 'High') return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
                    return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
                  };
                  
                  return c.location && c.location.lat && (
                    <AdvancedMarker
                      key={c._id || c.id}
                      map={mapInstance}
                      position={{ lat: c.location.lat, lng: c.location.lng }}
                      icon={getMarkerIcon(c)}
                      onClick={() => setSelectedMarker(c)}
                    />
                  );
                })}

                {selectedMarker && (
                  <InfoWindowF
                    position={{ lat: selectedMarker.location.lat, lng: selectedMarker.location.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-1 min-w-[150px] text-[#0F172A] font-sans">
                      <p className="font-bold text-xs capitalize text-[#0F172A] m-0">
                        {selectedMarker.problemType}
                      </p>
                      <p className="text-[11px] text-[#4B5563] mt-0.5 mb-1">
                        {selectedMarker.locationAddress || 'Civic location'}
                      </p>
                      <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                        {selectedMarker.status}
                      </span>
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
            )}
          </div>
        )}

        {showMap && (
          <p className="text-[11px] text-[#6B7280] mt-2.5 text-center">
            Click any pin on the map to preview report details.
          </p>
        )}
      </div>

      {/* Filter Header Bar with Unified Scope Tabs */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Scope Switcher [ All City Complaints ] vs [ My Complaints ] */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => handleScopeChange('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              scope === 'all'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'bg-[#F9FAFB] text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
            }`}
          >
            <span>All City Complaints</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${scope === 'all' ? 'bg-white/20 text-white' : 'bg-[#E5E7EB] text-[#4B5563]'}`}>
              {complaints.length}
            </span>
          </button>

          {user && (
            <button
              onClick={() => handleScopeChange('my')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                scope === 'my'
                  ? 'bg-[#0284C7] text-white shadow-xs'
                  : 'bg-[#F9FAFB] text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Complaints</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${scope === 'my' ? 'bg-white/20 text-white' : 'bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]'}`}>
                {myComplaintsCount}
              </span>
            </button>
          )}

          <div className="h-4 w-px bg-[#E5E7EB] mx-1 hidden sm:block" />
          <span className="text-xs text-[#6B7280] hidden sm:inline">
            ({filtered.length} showing)
          </span>
        </div>

        {/* Right: Severity / Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[#6B7280] mr-1 hidden sm:inline">Filter:</span>
          {['All', 'High', 'Medium', 'Resolved'].map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0284C7] text-white shadow-xs'
                    : 'bg-[#F9FAFB] text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F3F4F6] border border-[#E5E7EB]'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards Grid: Full-Width Uniform 3-Column Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center text-[#6B7280]">
          <div className="w-8 h-8 border-3 border-[#0284C7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading complaints from city feed...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center text-[#6B7280]">
          <Filter className="w-10 h-10 mx-auto mb-3 text-[#9CA3AF]" />
          <p className="text-base font-semibold text-[#0F172A]">No complaints found</p>
          <p className="text-xs text-[#6B7280] mt-1">Try switching filter tab to "All".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((complaint) => {
            const isOwner = isComplaintOwned(complaint);
            return (
              <div key={complaint.id || complaint._id}>
                <ComplaintCard 
                  complaint={complaint} 
                  isOwner={isOwner}
                  onEdit={isOwner ? handleEditOpen : undefined}
                  onDelete={isOwner ? handleDeletePrompt : undefined}
                  onDownloadPDF={handleDownloadPDF}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Complaint Modal */}
      {selectedEditComplaint && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setSelectedEditComplaint(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-6 sm:p-7 max-w-lg w-full text-left"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#0284C7]" />
                <h3 className="text-lg font-bold text-[#0F172A]">Edit Complaint</h3>
              </div>
              <button 
                onClick={() => setSelectedEditComplaint(null)}
                className="text-[#9CA3AF] hover:text-[#0F172A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Issue Title / Defect Type
                </label>
                <input
                  type="text"
                  value={editFormData.problemType}
                  onChange={(e) => setEditFormData({ ...editFormData, problemType: e.target.value })}
                  className="w-full bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                  placeholder="e.g. Deep Pothole on Main Road"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B5563] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-[#F9FAFB] border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] resize-none"
                  placeholder="Detailed description of the issue..."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setSelectedEditComplaint(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] border border-[#D1D5DB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-6 max-w-md w-full text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Delete Complaint</h3>
                <p className="text-xs text-[#6B7280]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed mb-5">
              Are you sure you want to remove <strong>"{deleteTarget.problemType || 'this report'}"</strong>? It will be permanently removed from the city dashboard.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-[#F3F4F6] border border-[#D1D5DB] transition-colors"
              >
                Keep Complaint
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Container for html2pdf generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printingComplaint && (
          <div ref={pdfRef} style={{ width: '800px', padding: '36px', background: '#FFFFFF', color: '#0F172A', fontFamily: 'sans-serif' }}>
            <div style={{ borderBottom: '2px solid #0284C7', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>CIVIC REPORTER</h1>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>Official Citizen Grievance Petition</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284C7', background: '#F0F9FF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
                  REPORT #{String(printingComplaint.id || printingComplaint._id).slice(-6).toUpperCase()}
                </span>
                <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0 0 0' }}>{new Date(printingComplaint.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '12px' }}>
              <div>
                <p style={{ color: '#4B5563', margin: '0 0 6px 0' }}><strong>Defect Category:</strong> {printingComplaint.problemType}</p>
                <p style={{ color: '#4B5563', margin: '0 0 6px 0' }}><strong>Current Status:</strong> {printingComplaint.status}</p>
                <p style={{ color: '#4B5563', margin: '0' }}><strong>Priority Level:</strong> {printingComplaint.severity || 'Medium'}</p>
              </div>
              <div>
                <p style={{ color: '#4B5563', margin: '0 0 6px 0' }}><strong>Reported By:</strong> {printingComplaint.userName || userData?.name || 'Citizen'}</p>
                <p style={{ color: '#4B5563', margin: '0 0 6px 0' }}><strong>Location:</strong> {printingComplaint.locationAddress || 'Municipal Ward Area'}</p>
                <p style={{ color: '#4B5563', margin: '0' }}><strong>Coordinates:</strong> {printingComplaint.location ? `${printingComplaint.location.lat?.toFixed?.(4)}, ${printingComplaint.location.lng?.toFixed?.(4)}` : 'N/A'}</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F172A', marginBottom: '8px', borderBottom: '1px solid #E5E7EB', paddingBottom: '4px' }}>FORMAL LEGAL GRIEVANCE PETITION</h3>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.6', color: '#334155', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                {printingComplaint.formalLetter || printingComplaint.description || 'No formal petition text was recorded for this issue.'}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', fontSize: '10px', color: '#9CA3AF', textAlign: 'center' }}>
              Generated via Civic Reporter Platform · Certified RTI-compliant citizen grievance petition.
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
