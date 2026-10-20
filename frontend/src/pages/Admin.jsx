import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { 
  ShieldCheck, CheckCircle2, Clock, AlertTriangle, MapPin, 
  User, X, Users, Trash2, Shield, UserPlus, Check, XCircle, 
  BarChart3, Map, HelpCircle, Download, FileText, Sparkles,
  TrendingUp, Activity, Filter, Search, ChevronDown, MoreHorizontal, Mail, Copy,
  Camera, UploadCloud, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { GoogleMap, useJsApiLoader, InfoWindowF } from '@react-google-maps/api';
import AdvancedMarker from '../components/AdvancedMarker';
import html2pdf from 'html2pdf.js';
import PDFReport from '../components/Admin/PDFReport';
import { copyToClipboard } from '../utils/clipboard';
import { formatComplaintId } from '../utils/formatters';
import {
  getComplaints,
  getUsers,
  getAdminRequests,
  updateComplaint,
  deleteComplaint,
  promoteUser,
  demoteUser,
  approveAdminRequest,
  rejectAdminRequest,
  sendComplaintEmail,
  updateUserReputation,
  uploadImage
} from '../services/api';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
const STATUS_COLORS = { 'Pending': '#f97316', 'In Progress': '#3b82f6', 'Resolved': '#22c55e' };

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2 }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, count, duration]);

  useEffect(() => {
    return rounded.on("change", (v) => setDisplayValue(v));
  }, [rounded]);

  return <span>{displayValue.toLocaleString()}</span>;
};

// Animated Stat Card Component
const StatCard = ({ value, label, icon: Icon, color, delay = 0 }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
    orange: 'from-orange-500/20 to-orange-600/10 text-orange-400',
    green: 'from-green-500/20 to-green-600/10 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`bg-[#0B0F19] p-6 rounded-2xl border border-white/10 relative overflow-hidden group cursor-pointer`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring" }}
            className="w-2 h-2 rounded-full bg-green-400"
          />
        </div>
        <p className="text-4xl font-extrabold text-white mb-1">
          <AnimatedCounter value={value} />
        </p>
        <p className="text-sm text-gray-400 uppercase tracking-wider">{label}</p>
      </div>
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
      />
    </motion.div>
  );
};

// Map details
const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 };
const darkMapFilterStyle = {
  filter: 'invert(90%) hue-rotate(180deg)',
  WebkitFilter: 'invert(90%) hue-rotate(180deg)',
};

