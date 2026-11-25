import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { 
  ShieldCheck, CheckCircle2, Clock, AlertTriangle, MapPin, 
  User, X, Users, Trash2, Shield, UserPlus, Check, XCircle, 
  BarChart3, Map, HelpCircle, Download, FileText, Sparkles,
  TrendingUp, Activity, Filter, Search, ChevronDown, MoreHorizontal, Mail, Copy,
  Camera, UploadCloud, Image as ImageIcon, RefreshCw, Eye, ArrowUpRight,
  SlidersHorizontal, CheckSquare, Square, AlertCircle, Building2,
  Briefcase, History, DownloadCloud, ArrowRight, ExternalLink, Award,
  AlertOctagon, CheckCheck, ListFilter, HardHat, Phone, Send, UserCheck, Plus, PhoneCall
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
import { getDepartment } from '../utils/departments';
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
  uploadImage,
  getWorkers,
  createWorker,
  deleteWorker,
  updateWorkerStatus,
  assignWorkerToComplaint
} from '../services/api';

// Cohesive palette matching the User panel (SaaS Light Theme)
const STATUS_COLORS = { 
  'Pending': '#F59E0B', 
  'In Progress': '#0284C7', 
  'Resolved': '#16A34A' 
};

const PRIORITY_COLORS = {
  'High': '#EF4444',
  'Medium': '#F97316',
  'Low': '#10B981',
};

// Department visual styling & icon metadata
const GOOGLE_MAPS_LIBRARIES = ['marker'];
const GOOGLE_MAPS_IDS = ['civic_map'];

