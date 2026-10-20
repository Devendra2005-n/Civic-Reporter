import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useSpring, useMotionValue, useInView, animate } from 'framer-motion';
import { GoogleMap, useJsApiLoader, InfoWindowF } from '@react-google-maps/api';
import AdvancedMarker from '../components/AdvancedMarker';
import { getComplaints } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import TiltCard from '../components/TiltCard';
import { Filter, Layers, Clock, CheckCircle2, AlertTriangle, Map as MapIcon, TrendingUp, Activity, Zap } from 'lucide-react';

/* CSS filter-based dark mode for the map */
const darkMapFilterStyle = {
  filter: 'invert(90%) hue-rotate(180deg)',
  WebkitFilter: 'invert(90%) hue-rotate(180deg)',
};

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 };

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration,
        onUpdate: (latest) => setDisplayValue(Math.round(latest)),
        ease: "easeOut"
      });
      return () => controls.stop();
    }
  }, [isInView, value, duration]);

  return <span ref={ref} className="stat-counter">{displayValue}</span>;
};

// Glowing Stat Card
const StatCard = ({ value, label, icon: Icon, color, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity`} />
      <div className="relative bg-white/5 p-5 rounded-2xl border border-white/10 text-center backdrop-blur-sm group-hover:border-white/20 transition-all">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} bg-opacity-20 flex items-center justify-center mx-auto mb-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className={`text-3xl font-extrabold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          <AnimatedCounter value={value} />
        </p>
        <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">{label}</p>
      </div>
    </motion.div>
  );
};

// Pulsing Marker Component
const PulsingMarker = ({ map, position, icon, onClick, severity, status }) => {
  const getPulseColor = () => {
    if (status === 'Resolved') return 'bg-green-500';
    if (severity === 'High') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="relative">
      {/* Pulse Ring */}
      <div className={`absolute inset-0 ${getPulseColor()} rounded-full animate-ping opacity-20`} />
      <AdvancedMarker
        map={map}
        position={position}
        icon={icon}
        onClick={onClick}
      />
    </div>
  );
};

const Dashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

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
    : complaints.filter(c => c.severity === filter);

  // Stats
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const highPriorityCount = complaints.filter(c => c.severity === 'High' && c.status !== 'Resolved').length;

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
    <div className="min-h-screen pt-36 px-6 max-w-7xl mx-auto pb-12">
      {/* Header with Animation */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-2"
          >
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
              Live Data
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Real-time updates
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            City <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-gray-400 mt-2">Live view of civic issues reported in your area.</p>
        </div>
        
        {/* Filter Pills with Animation */}
        <motion.div 
          className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {['All', 'High', 'Medium', 'Low'].map((f, i) => (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              {filter === f && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{f}</span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics & Map View */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Overview */}
          <motion.div 
            className="glass-premium p-6 rounded-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Overview</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard 
                value={complaints.length} 
                label="Total Issues" 
                icon={Layers} 
                color="from-blue-400 to-blue-600"
                delay={0.1}
              />
              <StatCard 
                value={resolvedCount} 
                label="Resolved" 
                icon={CheckCircle2} 
                color="from-green-400 to-green-600"
                delay={0.2}
              />
              <StatCard 
                value={pendingCount} 
                label="Pending" 
                icon={Clock} 
                color="from-orange-400 to-orange-600"
                delay={0.3}
              />
              <StatCard 
                value={inProgressCount} 
                label="In Progress" 
                icon={Zap} 
                color="from-cyan-400 to-cyan-600"
                delay={0.4}
              />
            </div>
            
            {/* Priority Alert */}
            {highPriorityCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-300">{highPriorityCount} High Priority</p>
                  <p className="text-sm text-red-400/70">Requires immediate attention</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Complaint Cards Grid */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <motion.div
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-gray-500 animate-pulse">Loading complaints...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              className="glass-premium p-12 text-center text-gray-400 border border-dashed border-gray-600 rounded-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Filter className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No complaints found matching this filter.</p>
              <p className="text-sm text-gray-500 mt-2">Try selecting a different filter</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((complaint, index) => (
                <motion.div
                  key={complaint.id || complaint._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <TiltCard tiltAmount={5}>
                    <ComplaintCard complaint={complaint} />
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>


      
        <div className="mt-12">

          {/* Enhanced Map */}
          <motion.div 
            className="glass-premium p-5 rounded-3xl relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-purple-400" />
                <span>Issue Heatmap</span>
              </h3>
              <div className="flex gap-2">
                {[
                  { color: 'bg-green-500', label: 'Resolved' },
                  { color: 'bg-yellow-500', label: 'Medium' },
                  { color: 'bg-red-500', label: 'High' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1 text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-inner border border-white/5 relative" style={darkMapFilterStyle}>
              {!isLoaded ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
                  <motion.div
                    className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={defaultCenter}
                  zoom={12}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    zoomControlOptions: {
                      position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM,
                    },
                    gestureHandling: 'cooperative',
                    mapId: 'civic_map',
                  }}
                  onLoad={(map) => { setMapInstance(map); onMapLoad(map); }}
                >
                  {mapInstance && filtered.map(c => {
                    const getMarkerIcon = (complaint) => {
                      if (complaint.status === 'Resolved') return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
                      if (complaint.severity === 'High') return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
                      return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
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
                      <div style={{ padding: '8px', fontFamily: 'system-ui, sans-serif', minWidth: '150px' }}>
                        <p style={{ fontWeight: 700, color: '#1a1a2e', margin: 0, fontSize: '14px' }}>
                          {selectedMarker.problemType}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                          {selectedMarker.severity} Severity
                        </p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
                          {selectedMarker.status}
                        </p>
                      </div>
                    </InfoWindowF>
                  )}
                </GoogleMap>
              )}
              
              {/* Map Overlay Effect */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0B0F19]/50 to-transparent" />
            </div>
          </motion.div></div>
        
    </div>
  );
};

export default Dashboard;