const Admin = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'complaints' | 'flagged' | 'map' | 'users'
  
  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'resolve', 'verification', 'remark'
  const [modalTarget, setModalTarget] = useState(null);
  const [modalInput, setModalInput] = useState(''); // afterUrl or remark

  // Users State
  const [users, setUsers] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedMapMarker, setSelectedMapMarker] = useState(null);
  const [adminMapInstance, setAdminMapInstance] = useState(null);
  
  // PDF Reference
  const pdfRef = useRef();
  const [printingComplaint, setPrintingComplaint] = useState(null);

  // Resolve image upload state
  const [resolveFile, setResolveFile] = useState(null);
  const [resolvePreview, setResolvePreview] = useState(null);
  const [resolveUploading, setResolveUploading] = useState(false);
  const resolveInputRef = useRef(null);
  const resolveCameraRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  const severityValue = { High: 3, Medium: 2, Low: 1 };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    mapIds: ['civic_map'],
    libraries: ['marker']
  });

  const fetchComplaints = async () => {
    try {
      const res = await getComplaints();
      const sorted = res.data.sort((a, b) => {
        const valA = severityValue[a.severity] || severityValue[a.severity?.charAt(0).toUpperCase() + a.severity?.slice(1)] || 2;
        const valB = severityValue[b.severity] || severityValue[b.severity?.charAt(0).toUpperCase() + b.severity?.slice(1)] || 2;
        if (valA !== valB) {
          return valB - valA;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setComplaints(sorted);
    } catch (err) {
      console.error("fetchComplaints error:", err);
      toast.error('Failed to load complaints');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchUsersData = async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, reqsRes] = await Promise.all([
        getUsers(),
        getAdminRequests()
      ]);
      setUsers(usersRes.data);
      setAdminRequests(reqsRes.data);
    } catch (err) {
      console.error("fetchUsersData error:", err);
      toast.error('Failed to load users data');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchUsersData();
  }, []);

  // --- Complaints Actions ---

  const handleStatusChange = async (id, currentStatus, newStatus) => {
    if (currentStatus === newStatus) return;
    
    if (newStatus === 'Resolved') {
      setModalTarget({ id, currentStatus, newStatus });
      setModalType('resolve');
      setModalInput('');
      setResolveFile(null);
      setResolvePreview(null);
      setModalOpen(true);
      return;
    }

    try {
      await updateComplaint(id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleResolveFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setResolveFile(file);
    setResolvePreview(URL.createObjectURL(file));
  };

  const submitModal = async () => {
    if (!modalTarget) return;
    try {
      if (modalType === 'resolve') {
        let afterImageUrl = '';
        if (resolveFile) {
          setResolveUploading(true);
          toast.loading('Uploading evidence image...', { id: 'resolve-upload' });
          try {
            const uploadRes = await uploadImage(resolveFile);
            afterImageUrl = uploadRes.data.imageUrl;
            toast.success('Image uploaded!', { id: 'resolve-upload' });
          } catch (uploadErr) {
            toast.error('Image upload failed. Resolving without image.', { id: 'resolve-upload' });
          } finally {
            setResolveUploading(false);
          }
        }
        await updateComplaint(modalTarget.id, {
          status: 'Resolved',
          afterImageUrl: afterImageUrl || '',
        });
        toast.success('Issue marked as Resolved ✅');
        setResolveFile(null);
        setResolvePreview(null);
      } else if (modalType === 'verification') {
        await updateComplaint(modalTarget.id, {
          verificationStatus: modalTarget.newVerification,
          adminRemarks: modalInput || `Verification status overridden to ${modalTarget.newVerification}`
        });
        toast.success('Verification updated overrides saved.');
      } else if (modalType === 'remark') {
         await updateComplaint(modalTarget.id, {
           adminRemarks: modalInput
         });
         toast.success('Remark added to timeline!');
      }
      setModalOpen(false);
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to process modal action');
    }
  };

  const openVerificationModal = (c, newStatus) => {
    setModalTarget({ id: c.id || c._id, newVerification: newStatus });
    setModalType('verification');
    setModalInput('');
    setModalOpen(true);
  };
  
  const openRemarkModal = (c) => {
      setModalTarget({ id: c.id || c._id });
      setModalType('remark');
      setModalInput('');
      setModalOpen(true);
  };

  const openLetterModal = (c) => {
      setModalTarget({ 
        formalLetter: c.formalLetter, 
        translatedLetter: c.translatedLetter, 
        language: c.translatedLanguage,
        id: c.id || c._id
      });
      setModalType('letter');
      setModalOpen(true);
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Delete this complaint? This cannot be undone.")) return;
    try {
      await deleteComplaint(id);
      toast.success("Complaint deleted successfully");
      fetchComplaints();
    } catch (err) {
      toast.error("Failed to delete complaint");
    }
  };

  // Mark as Spam + update reputation
  const handleMarkSpam = async (complaint) => {
    if (!window.confirm(`Mark this complaint as SPAM? This will penalize the user's reputation.`)) return;
    try {
      await updateComplaint(complaint.id || complaint._id, {
        verificationStatus: 'Spam',
        adminRemarks: 'Marked as spam by admin'
      });
      // Update user reputation
      if (complaint.userId && complaint.userId !== 'anonymous') {
        try {
          await updateUserReputation(complaint.userId, 'spam');
        } catch {}
      }
      toast.success('Complaint marked as spam \u26a0\ufe0f');
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to mark as spam');
    }
  };

  // Approve complaint + update reputation
  const handleApproveComplaint = async (complaint) => {
    try {
      await updateComplaint(complaint.id || complaint._id, {
        verificationStatus: 'Verified',
        spamStatus: 'clean',
        adminRemarks: 'Verified by admin'
      });
      if (complaint.userId && complaint.userId !== 'anonymous') {
        try {
          await updateUserReputation(complaint.userId, 'valid');
        } catch {}
      }
      toast.success('Complaint verified \u2705');
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to verify complaint');
    }
  };

  // Reject complaint + update reputation
  const handleRejectComplaint = async (complaint) => {
    try {
      await updateComplaint(complaint.id || complaint._id, {
        verificationStatus: 'Rejected',
        adminRemarks: 'Rejected by admin'
      });
      if (complaint.userId && complaint.userId !== 'anonymous') {
        try {
          await updateUserReputation(complaint.userId, 'rejected');
        } catch {}
      }
      toast.success('Complaint rejected');
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to reject complaint');
    }
  };

  const handleSendEmail = async (complaint) => {
    let targetEmail = complaint.userEmail;
    if (!targetEmail) {
      targetEmail = window.prompt("No user email is associated with this complaint. Please enter an email address to send the resolution to:");
      if (!targetEmail) return;
    } else {
      if (!window.confirm(`Send resolution email to ${targetEmail}?`)) return;
    }
    
    toast.loading('Sending email...', { id: 'email-toast' });
    try {
      await sendComplaintEmail(complaint.id || complaint._id, { emailType: 'resolved', targetEmail });
      toast.success(`Email sent successfully to ${targetEmail}!`, { id: 'email-toast' });
    } catch (err) {
      toast.error('Failed to send email', { id: 'email-toast' });
    }
  };

  const downloadPDF = (complaint) => {
    setPrintingComplaint(complaint);
    toast.loading('Generating PDF...', { id: 'pdf-toast' });
    
    setTimeout(() => {
      const element = pdfRef.current;
      const opt = {
        margin:       10,
        filename:     `Complaint_${complaint.id || complaint._id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().from(element).set(opt).save().then(() => {
        toast.success('PDF Downloaded!', { id: 'pdf-toast' });
        setPrintingComplaint(null);
      }).catch(err => {
        toast.error('Failed to generate PDF', { id: 'pdf-toast' });
        setPrintingComplaint(null);
      });
    }, 1000); // 1 second buffer for images to render
  };

  // --- Users Actions ---

  const handlePromote = async (uid, name) => {
    if (!window.confirm(`Promote ${name} to Admin?`)) return;
    try { await promoteUser(uid); toast.success(`${name} is now an Admin`); fetchUsersData(); } catch (err) { toast.error("Failed"); }
  };
  const handleDemote = async (uid, name) => {
    if (uid === userData?.uid) return toast.error("You cannot demote yourself.");
    if (!window.confirm(`Demote Admin ${name} to Citizen?`)) return;
    try { await demoteUser(uid); toast.success(`${name} is now a Citizen`); fetchUsersData(); } catch (err) { toast.error("Failed"); }
  };
  const handleApproveRequest = async (uid, name) => {
    try { await approveAdminRequest(uid); toast.success(`${name}'s request approved`); fetchUsersData(); } catch (err) { toast.error('Failed'); }
  };
  const handleRejectRequest = async (uid, name) => {
    try { await rejectAdminRequest(uid); toast.success(`${name}'s request rejected`); fetchUsersData(); } catch (err) { toast.error('Failed'); }
  };

  // --- Analytics Data Prep ---
  const statusCounts = [
    { name: 'Pending', value: complaints.filter(c => c.status === 'Pending').length },
    { name: 'In Progress', value: complaints.filter(c => c.status === 'In Progress').length },
    { name: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length },
  ];

  const priorityCounts = [
    { name: 'High', value: complaints.filter(c => c.severity === 'High').length },
    { name: 'Medium', value: complaints.filter(c => c.severity === 'Medium').length },
    { name: 'Low', value: complaints.filter(c => c.severity === 'Low').length },
  ];

  const flaggedComplaints = complaints.filter(c => 
    c.spamStatus === 'flagged' || c.verificationStatus === 'Suspicious'
  );

  const spamComplaints = complaints.filter(c => 
    c.spamStatus === 'spam' || c.verificationStatus === 'Spam'
  );


  if (loadingComplaints) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 text-white">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            borderRadius: ["20%", "50%", "20%"]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 mb-4"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 text-sm"
        >
          Loading Admin Dashboard...
        </motion.p>
      </div>
    );
  }

  const SidebarItem = ({ id, icon: Icon, label, delay = 0 }) => (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={() => setActiveTab(id)}
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium relative overflow-hidden ${
        activeTab === id 
        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/20' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {/* Active indicator bar */}
      {activeTab === id && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      <Icon className="w-5 h-5 relative z-10" />
      <span className="relative z-10">{label}</span>
      {id === 'users' && adminRequests.length > 0 && (
         <motion.span 
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold relative z-10"
         >
           {adminRequests.length}
         </motion.span>
      )}
    </motion.button>
  );

  const filteredComplaints = complaints.filter(c => {
    const rawIdStr = String(c.id || c._id).toLowerCase();
    const formattedIdStr = formatComplaintId(c).toLowerCase();
    const searchLower = searchQuery.toLowerCase().replace('#', '');
    const matchesSearch = rawIdStr.includes(searchLower) || formattedIdStr.includes(searchLower);
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen pt-36 px-4 max-w-[1400px] mx-auto pb-8 flex flex-col md:flex-row gap-6 relative">
      
      {/* Hidden Print Container for PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printingComplaint && <PDFReport ref={pdfRef} complaint={printingComplaint} />}
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 space-y-2 bg-[#0B0F19] p-4 h-[calc(100vh-120px)] sticky top-24 rounded-2xl flex flex-col hidden-scrollbar overflow-y-auto">
        <div className="pb-6 mb-2 border-b border-white/10 flex items-center space-x-3 px-2">
           <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <ShieldCheck className="w-6 h-6 text-orange-400" />
           </div>
           <div>
              <h2 className="font-bold text-white leading-tight">Admin System</h2>
              <p className="text-[10px] text-gray-400 font-mono">v2.0 Advanced</p>
           </div>
        </div>

        <SidebarItem id="dashboard" icon={BarChart3} label="Dashboard" />
        <SidebarItem id="complaints" icon={AlertTriangle} label="Complaints" />
        <SidebarItem id="flagged" icon={Shield} label="Flagged" />
        <SidebarItem id="map" icon={Map} label="Map Clustering" />
        <SidebarItem id="users" icon={Users} label="Access Control" />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-6 overflow-hidden min-h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Analytics Overview</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard value={complaints.length} label="Total Issues" icon={Activity} color="blue" delay={0} />
                <StatCard value={statusCounts[0].value} label="Pending" icon={Clock} color="orange" delay={0.1} />
                <StatCard value={statusCounts[1].value} label="In Progress" icon={TrendingUp} color="purple" delay={0.2} />
                <StatCard value={statusCounts[2].value} label="Resolved" icon={CheckCircle2} color="green" delay={0.3} />
                <StatCard value={flaggedComplaints.length} label="Flagged" icon={AlertTriangle} color="orange" delay={0.4} />
                <StatCard value={spamComplaints.length} label="Spam" icon={Shield} color="purple" delay={0.5} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
                <div className="bg-[#0B0F19] p-4 rounded-2xl border-white/10 flex flex-col">
                   <h3 className="text-md font-bold text-gray-300 mb-2 px-2">Complaints by Status</h3>
                   <div className="flex-1">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusCounts}
                            cx="50%" cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {statusCounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                          <Legend />
                        </PieChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-[#0B0F19] p-4 rounded-2xl border-white/10 flex flex-col">
                   <h3 className="text-md font-bold text-gray-300 mb-2 px-2">Priority Distribution</h3>
                   <div className="flex-1">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priorityCounts}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
                          <YAxis stroke="#64748b" tick={{fontSize: 12}} allowDecimals={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {priorityCounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                          </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: COMPLAINTS */}
          {activeTab === 'complaints' && (
            <motion.div key="complaints" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                 <h2 className="text-xl font-bold text-white">Complaint Moderation</h2>
                 <p className="text-sm text-gray-400">Total: {complaints.length}</p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#0B0F19] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              >
                {/* Table Header with Search */}
                <div className="p-4 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input 
                      type="text"
                      placeholder="Search by Complaint ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-64 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                    <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                    {['All', 'Pending', 'In Progress', 'Resolved'].map((filter) => (
                      <motion.button
                        key={filter}
                        onClick={() => setFilterStatus(filter)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                          filterStatus === filter ? 'bg-blue-500 text-white font-bold' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {filter}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-black/40 border-b border-white/10 text-gray-400 text-xs tracking-wider uppercase">
                        <th className="p-4 pl-6 font-semibold w-72">Issue Details</th>
                        <th className="p-4 font-semibold w-40 text-center">AI Validation</th>
                        <th className="p-4 font-semibold text-center">Current Status</th>
                        <th className="p-4 font-semibold text-center">Timeline</th>
                        <th className="p-4 pr-6 font-semibold text-right">Moderator Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredComplaints.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-500">No complaints found.</td>
                        </tr>
                      ) : filteredComplaints.map((c, i) => (
                        <motion.tr 
                          key={c.id || c._id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                          className="transition-colors group cursor-pointer"
                          onClick={() => navigate(`/details/${c.id || c._id}`)}
                        >
                          <td className="p-4 pl-6">
                            <div className="flex items-center space-x-3">
                              <img src={c.imageUrl} alt="Issue" className="w-12 h-12 rounded-lg object-cover border border-white/10" crossOrigin="anonymous"/>
                              <div>
                                <p className="font-bold text-sm text-white line-clamp-1">{c.problemType}</p>
                                <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                                  {c.userEmail ? c.userEmail : 'No Email'} • 
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const shortId = '#' + formatComplaintId(c);
                                      copyToClipboard(shortId);
                                      setCopiedId(c.id || c._id);
                                      setTimeout(() => setCopiedId(null), 2000);
                                    }}
                                    className="flex items-center gap-1 hover:text-white transition-colors group cursor-pointer font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10 hover:border-white/20"
                                    title="Copy ID"
                                  >
                                    #{formatComplaintId(c)}
                                    {copiedId === (c.id || c._id) ? (
                                      <Check className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-gray-400 group-hover:text-white" />
                                    )}
                                  </button>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  c.severity === 'High' ? 'bg-red-500/20 text-red-400' : c.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                                }`}>{c.severity} Priority</span>
                              </div>
                            </div>
                          </td>
                          
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <span className={`text-[11px] px-2 py-1 rounded-md font-bold ${
                                c.verificationStatus === 'Pending' ? 'bg-gray-500/20 text-gray-400' :
                                c.verificationStatus === 'Approved manually' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                c.verificationStatus === 'Rejected manually' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {c.verificationStatus || 'Unknown'}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                <button onClick={(e) => { e.stopPropagation(); openVerificationModal(c, 'Approved manually'); }} title="Approve" className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded"><Check className="w-3 h-3"/></button>
                                <button onClick={(e) => { e.stopPropagation(); openVerificationModal(c, 'Rejected manually'); }} title="Reject" className="p-1 hover:bg-red-500/20 text-red-500 rounded"><X className="w-3 h-3"/></button>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <select 
                                onClick={(e) => e.stopPropagation()}
                                value={c.status}
                                onChange={(e) => handleStatusChange(c.id || c._id, c.status, e.target.value)}
                                className={`text-[11px] font-bold rounded-lg px-2 py-1 outline-none appearance-none text-center cursor-pointer ${
                                  c.status === 'Resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                  c.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                  'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                }`}
                              >
                                <option value="Pending" className="bg-slate-900 text-orange-400">Pending</option>
                                <option value="In Progress" className="bg-slate-900 text-blue-400">In Progress</option>
                                <option value="Resolved" className="bg-slate-900 text-green-400">Resolved</option>
                              </select>
                          </td>

                          <td className="p-4 text-center">
                             <div className="flex flex-col items-center">
                                <p className="text-[11px] text-gray-400">{c.timeline?.length || 0} Events</p>
                                <button onClick={(e) => { e.stopPropagation(); openRemarkModal(c); }} className="text-[10px] text-indigo-400 hover:text-indigo-300 mt-1 flex items-center gap-1">+ Add Remark</button>
                             </div>
                          </td>

                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button onClick={(e) => { e.stopPropagation(); handleSendEmail(c); }} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors" title="Send Resolution Email">
                                 <Mail className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); openLetterModal(c); }} className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors" title="View Formal Letter">
                                 <FileText className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteComplaint(c.id || c._id); }} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Delete">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </motion.tr>
                      ))}
                      {complaints.length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">Database is empty.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* TAB: FLAGGED COMPLAINTS (Moderation Panel) */}
          {activeTab === 'flagged' && (
            <motion.div key="flagged" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex justify-between items-center bg-gradient-to-r from-red-500/10 to-orange-500/10 p-4 rounded-xl border border-red-500/20">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" /> Flagged Complaints Moderation
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                    {flaggedComplaints.length} Flagged
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                    {spamComplaints.length} Spam
                  </span>
                </div>
              </div>

              {flaggedComplaints.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#0B0F19] rounded-2xl p-12 text-center border border-white/10"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-white mb-2">All Clear! 🎉</h3>
                  <p className="text-gray-400">No flagged complaints requiring moderation.</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {flaggedComplaints.map((c, i) => (
                    <motion.div
                      key={c.id || c._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-[#0B0F19] rounded-2xl border border-orange-500/20 overflow-hidden cursor-pointer hover:border-orange-500/50 transition-colors"
                      onClick={() => navigate(`/details/${c.id || c._id}`)}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-5">
                          {/* Image */}
                          <div className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            <img src={c.imageUrl} alt="Issue" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-500/80 backdrop-blur text-[9px] font-bold rounded text-white">
                              FLAGGED
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-white text-lg">{c.problemType}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                c.severity === 'High' ? 'bg-red-500/20 text-red-400' : c.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                              }`}>{c.severity}</span>
                            </div>

                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{c.description}</p>

                            {/* Flag Reason */}
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">⚠️ Flag Reason</p>
                              <p className="text-sm text-red-200">{c.flagReason || 'No reason specified'}</p>
                            </div>

                            {/* Validation Details Grid */}
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              {/* Image Validation */}
                              <div className={`p-2 rounded-lg border ${
                                c.imageValidation?.isValid === false
                                  ? 'bg-red-500/10 border-red-500/20'
                                  : 'bg-green-500/10 border-green-500/20'
                              }`}>
                                <p className="font-bold text-gray-400 mb-1">Image Valid</p>
                                <p className={`font-bold ${c.imageValidation?.isValid === false ? 'text-red-400' : 'text-green-400'}`}>
                                  {c.imageValidation?.isValid === false ? '❌ No' : '✅ Yes'}
                                </p>
                              </div>

                              {/* Location Verified */}
                              <div className={`p-2 rounded-lg border ${
                                c.locationVerified
                                  ? 'bg-green-500/10 border-green-500/20'
                                  : 'bg-orange-500/10 border-orange-500/20'
                              }`}>
                                <p className="font-bold text-gray-400 mb-1">Location</p>
                                <p className={`font-bold ${c.locationVerified ? 'text-green-400' : 'text-orange-400'}`}>
                                  {c.locationVerified ? '✅ Verified' : `⚠️ ${c.locationDistance || 0}km away`}
                                </p>
                              </div>

                              {/* Category Match */}
                              <div className={`p-2 rounded-lg border ${
                                c.categoryMatch?.matches === false
                                  ? 'bg-red-500/10 border-red-500/20'
                                  : 'bg-green-500/10 border-green-500/20'
                              }`}>
                                <p className="font-bold text-gray-400 mb-1">Category</p>
                                <p className={`font-bold ${c.categoryMatch?.matches === false ? 'text-red-400' : 'text-green-400'}`}>
                                  {c.categoryMatch?.matches === false ? '❌ Mismatch' : '✅ Match'}
                                </p>
                              </div>
                            </div>

                            {/* User Info */}
                            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                              <User className="w-3 h-3" />
                              <span>{c.userName || 'Anonymous'}</span>
                              <span>•</span>
                              <span>{c.userEmail || 'No email'}</span>
                              <span>•</span>
                              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/10">
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); handleApproveComplaint(c); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30 transition-all font-bold text-sm"
                          >
                            <Check className="w-4 h-4" /> Accept
                          </motion.button>
                          
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); handleRejectComplaint(c); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white border border-orange-500/30 transition-all font-bold text-sm"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </motion.button>
                          
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); handleMarkSpam(c); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all font-bold text-sm"
                          >
                            <AlertTriangle className="w-4 h-4" /> Mark Spam
                          </motion.button>

                          <motion.button
                            onClick={(e) => { e.stopPropagation(); handleDeleteComplaint(c.id || c._id); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="py-3 px-4 rounded-xl bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: MAP CLUSTERING */}
          {activeTab === 'map' && (
            <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col space-y-4">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><MapPin/> Map Validation & Clustering</h2>
              </div>
              <div className="flex-1 bg-[#0B0F19] rounded-2xl overflow-hidden border border-white/10 relative p-1 min-h-[500px]" style={darkMapFilterStyle}>
                 {!isLoaded ? (
                   <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                     <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   </div>
                 ) : (
                   <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={defaultCenter}
                      zoom={11}
                      options={{ disableDefaultUI: false, mapId: 'civic_map' }}
                      onLoad={(map) => setAdminMapInstance(map)}
                   >
                     {adminMapInstance && complaints.map(c => {
                       if(!c.location || !c.location.lat) return null;
                       return (
                         <AdvancedMarker
                           key={c.id || c._id}
                           map={adminMapInstance}
                           position={{ lat: c.location.lat, lng: c.location.lng }}
                           onClick={() => setSelectedMapMarker(c)}
                         />
                       )
                     })}
                     {selectedMapMarker && (
                       <InfoWindowF
                          position={{ lat: selectedMapMarker.location.lat, lng: selectedMapMarker.location.lng }}
                          onCloseClick={() => setSelectedMapMarker(null)}
                       >
                          <div className="p-2 text-black max-w-[200px]">
                             <p className="font-bold text-sm mb-1">{selectedMapMarker.problemType}</p>
                             <p className="text-xs text-gray-600 truncate">{selectedMapMarker.locationAddress}</p>
                             <div className="mt-2 text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 self-start inline-block">{selectedMapMarker.status}</div>
                          </div>
                       </InfoWindowF>
                     )}
                   </GoogleMap>
                 )}
              </div>
            </motion.div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              
              <h2 className="text-2xl font-bold text-white mb-6">User Access Management</h2>

              {adminRequests.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center"><Shield className="w-4 h-4 text-red-500 mr-2" /> Pending Admin Requests</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {adminRequests.map((req) => (
                      <div key={req.id} className="bg-[#0B0F19] p-4 rounded-xl flex items-center justify-between border-red-500/20">
                        <div>
                          <p className="font-bold text-white text-sm">{req.name}</p>
                          <p className="text-xs text-gray-400">{req.email}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button onClick={() => handleApproveRequest(req.uid, req.name)} className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white rounded"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleRejectRequest(req.uid, req.name)} className="p-1.5 bg-gray-500/20 text-gray-400 hover:bg-gray-500 hover:text-white rounded"><XCircle className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#0B0F19] rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/20 border-b border-white/5 text-gray-400 text-xs tracking-wider uppercase">
                      <th className="p-4 pl-6 font-semibold">User</th>
                      <th className="p-4 font-semibold">Role</th>
                      <th className="p-4 font-semibold text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 pl-6">
                          <p className="font-bold text-white text-sm">{u.name || 'Anonymous User'}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </td>
                        <td className="p-4">
                           <span className={`inline-flex items-center space-x-1 px-2 py-1 text-[10px] font-bold rounded-md ${
                              u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                           }`}>
                             {u.role === 'admin' ? 'Admin' : 'Citizen'}
                           </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {u.role === 'admin' ? (
                            <button onClick={() => handleDemote(u.uid, u.name)} disabled={u.uid === userData?.uid} className="px-3 py-1 text-xs font-bold rounded-lg bg-white/5 text-gray-400 hover:bg-orange-500 hover:text-white disabled:opacity-50">
                               Demote
                            </button>
                          ) : (
                            <button onClick={() => handlePromote(u.uid, u.name)} className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/30">
                               Make Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Multipurpose Action Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-[#0B0F19] p-8 rounded-2xl w-full ${modalType === 'letter' ? 'max-w-2xl' : 'max-w-md'} space-y-6 border border-white/10`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                   {modalType === 'resolve' && 'Resolve Issue'}
                   {modalType === 'verification' && 'Override Verification'}
                   {modalType === 'remark' && 'Add Timeline Remark'}
                   {modalType === 'letter' && 'Formal Complaint Letter'}
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              </div>

              {modalType === 'resolve' && (
                <>
                  <p className="text-sm text-gray-400">Upload or capture a photo showing the resolved issue as evidence.</p>
                  
                  {/* Hidden file inputs */}
                  <input
                    ref={resolveInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleResolveFileChange}
                    className="hidden"
                  />
                  <input
                    ref={resolveCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleResolveFileChange}
                    className="hidden"
                  />

                  {resolvePreview ? (
                    <div className="relative w-full rounded-xl overflow-hidden border border-white/10 group">
                      <img src={resolvePreview} alt="Evidence" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => { setResolveFile(null); setResolvePreview(null); }}
                          className="bg-red-500/90 text-white p-3 rounded-full hover:bg-red-500 transition-all shadow-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500/80 backdrop-blur text-[10px] font-bold rounded text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Evidence Ready
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div
                        onClick={() => resolveInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-white/15 hover:border-blue-400/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5 group"
                      >
                        <div className="p-3 bg-blue-500/10 rounded-full mb-3 group-hover:bg-blue-500/20 transition-colors">
                          <UploadCloud className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-sm text-gray-300 font-medium">Click to browse files</p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => resolveCameraRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 rounded-xl border border-blue-500/30 hover:from-blue-600/30 hover:to-purple-600/30 transition-all font-semibold text-sm"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo with Camera</span>
                      </button>
                    </div>
                  )}
                </>
              )}
              
              {modalType === 'verification' && (
                <>
                  <p className="text-sm text-gray-400">Add an optional remark for overriding status to <b>{modalTarget?.newVerification}</b>.</p>
                  <textarea value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder="Reason for override..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none h-24" />
                </>
              )}

              {modalType === 'remark' && (
                <>
                  <p className="text-sm text-gray-400">This remark will be visible in the complaint timeline and dashboard.</p>
                  <textarea value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder="Enter details..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none h-24" />
                </>
              )}

              {modalType === 'letter' && (
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed font-serif">
                    {modalTarget?.formalLetter || 'No letter was generated for this issue.'}
                  </div>
                  {modalTarget?.translatedLetter && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Translated Version ({modalTarget?.language})</p>
                      <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed font-serif">
                        {modalTarget?.translatedLetter}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                {modalType !== 'letter' && (
                  <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all">Cancel</button>
                )}
                {modalType !== 'letter' ? (
                  <button 
                    onClick={submitModal} 
                    disabled={resolveUploading}
                    className={`flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all ${resolveUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {resolveUploading ? 'Uploading...' : 'Confirm'}
                  </button>
                ) : (
                  <button onClick={() => setModalOpen(false)} className="w-full py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all">
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Admin;
