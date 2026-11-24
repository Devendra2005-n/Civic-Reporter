import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, InfoWindowF } from '@react-google-maps/api';
import AdvancedMarker from '../components/AdvancedMarker';
import { getComplaints } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import { 
  Filter, Layers, Clock, CheckCircle2, AlertTriangle, 
  Map as MapIcon, Plus, Shield, ArrowRight, Activity, 
  CheckCircle, Hourglass, AlertCircle, PhoneCall, BarChart2, 
  Lightbulb, Trash2, Droplets, ChevronRight, Building2
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
  const { userData, isAdmin } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [showMap, setShowMap] = useState(true);

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

  const filtered = filter === 'All' 
    ? complaints 
    : complaints.filter(c => c.severity === filter || c.status === filter);

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

      {/* Filter Header Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3.5 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-[#0F172A]">Recent Complaints</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
            {filtered.length} showing
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
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
          {filtered.map((complaint) => (
            <div key={complaint.id || complaint._id}>
              <ComplaintCard complaint={complaint} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