const DEPT_META = {
  'Road & Infrastructure Department': { icon: '🛣️', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Sanitation Department': { icon: '🗑️', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Electricity Department': { icon: '⚡', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Water & Sewage Department': { icon: '💧', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Parks & Environment Department': { icon: '🌳', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Pollution Control Department': { icon: '🌫️', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Traffic & Transport Department': { icon: '🚦', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'General Municipal Department': { icon: '🏛️', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1.6 }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value || 0, {
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

// Modern SaaS Stat Card matching User Dashboard
const StatCard = ({ value, label, subtext, icon: Icon, variant = 'blue', trend = null, delay = 0 }) => {
  const themes = {
    blue: {
      bgIcon: 'bg-[#F0F9FF]',
      borderIcon: 'border-[#BAE6FD]',
      textIcon: 'text-[#0284C7]',
      accentBadge: 'bg-[#EFF6FF] text-[#0284C7]',
    },
    amber: {
      bgIcon: 'bg-[#FFFBEB]',
      borderIcon: 'border-[#FDE68A]',
      textIcon: 'text-[#D97706]',
      accentBadge: 'bg-[#FFFBEB] text-[#D97706]',
    },
    emerald: {
      bgIcon: 'bg-[#F0FDF4]',
      borderIcon: 'border-[#BBF7D0]',
      textIcon: 'text-[#16A34A]',
      accentBadge: 'bg-[#F0FDF4] text-[#16A34A]',
    },
    rose: {
      bgIcon: 'bg-[#FFF1F2]',
      borderIcon: 'border-[#FECDD3]',
      textIcon: 'text-[#E11D48]',
      accentBadge: 'bg-[#FFF1F2] text-[#E11D48]',
    },
    indigo: {
      bgIcon: 'bg-[#EEF2FF]',
      borderIcon: 'border-[#C7D2FE]',
      textIcon: 'text-[#4F46E5]',
      accentBadge: 'bg-[#EEF2FF] text-[#4F46E5]',
    },
    purple: {
      bgIcon: 'bg-[#FAF5FF]',
      borderIcon: 'border-[#E9D5FF]',
      textIcon: 'text-[#9333EA]',
      accentBadge: 'bg-[#FAF5FF] text-[#9333EA]',
    },
  };

  const theme = themes[variant] || themes.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${theme.bgIcon} ${theme.borderIcon} border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
          <Icon className={`w-5 h-5 ${theme.textIcon}`} />
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${theme.accentBadge}`}>
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
          <AnimatedCounter value={value} />
        </p>
        {subtext && (
          <p className="text-xs text-[#94A3B8] mt-1 font-medium truncate">
            {subtext}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Map container configuration
const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const defaultCenter = { lat: 28.6139, lng: 77.2090 };

const Admin = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'complaints' | 'departments' | 'flagged' | 'map' | 'users' | 'audit'
  
  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActionRunning, setBulkActionRunning] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'resolve', 'verification', 'remark', 'letter'
  const [modalTarget, setModalTarget] = useState(null);
  const [modalInput, setModalInput] = useState('');

  // Users State
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [adminRequests, setAdminRequests] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedMapMarker, setSelectedMapMarker] = useState(null);
  const [adminMapInstance, setAdminMapInstance] = useState(null);
  const [mapHighPriorityOnly, setMapHighPriorityOnly] = useState(false);
  
  // Audit Log State
  const [auditFilter, setAuditFilter] = useState('All');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

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

  // Field Workers & SMS Assignment State
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [newWorkerData, setNewWorkerData] = useState({
    name: '',
    phone: '',
    department: 'Roads & Potholes',
    age: '',
    city: '',
  });
  const [submittingWorker, setSubmittingWorker] = useState(false);
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');
  const [workerFilterDept, setWorkerFilterDept] = useState('All');

  // Assign Worker Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaintForAssign, setSelectedComplaintForAssign] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assigningWorker, setAssigningWorker] = useState(false);

  const severityValue = { High: 3, Medium: 2, Low: 1 };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    mapIds: GOOGLE_MAPS_IDS,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const fetchComplaints = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
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
      if (isManual) toast.success('Complaints updated');
    } catch (err) {
      console.error("fetchComplaints error:", err);
      toast.error('Failed to load complaints');
    } finally {
      setLoadingComplaints(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  const fetchUsersData = async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, reqsRes] = await Promise.all([
        getUsers(),
        getAdminRequests()
      ]);
      setUsers(usersRes.data || []);
      setAdminRequests(reqsRes.data || []);
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.error("fetchUsersData error:", err);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchWorkersData = async () => {
    setLoadingWorkers(true);
    try {
      const res = await getWorkers();
      setWorkers(res.data || []);
    } catch (err) {
      console.error("fetchWorkersData error:", err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerData.name || !newWorkerData.phone || !newWorkerData.city || !newWorkerData.age) {
      toast.error("Please fill all worker details");
      return;
    }
    setSubmittingWorker(true);
    try {
      await createWorker(newWorkerData);
      toast.success(`Worker "${newWorkerData.name}" registered successfully!`);
      setWorkerModalOpen(false);
      setNewWorkerData({
        name: '',
        phone: '',
        department: 'Roads & Potholes',
        age: '',
        city: '',
      });
      fetchWorkersData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register worker");
    } finally {
      setSubmittingWorker(false);
    }
  };

  const handleDeleteWorker = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove worker "${name}"?`)) return;
    try {
      await deleteWorker(id);
      toast.success("Worker removed successfully");
      fetchWorkersData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove worker");
    }
  };

  const handleStatusChangeWorker = async (id, status) => {
    try {
      await updateWorkerStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchWorkersData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleOpenAssignModal = (complaint) => {
    setSelectedComplaintForAssign(complaint);
    setSelectedWorkerId('');
    setAssignModalOpen(true);
  };

  const handleAssignWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId || !selectedComplaintForAssign) {
      toast.error("Please select a worker to assign");
      return;
    }
    setAssigningWorker(true);
    const complaintId = selectedComplaintForAssign.id || selectedComplaintForAssign._id;
    try {
      const res = await assignWorkerToComplaint(complaintId, selectedWorkerId);
      const chosenWorker = workers.find(w => (w._id || w.id) === selectedWorkerId);
      if (res.data?.smsResult?.success) {
        toast.success(`Assigned to ${chosenWorker?.name || 'Worker'}! SMS alert dispatched 📱`, { duration: 6000 });
      } else {
        toast.error(`Assigned, but SMS failed: ${res.data?.smsResult?.message || 'Gateway error'}`, { duration: 7000 });
      }
      setAssignModalOpen(false);
      setSelectedComplaintForAssign(null);
      setSelectedWorkerId('');
      fetchComplaints();
      fetchWorkersData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign worker");
    } finally {
      setAssigningWorker(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    if (user) {
      fetchUsersData();
      fetchWorkersData();
    }
  }, [user]);

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
        toast.success('Verification updated');
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
      if (complaint.userId && complaint.userId !== 'anonymous') {
        try {
          await updateUserReputation(complaint.userId, 'spam');
        } catch {}
      }
      toast.success('Complaint marked as spam ⚠️');
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
      toast.success('Complaint verified ✅');
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
    }, 1000);
  };

  // --- Bulk Selection & Operations ---
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredComplaints.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredComplaints.map(c => c.id || c._id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Update ${selectedIds.size} complaints to "${newStatus}"?`)) return;

    setBulkActionRunning(true);
    toast.loading(`Updating ${selectedIds.size} complaints...`, { id: 'bulk-toast' });
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(id => updateComplaint(id, { status: newStatus })));
      toast.success(`Successfully updated ${ids.length} complaints to ${newStatus}`, { id: 'bulk-toast' });
      setSelectedIds(new Set());
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to update some complaints', { id: 'bulk-toast' });
    } finally {
      setBulkActionRunning(false);
    }
  };

  // --- Export to CSV ---
  const exportToCSV = (complaintList = complaints) => {
    if (!complaintList || complaintList.length === 0) {
      toast.error('No complaints to export');
      return;
    }
    const headers = ['Complaint ID', 'Problem Type', 'Severity', 'Status', 'Verification', 'Department', 'Reporter Email', 'Created Date', 'Address'];
    const rows = complaintList.map(c => [
      formatComplaintId(c),
      `"${(c.problemType || '').replace(/"/g, '""')}"`,
      c.severity || 'Medium',
      c.status || 'Pending',
      c.verificationStatus || 'Unknown',
      `"${(c.department || getDepartment(c.problemType)).replace(/"/g, '""')}"`,
      c.userEmail || 'Anonymous',
      new Date(c.createdAt).toLocaleDateString(),
      `"${(c.locationAddress || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Civic_Complaints_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${complaintList.length} complaints to CSV 📊`);
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

  const handleAdjustReputation = async (uid, action) => {
    try {
      await updateUserReputation(uid, action);
      toast.success(`Reputation adjusted (${action})`);
      fetchUsersData();
    } catch (err) {
      toast.error('Failed to adjust reputation');
    }
  };

  // --- Analytics Data Prep ---
  const statusCounts = [
    { name: 'Pending', value: complaints.filter(c => c.status === 'Pending').length },
    { name: 'In Progress', value: complaints.filter(c => c.status === 'In Progress').length },
    { name: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length },
  ];

  const priorityCounts = [
    { name: 'High', value: complaints.filter(c => c.severity === 'High').length, color: '#EF4444' },
    { name: 'Medium', value: complaints.filter(c => c.severity === 'Medium').length, color: '#F97316' },
    { name: 'Low', value: complaints.filter(c => c.severity === 'Low').length, color: '#10B981' },
  ];

  const flaggedComplaints = complaints.filter(c => 
    c.spamStatus === 'flagged' || c.verificationStatus === 'Suspicious'
  );

  const spamComplaints = complaints.filter(c => 
    c.spamStatus === 'spam' || c.verificationStatus === 'Spam'
  );

  const resolvedRate = complaints.length > 0 
    ? Math.round((statusCounts[2].value / complaints.length) * 100) 
    : 0;

  // SLA Aging check: Tickets pending for more than 48 hours
  const now = new Date().getTime();
  const agingComplaints = complaints.filter(c => {
    if (c.status === 'Resolved') return false;
    const createdTime = new Date(c.createdAt).getTime();
    return (now - createdTime) > (48 * 3600 * 1000);
  });

  // Department Aggregations
  const departmentStats = useMemo(() => {
    const map = {};
    complaints.forEach(c => {
      const dept = c.department || getDepartment(c.problemType);
      if (!map[dept]) {
        map[dept] = { total: 0, pending: 0, inProgress: 0, resolved: 0, high: 0 };
      }
      map[dept].total += 1;
      if (c.status === 'Pending') map[dept].pending += 1;
      if (c.status === 'In Progress') map[dept].inProgress += 1;
      if (c.status === 'Resolved') map[dept].resolved += 1;
      if (c.severity === 'High') map[dept].high += 1;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data,
      rate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0,
      meta: DEPT_META[name] || DEPT_META['General Municipal Department'],
    })).sort((a, b) => b.total - a.total);
  }, [complaints]);

  // Chronological Audit Log of all actions across complaints
  const auditLogs = useMemo(() => {
    const events = [];
    complaints.forEach(c => {
      const ticketId = formatComplaintId(c);
      // Timeline events
      if (Array.isArray(c.timeline)) {
        c.timeline.forEach(t => {
          events.push({
            id: `${c.id || c._id}-${t.timestamp || Math.random()}`,
            complaintId: c.id || c._id,
            ticketCode: `#${ticketId}`,
            type: t.status === 'Resolved' ? 'resolve' : t.status === 'In Progress' ? 'progress' : 'status',
            title: `Ticket #${ticketId} status updated to ${t.status || 'Updated'}`,
            details: t.message || t.remark || 'Status lifecycle step logged',
            timestamp: t.timestamp ? new Date(t.timestamp) : new Date(c.createdAt),
            user: t.author || 'System Operator',
          });
        });
      }

      // Flagged event
      if (c.spamStatus === 'flagged' || c.verificationStatus === 'Suspicious') {
        events.push({
          id: `flag-${c.id || c._id}`,
          complaintId: c.id || c._id,
          ticketCode: `#${ticketId}`,
          type: 'flag',
          title: `AI Flagged Ticket #${ticketId}`,
          details: c.flagReason || 'Anomaly detected during verification check',
          timestamp: new Date(c.createdAt),
          user: 'AI Guard System',
        });
      }

      // Resolution with proof
      if (c.status === 'Resolved' && c.afterImageUrl) {
        events.push({
          id: `resolved-proof-${c.id || c._id}`,
          complaintId: c.id || c._id,
          ticketCode: `#${ticketId}`,
          type: 'proof',
          title: `Photographic Evidence Attached for #${ticketId}`,
          details: 'Ground resolution verified and uploaded to permanent registry',
          timestamp: new Date(c.updatedAt || c.createdAt),
          user: 'Field Authority Officer',
        });
      }
    });

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [complaints]);

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const rawIdStr = String(c.id || c._id).toLowerCase();
    const formattedIdStr = formatComplaintId(c).toLowerCase();
    const problemTypeStr = String(c.problemType || '').toLowerCase();
    const deptStr = String(c.department || getDepartment(c.problemType)).toLowerCase();
    const searchLower = searchQuery.toLowerCase().replace('#', '');
    const matchesSearch = rawIdStr.includes(searchLower) || formattedIdStr.includes(searchLower) || problemTypeStr.includes(searchLower) || deptStr.includes(searchLower);
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchesSeverity = filterSeverity === 'All' || c.severity === filterSeverity;
    const matchesDept = filterDepartment === 'All' || (c.department || getDepartment(c.problemType)) === filterDepartment;
    return matchesSearch && matchesStatus && matchesSeverity && matchesDept;
  });

  // Filter users
  const filteredUsers = users.filter(u => {
    const nameStr = String(u.name || '').toLowerCase();
    const emailStr = String(u.email || '').toLowerCase();
    const searchLower = userSearchQuery.toLowerCase();
    return nameStr.includes(searchLower) || emailStr.includes(searchLower);
  });

  // Filter workers
  const filteredWorkers = workers.filter(w => {
    const nameStr = String(w.name || '').toLowerCase();
    const phoneStr = String(w.phone || '');
    const cityStr = String(w.city || '').toLowerCase();
    const query = workerSearchQuery.toLowerCase();
    const matchesSearch = !query || nameStr.includes(query) || phoneStr.includes(query) || cityStr.includes(query);
    const matchesDept = workerFilterDept === 'All' || w.department === workerFilterDept;
    return matchesSearch && matchesDept;
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesType = auditFilter === 'All' || log.type === auditFilter;
    const query = auditSearchQuery.toLowerCase();
    const matchesQuery = !query || log.ticketCode.toLowerCase().includes(query) || log.title.toLowerCase().includes(query) || log.details.toLowerCase().includes(query);
    return matchesType && matchesQuery;
  });

  if (loadingComplaints) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center pt-8 text-[#0F172A]">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#0284C7]/10 border border-[#BAE6FD] flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-8 h-8 text-[#0284C7]" />
          </div>
        </div>
        <p className="text-sm font-semibold text-[#64748B] mt-4">
          Loading Administration Console...
        </p>
      </div>
    );
  }

  const SidebarItem = ({ id, icon: Icon, label, badge = null, badgeVariant = 'default' }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold text-xs cursor-pointer group ${
          isActive 
            ? 'bg-[#0284C7] text-white shadow-sm' 
            : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
          <span>{label}</span>
        </div>
        {badge !== null && badge > 0 && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            isActive 
              ? 'bg-white/25 text-white' 
              : badgeVariant === 'danger' 
                ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]' 
                : 'bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]'
          }`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#334155] pt-4 sm:pt-6 px-3 sm:px-6 lg:px-8 max-w-[1520px] mx-auto pb-16 flex flex-col md:flex-row gap-6 relative">
      
      {/* Hidden Print Container for PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printingComplaint && <PDFReport ref={pdfRef} complaint={printingComplaint} />}
      </div>

      {/* Modern SaaS Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-white p-4 h-fit sticky md:top-20 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col space-y-4">
        <div>
          {/* Header */}
          <div className="pb-3 mb-2.5 border-b border-[#E2E8F0] flex items-center justify-between px-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#0F172A] text-sm leading-tight">Admin System</h2>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-[#64748B]">v2.4 Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <SidebarItem id="dashboard" icon={BarChart3} label="Dashboard" />
            <SidebarItem id="complaints" icon={AlertTriangle} label="Complaints" badge={complaints.length} />
            <SidebarItem id="departments" icon={Building2} label="Departments" badge={departmentStats.length} />
            <SidebarItem id="workers" icon={HardHat} label="Field Workers" badge={workers.length} />
            <SidebarItem id="flagged" icon={Shield} label="Flagged Queue" badge={flaggedComplaints.length + spamComplaints.length} badgeVariant="danger" />
            <SidebarItem id="map" icon={Map} label="Map Clustering" />
            <SidebarItem id="users" icon={Users} label="Access & Roles" badge={adminRequests.length} badgeVariant="danger" />
            <SidebarItem id="audit" icon={History} label="Audit Activity" />
          </nav>
        </div>

        {/* Bottom SLA & Resolution Cards - seated right below Audit Activity */}
        <div className="pt-3 border-t border-[#E2E8F0] px-1 hidden md:block space-y-2.5">
          {agingComplaints.length > 0 && (
            <div className="bg-[#FFF1F2] rounded-xl p-2.5 border border-[#FECDD3] flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-[#E11D48] shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#9F1239] uppercase leading-tight">SLA Warning</p>
                <p className="text-[11px] text-[#E11D48] font-semibold truncate">{agingComplaints.length} tickets &gt; 48h aging</p>
              </div>
            </div>
          )}

          <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Resolution Rate</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-extrabold text-[#0F172A]">{resolvedRate}%</span>
              <span className="text-xs font-semibold text-emerald-600">
                {statusCounts[2].value} / {complaints.length}
              </span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-[#16A34A] h-full rounded-full transition-all duration-500"
                style={{ width: `${resolvedRate}%` }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-6 overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <div>
                  <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Analytics Overview</h1>
                  <p className="text-sm text-[#64748B] mt-0.5">Live operational telemetry, status distribution, and priority metrics</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => exportToCSV(complaints)}
                    className="flex items-center space-x-2 px-3.5 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Export CSV</span>
                  </button>
                  <button 
                    onClick={() => fetchComplaints(true)}
                    disabled={isRefreshing}
                    className="flex items-center space-x-2 px-3.5 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('complaints')}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Manage Issues</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Stat Cards Grid (6 KPI Metrics) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard 
                  value={complaints.length} 
                  label="Total Issues" 
                  subtext="All logged reports"
                  icon={Activity} 
                  variant="blue" 
                  delay={0} 
                />
                <StatCard 
                  value={statusCounts[0].value} 
                  label="Pending" 
                  subtext="Awaiting review"
                  icon={Clock} 
                  variant="amber" 
                  trend={statusCounts[0].value > 0 ? `${statusCounts[0].value} open` : 'None'}
                  delay={0.05} 
                />
                <StatCard 
                  value={statusCounts[1].value} 
                  label="In Progress" 
                  subtext="Active mitigation"
                  icon={TrendingUp} 
                  variant="indigo" 
                  delay={0.1} 
                />
                <StatCard 
                  value={statusCounts[2].value} 
                  label="Resolved" 
                  subtext="Completed tickets"
                  icon={CheckCircle2} 
                  variant="emerald" 
                  trend={`${resolvedRate}% rate`}
                  delay={0.15} 
                />
                <StatCard 
                  value={flaggedComplaints.length} 
                  label="Flagged" 
                  subtext="AI anomalies"
                  icon={AlertTriangle} 
                  variant="rose" 
                  trend={flaggedComplaints.length > 0 ? 'Action needed' : 'Clean'}
                  delay={0.2} 
                />
                <StatCard 
                  value={spamComplaints.length} 
                  label="Spam / Rejected" 
                  subtext="Filtered complaints"
                  icon={Shield} 
                  variant="purple" 
                  delay={0.25} 
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Donut Chart: Status Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">Complaints by Status</h3>
                      <p className="text-xs text-[#64748B]">Operational lifecycle breakdown</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-[#F0F9FF] text-[#0284C7] rounded-full border border-[#BAE6FD]">
                      {complaints.length} Total
                    </span>
                  </div>
                  
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height={256} minWidth={0}>
                      <PieChart>
                        <Pie
                          data={statusCounts}
                          cx="50%" 
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        >
                          {statusCounts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '12px', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#0F172A'
                          }} 
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          iconType="circle"
                          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Pills */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#F1F5F9]">
                    <div className="text-center p-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                      <p className="text-[11px] font-semibold text-[#D97706]">Pending</p>
                      <p className="text-lg font-bold text-[#92400E]">{statusCounts[0].value}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD]">
                      <p className="text-[11px] font-semibold text-[#0284C7]">In Progress</p>
                      <p className="text-lg font-bold text-[#0369A1]">{statusCounts[1].value}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                      <p className="text-[11px] font-semibold text-[#16A34A]">Resolved</p>
                      <p className="text-lg font-bold text-[#166534]">{statusCounts[2].value}</p>
                    </div>
                  </div>
                </div>

                {/* Bar Chart: Priority Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">Priority Distribution</h3>
                      <p className="text-xs text-[#64748B]">Triage breakdown by urgency</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-[#FFF1F2] text-[#E11D48] rounded-full border border-[#FECDD3]">
                      {priorityCounts[0].value} High Urgency
                    </span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height={256} minWidth={0}>
                      <BarChart data={priorityCounts} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94A3B8" 
                          tick={{ fontSize: 12, fontWeight: 600, fill: '#64748B' }} 
                        />
                        <YAxis 
                          stroke="#94A3B8" 
                          tick={{ fontSize: 12, fill: '#64748B' }} 
                          allowDecimals={false} 
                        />
                        <RechartsTooltip 
                          cursor={{ fill: '#F8FAFC' }}
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '12px', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#0F172A'
                          }} 
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {priorityCounts.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={PRIORITY_COLORS[entry.name]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Pills */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#F1F5F9]">
                    <div className="text-center p-2 rounded-xl bg-[#FFF1F2] border border-[#FECDD3]">
                      <p className="text-[11px] font-semibold text-[#E11D48]">High</p>
                      <p className="text-lg font-bold text-[#9F1239]">{priorityCounts[0].value}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5]">
                      <p className="text-[11px] font-semibold text-[#EA580C]">Medium</p>
                      <p className="text-lg font-bold text-[#9A3412]">{priorityCounts[1].value}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
                      <p className="text-[11px] font-semibold text-[#059669]">Low</p>
                      <p className="text-lg font-bold text-[#065F46]">{priorityCounts[2].value}</p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: COMPLAINTS MODERATION TABLE WITH BULK ACTIONS */}
          {activeTab === 'complaints' && (
            <motion.div 
              key="complaints" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-6"
            >
              {/* Header & Filter Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Complaint Moderation Center</h2>
                    <p className="text-xs text-[#64748B]">Review incoming citizen reports, adjust resolution states, dispatch notifications, and bulk triage</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B]">
                    <button
                      onClick={() => exportToCSV(filteredComplaints)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD] hover:bg-[#E0F2FE] transition cursor-pointer"
                      title="Export current view to CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <span className="px-3 py-1.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      {filteredComplaints.length} of {complaints.length} issues
                    </span>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
                  {/* Search Input */}
                  <div className="relative w-full lg:w-80">
                    <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      type="text"
                      placeholder="Search ID, Category, User, or Department..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-all"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                    <Filter className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    <span className="text-xs text-[#64748B] font-medium shrink-0">Status:</span>
                    {['All', 'Pending', 'In Progress', 'Resolved'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setFilterStatus(filter)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                          filterStatus === filter 
                            ? 'bg-[#0284C7] text-white shadow-xs' 
                            : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                    <div className="h-4 w-[1px] bg-[#E2E8F0] mx-1" />
                    <span className="text-xs text-[#64748B] font-medium shrink-0">Severity:</span>
                    {['All', 'High', 'Medium', 'Low'].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setFilterSeverity(sev)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                          filterSeverity === sev 
                            ? 'bg-[#0F172A] text-white' 
                            : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Department Secondary Filter Bar */}
                {departmentStats.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#F8FAFC]">
                    <span className="text-[11px] font-bold text-[#64748B] shrink-0 mr-1">Dept:</span>
                    <button
                      onClick={() => setFilterDepartment('All')}
                      className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold shrink-0 cursor-pointer transition ${
                        filterDepartment === 'All' 
                          ? 'bg-[#0F172A] text-white' 
                          : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      All Departments
                    </button>
                    {departmentStats.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => setFilterDepartment(d.name)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold shrink-0 cursor-pointer transition flex items-center space-x-1 ${
                          filterDepartment === d.name 
                            ? 'bg-[#0284C7] text-white' 
                            : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        <span>{d.meta.icon}</span>
                        <span>{d.name.replace(' Department', '')}</span>
                        <span className="ml-1 opacity-75">({d.total})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Data Table Card */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 pl-6 pr-3 w-12 text-center">
                          <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                          >
                            {selectedIds.size > 0 && selectedIds.size === filteredComplaints.length ? (
                              <CheckSquare className="w-4 h-4 text-[#0284C7]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="py-3.5 px-4 w-80">Report Details</th>
                        <th className="py-3.5 px-4 text-center w-36">AI Validation</th>
                        <th className="py-3.5 px-4 text-center w-40">Status</th>
                        <th className="py-3.5 px-4 text-center w-32">Department</th>
                        <th className="py-3.5 px-6 text-right w-44">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] text-xs">
                      {filteredComplaints.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-12 text-center text-[#94A3B8]">
                            <AlertCircle className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-50" />
                            <p className="font-semibold text-sm text-[#0F172A]">No complaints match your criteria</p>
                            <p className="text-xs text-[#64748B] mt-0.5">Try adjusting your search query or status filter.</p>
                          </td>
                        </tr>
                      ) : filteredComplaints.map((c) => {
                        const isSelected = selectedIds.has(c.id || c._id);
                        const isAging = c.status !== 'Resolved' && (now - new Date(c.createdAt).getTime()) > (48 * 3600 * 1000);
                        const deptName = c.department || getDepartment(c.problemType);
                        const deptMeta = DEPT_META[deptName] || DEPT_META['General Municipal Department'];

                        return (
                          <tr 
                            key={c.id || c._id} 
                            className={`transition-colors group cursor-pointer ${isSelected ? 'bg-[#F0F9FF]/50' : 'hover:bg-[#F8FAFC]'}`}
                            onClick={() => navigate(`/details/${c.id || c._id}`)}
                          >
                            {/* Checkbox */}
                            <td className="py-4 pl-6 pr-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => toggleSelectOne(c.id || c._id)}
                                className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#0284C7]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            {/* Issue Details */}
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3.5">
                                <img 
                                  src={c.imageUrl} 
                                  alt="Issue" 
                                  className="w-12 h-12 rounded-xl object-cover border border-[#E2E8F0] shadow-2xs shrink-0" 
                                  crossOrigin="anonymous"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <p className="font-bold text-sm text-[#0F172A] truncate group-hover:text-[#0284C7] transition-colors">
                                      {c.problemType || 'Civic Issue'}
                                    </p>
                                    {isAging && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200" title="Ticket unresolved over 48 hours">
                                        &gt;48h
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                                    <span className="truncate max-w-[130px]">{c.userEmail || c.userName || 'Anonymous'}</span>
                                    <span>•</span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const shortId = '#' + formatComplaintId(c);
                                        copyToClipboard(shortId);
                                        setCopiedId(c.id || c._id);
                                        setTimeout(() => setCopiedId(null), 2000);
                                      }}
                                      className="flex items-center gap-1 font-mono text-[10px] bg-[#F1F5F9] hover:bg-[#E2E8F0] px-1.5 py-0.5 rounded text-[#334155] transition-colors cursor-pointer"
                                      title="Copy ID"
                                    >
                                      #{formatComplaintId(c)}
                                      {copiedId === (c.id || c._id) ? (
                                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-2.5 h-2.5 text-[#94A3B8]" />
                                      )}
                                    </button>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                      c.severity === 'High' ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]' : 
                                      c.severity === 'Medium' ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]' : 
                                      'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                                    }`}>
                                      {c.severity || 'Medium'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* AI Validation Status */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${
                                  c.verificationStatus === 'Approved manually' || c.verificationStatus === 'Verified'
                                    ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' 
                                    : c.verificationStatus === 'Rejected manually' || c.verificationStatus === 'Rejected'
                                      ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]'
                                      : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                                }`}>
                                  {c.verificationStatus || 'Pending'}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openVerificationModal(c, 'Approved manually'); }} 
                                    title="Approve manually" 
                                    className="p-1 hover:bg-[#F0FDF4] text-emerald-600 rounded transition cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5"/>
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openVerificationModal(c, 'Rejected manually'); }} 
                                    title="Reject manually" 
                                    className="p-1 hover:bg-[#FFF1F2] text-rose-600 rounded transition cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5"/>
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Status Dropdown */}
                            <td className="py-4 px-4 text-center">
                              <select 
                                onClick={(e) => e.stopPropagation()}
                                value={c.status}
                                onChange={(e) => handleStatusChange(c.id || c._id, c.status, e.target.value)}
                                className={`text-[11px] font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer border shadow-2xs transition-all ${
                                  c.status === 'Resolved' 
                                    ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]' 
                                    : c.status === 'In Progress' 
                                      ? 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]' 
                                      : c.status === 'Assigned'
                                        ? 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]'
                                        : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                                }`}
                              >
                                <option value="Pending" className="bg-white text-[#92400E]">Pending</option>
                                <option value="Assigned" className="bg-white text-[#4F46E5]">Assigned</option>
                                <option value="In Progress" className="bg-white text-[#0369A1]">In Progress</option>
                                <option value="Resolved" className="bg-white text-[#166534]">Resolved</option>
                              </select>
                              {c.assignedWorkerName && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md" title={`Worker Phone: +91 ${c.assignedWorkerPhone}`}>
                                    <HardHat className="w-2.5 h-2.5" />
                                    {c.assignedWorkerName}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Department Info */}
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${deptMeta.bg} ${deptMeta.text} border ${deptMeta.border}`}>
                                <span>{deptMeta.icon}</span>
                                <span className="truncate max-w-[110px]">{deptName.replace(' Department', '')}</span>
                              </span>
                            </td>

                            {/* Moderator Action Buttons */}
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenAssignModal(c); }} 
                                  className="p-2 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] hover:bg-[#4F46E5] hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs" 
                                  title={c.assignedWorkerName ? `Assigned to ${c.assignedWorkerName} (+91 ${c.assignedWorkerPhone}) - Click to Reassign` : "Assign Worker & Dispatch SMS"}
                                >
                                  <HardHat className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleSendEmail(c); }} 
                                  className="p-2 bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] hover:bg-[#16A34A] hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs" 
                                  title="Send Resolution Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openLetterModal(c); }} 
                                  className="p-2 bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD] hover:bg-[#0284C7] hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs" 
                                  title="View Formal Letter"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); downloadPDF(c); }} 
                                  className="p-2 bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#0F172A] hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs" 
                                  title="Download PDF Docket"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteComplaint(c.id || c._id); }} 
                                  className="p-2 bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] hover:bg-[#E11D48] hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs" 
                                  title="Delete Complaint"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Floating Bulk Actions Dock */}
              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4"
                  >
                    <div className="flex items-center gap-2 pr-3 border-r border-white/20">
                      <CheckCheck className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold whitespace-nowrap">
                        {selectedIds.size} {selectedIds.size === 1 ? 'ticket' : 'tickets'} selected
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBulkStatusChange('In Progress')}
                        disabled={bulkActionRunning}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Set In Progress
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange('Resolved')}
                        disabled={bulkActionRunning}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Set Resolved
                      </button>
                      <button
                        onClick={() => exportToCSV(complaints.filter(c => selectedIds.has(c.id || c._id)))}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export Selected</span>
                      </button>
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer ml-1"
                        title="Deselect All"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TAB 3: DEPARTMENTS BREAKDOWN & WORKLOAD */}
          {activeTab === 'departments' && (
            <motion.div 
              key="departments" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-6"
            >
              {/* Header */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Department Workload & SLA Allocation</h2>
                    <p className="text-xs text-[#64748B]">Cross-department civic agency ticket distribution and resolution efficiency</p>
                  </div>
                </div>
                <button
                  onClick={() => exportToCSV(complaints)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-xs font-semibold transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Export Department Report</span>
                </button>
              </div>

              {/* Department Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {departmentStats.map((d) => (
                  <div 
                    key={d.name}
                    className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Department Title */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-2xl">{d.meta.icon}</span>
                          <div>
                            <h3 className="font-bold text-sm text-[#0F172A] leading-tight">
                              {d.name.replace(' Department', '')}
                            </h3>
                            <p className="text-[11px] text-[#64748B]">Municipal Branch</p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                          {d.total} {d.total === 1 ? 'ticket' : 'tickets'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="my-3">
                        <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                          <span className="text-[#64748B]">Resolution Efficiency</span>
                          <span className="text-emerald-600">{d.rate}%</span>
                        </div>
                        <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-[#16A34A] h-full transition-all duration-500" 
                            style={{ width: `${d.rate}%` }} 
                            title={`Resolved: ${d.resolved}`}
                          />
                          <div 
                            className="bg-[#0284C7] h-full transition-all duration-500" 
                            style={{ width: `${d.total > 0 ? (d.inProgress / d.total) * 100 : 0}%` }} 
                            title={`In Progress: ${d.inProgress}`}
                          />
                        </div>
                      </div>

                      {/* Counts Deck */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        <div className="p-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                          <p className="text-[10px] font-bold text-[#D97706] uppercase">Pending</p>
                          <p className="text-base font-extrabold text-[#92400E] mt-0.5">{d.pending}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD]">
                          <p className="text-[10px] font-bold text-[#0284C7] uppercase">Active</p>
                          <p className="text-base font-extrabold text-[#0369A1] mt-0.5">{d.inProgress}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                          <p className="text-[10px] font-bold text-[#16A34A] uppercase">Resolved</p>
                          <p className="text-base font-extrabold text-[#166534] mt-0.5">{d.resolved}</p>
                        </div>
                      </div>
                    </div>

                    {/* Filter Shortcut */}
                    <button
                      onClick={() => {
                        setFilterDepartment(d.name);
                        setActiveTab('complaints');
                      }}
                      className="mt-5 w-full py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F0F9FF] text-[#0284C7] border border-[#E2E8F0] hover:border-[#BAE6FD] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Filter Tickets ({d.total})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: FIELD WORKERS & SMS DISPATCH */}
          {activeTab === 'workers' && (
            <motion.div 
              key="workers" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 bg-[#EEF2FF] text-[#4F46E5] rounded-xl border border-[#C7D2FE]">
                      <HardHat className="w-5 h-5" />
                    </span>
                    <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Field Force & SMS Dispatch</h2>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">Register municipal field staff and assign complaints with instant SMS alerts directly to their mobile phones.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWorkerModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#4F46E5] text-white hover:bg-[#4338CA] transition font-semibold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Worker</span>
                  </button>
                </div>
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                  <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Staff</p>
                  <p className="text-2xl font-extrabold text-[#0F172A] mt-1">{workers.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active on Duty</p>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-1">{workers.filter(w => w.status === 'Active').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Assigned Tasks</p>
                  <p className="text-2xl font-extrabold text-indigo-700 mt-1">{complaints.filter(c => c.status === 'Assigned').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                  <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Busy / On Task</p>
                  <p className="text-2xl font-extrabold text-amber-700 mt-1">{workers.filter(w => w.status === 'Busy').length}</p>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by worker name, phone, city..."
                    value={workerSearchQuery}
                    onChange={(e) => setWorkerSearchQuery(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#4F46E5]"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={workerFilterDept}
                    onChange={(e) => setWorkerFilterDept(e.target.value)}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#0F172A] outline-none cursor-pointer"
                  >
                    <option value="All">All Departments</option>
                    <option value="Roads & Potholes">Roads & Potholes</option>
                    <option value="Solid Waste Management">Solid Waste Management</option>
                    <option value="Street Lighting & Electrical">Street Lighting & Electrical</option>
                    <option value="Water & Sewage">Water & Sewage</option>
                    <option value="Parks & Public Amenities">Parks & Public Amenities</option>
                    <option value="General Municipal Department">General Municipal Department</option>
                  </select>
                </div>
              </div>

              {/* Workers Directory Table */}
              <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-6 font-semibold">Worker Name</th>
                      <th className="py-3.5 px-4 font-semibold">Department</th>
                      <th className="py-3.5 px-4 font-semibold">Mobile (SMS Dispatch)</th>
                      <th className="py-3.5 px-4 font-semibold">Age & City</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Active Tasks</th>
                      <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-xs">
                    {loadingWorkers ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-[#94A3B8]">Loading field workers...</td>
                      </tr>
                    ) : filteredWorkers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-10 text-center">
                          <HardHat className="w-10 h-10 text-[#CBD5E1] mx-auto mb-2" />
                          <p className="text-sm font-bold text-[#0F172A]">No field workers found</p>
                          <p className="text-xs text-[#94A3B8] mt-1">Register municipal field staff to enable SMS-based task dispatch.</p>
                          <button
                            onClick={() => setWorkerModalOpen(true)}
                            className="mt-4 px-4 py-2 bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            + Register Field Worker
                          </button>
                        </td>
                      </tr>
                    ) : filteredWorkers.map((w) => (
                      <tr key={w._id || w.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] shrink-0 font-bold text-xs">
                              {w.name?.charAt(0)?.toUpperCase() || 'W'}
                            </div>
                            <div>
                              <p className="font-bold text-[#0F172A]">{w.name}</p>
                              <p className="text-[10px] text-[#94A3B8]">ID: #{String(w._id || w.id).slice(-5)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]">
                            {w.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-lg font-bold">
                            <Phone className="w-3 h-3 text-[#16A34A]" />
                            +91 {w.phone}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[#475569] font-medium">{w.age} yrs • <span className="font-bold text-[#0F172A]">{w.city}</span></span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={w.status || 'Active'}
                            onChange={(e) => handleStatusChangeWorker(w._id || w.id, e.target.value)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full outline-none border cursor-pointer ${
                              w.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : w.status === 'Busy'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            <option value="Active">Active</option>
                            <option value="Busy">Busy</option>
                            <option value="On-Leave">On-Leave</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] font-extrabold text-xs">
                            {w.activeTasksCount || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleDeleteWorker(w._id || w.id, w.name)}
                            className="p-1.5 bg-[#FFF1F2] text-[#E11D48] hover:bg-[#E11D48] hover:text-white rounded-lg transition cursor-pointer"
                            title="Remove Worker"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 4: FLAGGED & ANOMALY QUEUE */}
          {activeTab === 'flagged' && (
            <motion.div 
              key="flagged" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#E11D48]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">AI Flagged & Anomaly Moderation</h2>
                    <p className="text-xs text-[#64748B]">Reports with detected duplicates, distance anomalies, or low confidence scores</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-[#FFF7ED] text-[#EA580C] font-bold border border-[#FFEDD5]">
                    {flaggedComplaints.length} Suspicious
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#FFF1F2] text-[#E11D48] font-bold border border-[#FECDD3]">
                    {spamComplaints.length} Spam
                  </span>
                </div>
              </div>

              {/* Moderation Cards */}
              {flaggedComplaints.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-[#E2E8F0] shadow-xs">
                  <CheckCircle2 className="w-12 h-12 text-[#16A34A] mx-auto mb-3 opacity-70" />
                  <h3 className="text-lg font-bold text-[#0F172A] mb-1">Queue Clear</h3>
                  <p className="text-xs text-[#64748B]">No flagged complaints currently pending administrative review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedComplaints.map((c) => (
                    <div
                      key={c.id || c._id}
                      className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#BAE6FD] shadow-xs hover:shadow-md transition-all overflow-hidden p-6 cursor-pointer"
                      onClick={() => navigate(`/details/${c.id || c._id}`)}
                    >
                      <div className="flex flex-col md:flex-row items-start gap-5">
                        {/* Image Preview */}
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden shrink-0 border border-[#E2E8F0]">
                          <img src={c.imageUrl} alt="Issue" className="w-full h-full object-cover" crossOrigin="anonymous" />
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-rose-600/90 backdrop-blur text-[9px] font-bold rounded text-white shadow-xs">
                            FLAGGED
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-[#0F172A] text-base">{c.problemType}</h4>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                              c.severity === 'High' ? 'bg-[#FFF1F2] text-[#E11D48]' : 'bg-[#FFF7ED] text-[#EA580C]'
                            }`}>
                              {c.severity} Priority
                            </span>
                          </div>

                          <p className="text-xs text-[#64748B] mb-3 line-clamp-2">{c.description}</p>

                          {/* Flag Reason Callout */}
                          <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-xl px-3.5 py-2.5 mb-3">
                            <p className="text-[10px] font-bold text-[#9F1239] uppercase tracking-wider mb-0.5">⚠️ Anomaly Reason</p>
                            <p className="text-xs font-semibold text-[#E11D48]">{c.flagReason || 'Flagged by automated heuristic detection'}</p>
                          </div>

                          {/* Validation Checks */}
                          <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                            <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                              <p className="text-[10px] font-semibold text-[#64748B] mb-0.5">Image Authenticity</p>
                              <p className={`font-bold ${c.imageValidation?.isValid === false ? 'text-[#E11D48]' : 'text-[#16A34A]'}`}>
                                {c.imageValidation?.isValid === false ? '❌ Flagged' : '✅ Verified'}
                              </p>
                            </div>
                            <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                              <p className="text-[10px] font-semibold text-[#64748B] mb-0.5">Location Radius</p>
                              <p className={`font-bold ${c.locationVerified ? 'text-[#16A34A]' : 'text-[#EA580C]'}`}>
                                {c.locationVerified ? '✅ In Bounds' : `⚠️ ${c.locationDistance || 0}km away`}
                              </p>
                            </div>
                            <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                              <p className="text-[10px] font-semibold text-[#64748B] mb-0.5">Category Match</p>
                              <p className={`font-bold ${c.categoryMatch?.matches === false ? 'text-[#E11D48]' : 'text-[#16A34A]'}`}>
                                {c.categoryMatch?.matches === false ? '❌ Mismatch' : '✅ Consistent'}
                              </p>
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                            <User className="w-3 h-3" />
                            <span>{c.userName || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{c.userEmail || 'No email provided'}</span>
                            <span>•</span>
                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#F1F5F9]">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApproveComplaint(c); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F0FDF4] text-[#16A34A] hover:bg-[#16A34A] hover:text-white border border-[#BBF7D0] transition-all font-semibold text-xs cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Issue
                        </button>
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRejectComplaint(c); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FFFBEB] text-[#D97706] hover:bg-[#D97706] hover:text-white border border-[#FDE68A] transition-all font-semibold text-xs cursor-pointer shadow-2xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkSpam(c); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FFF1F2] text-[#E11D48] hover:bg-[#E11D48] hover:text-white border border-[#FECDD3] transition-all font-semibold text-xs cursor-pointer shadow-2xs"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Mark Spam
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteComplaint(c.id || c._id); }}
                          className="py-2.5 px-3.5 rounded-xl bg-[#F8FAFC] text-[#64748B] hover:bg-[#FFF1F2] hover:text-[#E11D48] border border-[#E2E8F0] transition-all cursor-pointer shadow-2xs"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: MAP CLUSTERING & GEOGRAPHIC VIEW */}
          {activeTab === 'map' && (
            <motion.div 
              key="map" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-4 h-[calc(100vh-130px)] flex flex-col"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0F172A]">Geographic Map Validation</h2>
                    <p className="text-xs text-[#64748B]">Interactive geospatial pin cluster for localized incident resolution</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMapHighPriorityOnly(!mapHighPriorityOnly)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      mapHighPriorityOnly 
                        ? 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]' 
                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                    }`}
                  >
                    {mapHighPriorityOnly ? '⚠️ High Priority Only' : 'Show All Priorities'}
                  </button>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                    {statusCounts[0].value} Pending
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                    {statusCounts[2].value} Resolved
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-xs relative">
                {!isLoaded ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC]">
                    <div className="w-8 h-8 border-3 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={defaultCenter}
                    zoom={11}
                    options={{ disableDefaultUI: false, mapId: 'civic_map' }}
                    onLoad={(map) => setAdminMapInstance(map)}
                  >
                    {adminMapInstance && complaints
                      .filter(c => !mapHighPriorityOnly || c.severity === 'High')
                      .map(c => {
                        if (!c.location || !c.location.lat) return null;
                        return (
                          <AdvancedMarker
                            key={c.id || c._id}
                            map={adminMapInstance}
                            position={{ lat: c.location.lat, lng: c.location.lng }}
                            onClick={() => setSelectedMapMarker(c)}
                          />
                        );
                      })}

                    {selectedMapMarker && (
                      <InfoWindowF
                        position={{ lat: selectedMapMarker.location.lat, lng: selectedMapMarker.location.lng }}
                        onCloseClick={() => setSelectedMapMarker(null)}
                      >
                        <div className="p-2 max-w-[220px] text-[#0F172A]">
                          <p className="font-bold text-sm mb-1">{selectedMapMarker.problemType}</p>
                          <p className="text-xs text-[#64748B] line-clamp-2">{selectedMapMarker.locationAddress || 'No street details'}</p>
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              selectedMapMarker.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                              selectedMapMarker.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {selectedMapMarker.status}
                            </span>
                            <button
                              onClick={() => navigate(`/details/${selectedMapMarker.id || selectedMapMarker._id}`)}
                              className="text-[10px] font-semibold text-[#0284C7] hover:underline cursor-pointer"
                            >
                              Inspect Details →
                            </button>
                          </div>
                        </div>
                      </InfoWindowF>
                    )}
                  </GoogleMap>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 6: ACCESS CONTROL, REPUTATION & USERS */}
          {activeTab === 'users' && (
            <motion.div 
              key="users" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-6"
            >
              {/* Header */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">User Access & Citizen Credibility</h2>
                  <p className="text-xs text-[#64748B]">Manage administrative privileges, review elevation requests, and manage citizen reliability ratings</p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search citizens & admins..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {/* Pending Admin Requests Section */}
              {adminRequests.length > 0 && (
                <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-[#9F1239] mb-3 flex items-center">
                    <Shield className="w-4 h-4 text-[#E11D48] mr-2" /> 
                    Pending Admin Elevation Requests ({adminRequests.length})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {adminRequests.map((req) => (
                      <div key={req.id} className="bg-white p-4 rounded-xl flex items-center justify-between border border-[#FECDD3] shadow-2xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-[#0F172A] text-xs truncate">{req.name}</p>
                          <p className="text-[11px] text-[#64748B] truncate">{req.email}</p>
                        </div>
                        <div className="flex space-x-1.5 shrink-0">
                          <button 
                            onClick={() => handleApproveRequest(req.uid, req.name)} 
                            className="p-1.5 bg-[#F0FDF4] text-[#16A34A] hover:bg-[#16A34A] hover:text-white rounded-lg transition cursor-pointer"
                            title="Approve Admin Access"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(req.uid, req.name)} 
                            className="p-1.5 bg-[#FFF1F2] text-[#E11D48] hover:bg-[#E11D48] hover:text-white rounded-lg transition cursor-pointer"
                            title="Reject Request"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Directory Table */}
              <div className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-6 font-semibold">User Details</th>
                      <th className="py-3.5 px-4 font-semibold">Role</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Citizen Credibility</th>
                      <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-xs">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-[#94A3B8]">Loading user registry...</td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-[#94A3B8]">No users found matching query.</td>
                      </tr>
                    ) : filteredUsers.map((u) => {
                      const rep = u.reputation ?? 100;
                      const repTier = rep >= 90 ? 'Trusted Citizen ⭐' : rep >= 60 ? 'Verified' : 'Under Review ⚠️';
                      const repColor = rep >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : rep >= 60 ? 'text-sky-700 bg-sky-50 border-sky-200' : 'text-rose-700 bg-rose-50 border-rose-200';

                      return (
                        <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3.5 px-6">
                            <p className="font-bold text-[#0F172A]">{u.name || 'Anonymous User'}</p>
                            <p className="text-[11px] text-[#64748B]">{u.email}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              u.role === 'admin' 
                                ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]' 
                                : 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                            }`}>
                              {u.role === 'admin' ? 'Administrator' : 'Citizen'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${repColor}`}>
                              {repTier} ({rep}pts)
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {u.role === 'admin' ? (
                                <button 
                                  onClick={() => handleDemote(u.uid, u.name)} 
                                  disabled={u.uid === userData?.uid} 
                                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#F8FAFC] text-[#64748B] hover:bg-[#FFF1F2] hover:text-[#E11D48] border border-[#E2E8F0] disabled:opacity-40 transition-colors cursor-pointer"
                                >
                                  Demote
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handlePromote(u.uid, u.name)} 
                                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#F0F9FF] text-[#0284C7] hover:bg-[#0284C7] hover:text-white border border-[#BAE6FD] transition-colors cursor-pointer"
                                >
                                  Make Admin
                                </button>
                              )}
                              <button
                                onClick={() => handleAdjustReputation(u.uid, 'valid')}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] hover:bg-[#16A34A] hover:text-white transition cursor-pointer"
                                title="Boost reputation score"
                              >
                                +10 Rep
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 7: AUDIT LOG & RECENT SYSTEM ACTIVITY */}
          {activeTab === 'audit' && (
            <motion.div 
              key="audit" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-6"
            >
              {/* Header */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Incident Audit Log & System Activity</h2>
                    <p className="text-xs text-[#64748B]">Real-time chronological audit trail of complaint lifecycle transitions and administrative actions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-56">
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      type="text"
                      placeholder="Search activity..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7]"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['All', 'resolve', 'progress', 'flag', 'proof'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setAuditFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer capitalize ${
                      auditFilter === filter 
                        ? 'bg-[#0284C7] text-white' 
                        : 'bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0]'
                    }`}
                  >
                    {filter === 'All' ? 'All Activity' : filter === 'resolve' ? 'Resolutions' : filter === 'progress' ? 'Status Updates' : filter === 'flag' ? 'AI Flags' : 'Evidence Uploads'}
                  </button>
                ))}
              </div>

              {/* Activity Timeline List */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-6">
                {filteredAuditLogs.length === 0 ? (
                  <div className="py-12 text-center text-[#94A3B8]">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-[#0F172A]">No activity entries match your filter</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-[#E2E8F0] ml-4 pl-6 space-y-6">
                    {filteredAuditLogs.map((item) => (
                      <div key={item.id} className="relative group">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                          item.type === 'resolve' ? 'bg-[#16A34A]' :
                          item.type === 'flag' ? 'bg-[#E11D48]' :
                          item.type === 'proof' ? 'bg-[#9333EA]' :
                          'bg-[#0284C7]'
                        }`} />

                        <div className="bg-[#F8FAFC] hover:bg-[#F1F5F9] p-4 rounded-xl border border-[#E2E8F0] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#0284C7] bg-[#F0F9FF] px-2 py-0.5 rounded border border-[#BAE6FD]">
                                {item.ticketCode}
                              </span>
                              <h4 className="font-bold text-sm text-[#0F172A]">{item.title}</h4>
                            </div>
                            <p className="text-xs text-[#64748B] mt-1">{item.details}</p>
                            <p className="text-[10px] text-[#94A3B8] mt-1.5 flex items-center gap-1.5">
                              <span>Actor: <b className="text-[#475569]">{item.user}</b></span>
                              <span>•</span>
                              <span>{item.timestamp ? item.timestamp.toLocaleString() : 'Recent'}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => navigate(`/details/${item.complaintId}`)}
                            className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-white hover:bg-[#0284C7] hover:text-white text-[#0284C7] border border-[#BAE6FD] text-xs font-semibold transition cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Multipurpose Action Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-white p-6 sm:p-7 rounded-2xl w-full ${modalType === 'letter' ? 'max-w-2xl' : 'max-w-md'} space-y-5 border border-[#E2E8F0] shadow-xl`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
                  {modalType === 'resolve' && 'Mark Issue as Resolved'}
                  {modalType === 'verification' && 'Override Verification Status'}
                  {modalType === 'remark' && 'Add Timeline Remark'}
                  {modalType === 'letter' && 'Official Complaint Letter'}
                </h3>
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* RESOLVE ISSUE CONTENT */}
              {modalType === 'resolve' && (
                <>
                  <p className="text-xs text-[#64748B]">Attach an optional photo showing the completed civic repair or resolution as proof.</p>
                  
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
                    <div className="relative w-full rounded-xl overflow-hidden border border-[#E2E8F0] group shadow-xs">
                      <img src={resolvePreview} alt="Evidence" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => { setResolveFile(null); setResolvePreview(null); }}
                          className="bg-red-600 text-white p-2.5 rounded-full hover:bg-red-700 transition shadow cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-emerald-600/90 backdrop-blur text-[10px] font-bold rounded-full text-white flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Evidence Attached
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div
                        onClick={() => resolveInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-[#CBD5E1] hover:border-[#0284C7] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#F0F9FF]/30 group"
                      >
                        <div className="p-3 bg-[#F0F9FF] rounded-xl mb-2 group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-6 h-6 text-[#0284C7]" />
                        </div>
                        <p className="text-xs text-[#0F172A] font-semibold">Click to upload resolved image</p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">JPG, PNG up to 10MB</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => resolveCameraRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F0F9FF] text-[#0284C7] rounded-xl border border-[#BAE6FD] hover:bg-[#E0F2FE] transition-all font-semibold text-xs cursor-pointer shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Snap Photo with Camera</span>
                      </button>
                    </div>
                  )}
                </>
              )}
              
              {/* VERIFICATION OVERRIDE CONTENT */}
              {modalType === 'verification' && (
                <>
                  <p className="text-xs text-[#64748B]">Provide an optional administrative reason for setting verification status to <b>{modalTarget?.newVerification}</b>.</p>
                  <textarea 
                    value={modalInput} 
                    onChange={(e) => setModalInput(e.target.value)} 
                    placeholder="Enter reason for verification override..." 
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 resize-none h-24" 
                  />
                </>
              )}

              {/* REMARK CONTENT */}
              {modalType === 'remark' && (
                <>
                  <p className="text-xs text-[#64748B]">This remark will appear in the complaint tracking timeline for citizens and officials.</p>
                  <textarea 
                    value={modalInput} 
                    onChange={(e) => setModalInput(e.target.value)} 
                    placeholder="Enter timeline update or remark..." 
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 resize-none h-24" 
                  />
                </>
              )}

              {/* LETTER CONTENT */}
              {modalType === 'letter' && (
                <div className="bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] max-h-[55vh] overflow-y-auto">
                  <div className="text-[#334155] whitespace-pre-wrap text-xs leading-relaxed font-serif">
                    {modalTarget?.formalLetter || 'No official letter was generated for this issue.'}
                  </div>
                  {modalTarget?.translatedLetter && (
                    <div className="mt-5 pt-5 border-t border-[#E2E8F0]">
                      <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                        Translated Letter ({modalTarget?.language})
                      </p>
                      <div className="text-[#334155] whitespace-pre-wrap text-xs leading-relaxed font-serif">
                        {modalTarget?.translatedLetter}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex space-x-3 pt-2">
                {modalType !== 'letter' && (
                  <button 
                    onClick={() => setModalOpen(false)} 
                    className="flex-1 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                {modalType !== 'letter' ? (
                  <button 
                    onClick={submitModal} 
                    disabled={resolveUploading}
                    className="flex-1 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resolveUploading ? 'Uploading...' : 'Confirm'}
                  </button>
                ) : (
                  <button 
                    onClick={() => setModalOpen(false)} 
                    className="w-full py-2.5 rounded-xl bg-[#0F172A] text-white font-semibold text-xs hover:bg-[#1E293B] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Add New Field Worker */}
      <AnimatePresence>
        {workerModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Register Field Worker</h3>
                  <p className="text-xs text-slate-500">Add an on-ground technician to receive task assignments via SMS.</p>
                </div>
              </div>

              <form onSubmit={handleCreateWorker} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={newWorkerData.name}
                    onChange={(e) => setNewWorkerData({ ...newWorkerData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (For SMS Alerts)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-medium border border-r-0 border-slate-200 rounded-l-xl">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210 (10 digits)"
                      value={newWorkerData.phone}
                      onChange={(e) => setNewWorkerData({ ...newWorkerData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-r-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">SMS notifications will be dispatched directly to this mobile number.</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={newWorkerData.department}
                      onChange={(e) => setNewWorkerData({ ...newWorkerData, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    >
                      <option value="Roads & Potholes">Roads & Potholes</option>
                      <option value="Solid Waste Management">Solid Waste</option>
                      <option value="Electricity & Lighting">Electricity</option>
                      <option value="Water Supply & Drainage">Water & Drainage</option>
                      <option value="Public Transport">Public Transport</option>
                      <option value="General Maintenance">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                    <input
                      type="number"
                      min="18"
                      max="70"
                      required
                      value={newWorkerData.age}
                      onChange={(e) => setNewWorkerData({ ...newWorkerData, age: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Jurisdiction</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune, Mumbai, Delhi"
                    value={newWorkerData.city}
                    onChange={(e) => setNewWorkerData({ ...newWorkerData, city: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="flex space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setWorkerModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWorker}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  >
                    {submittingWorker ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Register Worker</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Assign Task & Dispatch SMS */}
      <AnimatePresence>
        {assignModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Assign Worker & Dispatch SMS</h3>
                  <p className="text-xs text-slate-500">Assign on-ground worker and send instant SMS alert to their phone.</p>
                </div>
              </div>

              {selectedComplaintForAssign && (
                <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">
                      #{selectedComplaintForAssign.complaintId || selectedComplaintForAssign._id?.slice(-6)}: {selectedComplaintForAssign.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                      {selectedComplaintForAssign.category}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] truncate">
                    📍 {selectedComplaintForAssign.location?.address || 'Location coordinates specified'}
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                    <span>Severity: <strong className="text-slate-700 capitalize">{selectedComplaintForAssign.severity || 'Medium'}</strong></span>
                    <span>Status: <strong className="text-slate-700">{selectedComplaintForAssign.status}</strong></span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Field Worker</label>
                  {workers.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs">
                      No workers found. Please add field workers first in the "Field Workers" tab.
                    </div>
                  ) : (
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      <option value="">-- Choose Worker to Assign --</option>
                      {workers.map(w => (
                        <option key={w._id} value={w._id}>
                          {w.name} ({w.department}) - {w.city} | Active Tasks: {w.activeTasksCount || 0} [{w.status}]
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* SMS Live Preview */}
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs space-y-1">
                  <div className="flex items-center justify-between text-blue-900 font-bold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      Live SMS Dispatch Preview
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">Fast2SMS</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100 font-mono text-[11px] text-slate-700 leading-relaxed shadow-xs">
                    "CIVIC ALERT: New task assigned to you.<br />
                    Issue: {selectedComplaintForAssign?.category || 'Civic Issue'} ({selectedComplaintForAssign?.severity || 'Medium'})<br />
                    Location: {(selectedComplaintForAssign?.location?.address || 'Field Location').slice(0, 35)}...<br />
                    Task ID: #{selectedComplaintForAssign?.complaintId || selectedComplaintForAssign?._id?.slice(-6)}<br />
                    Please inspect and resolve urgently."
                  </div>
                  <p className="text-[10px] text-blue-600/80">
                    {selectedWorkerId ? (
                      <>SMS will be dispatched to <strong>{workers.find(w => w._id === selectedWorkerId)?.phone}</strong> ({workers.find(w => w._id === selectedWorkerId)?.name})</>
                    ) : (
                      'Select a worker above to dispatch SMS'
                    )}
                  </p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedWorkerId || !selectedComplaintForAssign) return;
                      const w = workers.find(item => (item._id || item.id) === selectedWorkerId);
                      const cleanPhone = String(w?.phone || '').replace(/[^0-9]/g, '').slice(-10);
                      const msg = `*CIVIC ALERT: New Task Assigned*\n\n` +
                        `👤 *Worker:* ${w?.name}\n` +
                        `⚠️ *Issue:* ${selectedComplaintForAssign.category || selectedComplaintForAssign.title || 'Civic Issue'} (${selectedComplaintForAssign.severity || 'Medium'})\n` +
                        `📍 *Location:* ${selectedComplaintForAssign.location?.address || 'See Portal'}\n` +
                        `🆔 *Task ID:* #${selectedComplaintForAssign.complaintId || selectedComplaintForAssign._id?.slice(-6)}\n\n` +
                        `Please inspect and resolve urgently.`;
                      window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    disabled={!selectedWorkerId}
                    className="px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
                    title="Open in WhatsApp"
                  >
                    <span>WhatsApp 💬</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignWorkerSubmit}
                    disabled={!selectedWorkerId || assigningWorker}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  >
                    {assigningWorker ? (
                      <span>Dispatching SMS...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirm & SMS 📱</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Admin;
