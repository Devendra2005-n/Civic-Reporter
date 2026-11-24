import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getComplaintsByUser, addComplaintIssue, editComplaint, uploadImage } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import { FileText, Inbox, Loader2, Search, X, PlusCircle, Edit, Image as ImageIcon, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

const MyComplaints = () => {
  const { user, userData } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Issue Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newIssueText, setNewIssueText] = useState('');
  const [newIssueImage, setNewIssueImage] = useState(null);
  const [newIssueImagePreview, setNewIssueImagePreview] = useState(null);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Edit Complaint Modal State
  const [selectedEditComplaint, setSelectedEditComplaint] = useState(null);
  const [editFormData, setEditFormData] = useState({ problemType: '', description: '' });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  useEffect(() => {
    const fetchMyComplaints = async () => {
      if (!user) return;
      try {
        const res = await getComplaintsByUser(user.uid);
        setComplaints(res.data);
      } catch (err) {
        console.error('Error fetching my complaints:', err);
        setError('Failed to fetch complaints.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyComplaints();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36 text-[#334155]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#0284C7] animate-spin" />
          <p className="text-sm text-[#6B7280]">Loading your complaints...</p>
        </div>
      </div>
    );
  }

  const filteredComplaints = complaints.filter(c => 
    (c.problemType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.id || c._id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const solvedCount = complaints.filter(c => c.resolvedByUserId === user?.uid).length;

  const handleAddIssueSubmit = async () => {
    if (!newIssueText.trim()) {
      toast.error("Please enter issue details.");
      return;
    }
    setIsSubmittingIssue(true);
    try {
      let uploadedUrl = "";
      if (newIssueImage) {
        toast.success("Uploading image...");
        const uploadRes = await uploadImage(newIssueImage);
        uploadedUrl = uploadRes.data.imageUrl;
      }
      
      const res = await addComplaintIssue(selectedComplaint.id || selectedComplaint._id, newIssueText, uploadedUrl);
      toast.success("Additional issue recorded successfully.");
      // Update local state so it doesn't require a full refresh
      setComplaints(complaints.map(c => 
        (c.id || c._id) === (selectedComplaint.id || selectedComplaint._id) ? res.data : c
      ));
      setSelectedComplaint(null);
      setNewIssueText('');
      setNewIssueImage(null);
      setNewIssueImagePreview(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add issue. Please try again.");
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const openEditModal = (complaint) => {
    setSelectedEditComplaint(complaint);
    setEditFormData({
      problemType: complaint.problemType || '',
      description: complaint.description || ''
    });
  };

  const handleEditSubmit = async () => {
    if (!editFormData.problemType.trim() || !editFormData.description.trim()) {
      toast.error("Title and description cannot be empty.");
      return;
    }
    setIsSubmittingEdit(true);
    try {
      const res = await editComplaint(selectedEditComplaint.id || selectedEditComplaint._id, editFormData);
      toast.success("Complaint updated successfully.");
      setComplaints(complaints.map(c => 
        (c.id || c._id) === (selectedEditComplaint.id || selectedEditComplaint._id) ? res.data : c
      ));
      setSelectedEditComplaint(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update complaint.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 sm:pt-36 px-3 sm:px-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#F0F9FF] rounded-xl border border-[#BAE6FD]">
            <FileText className="w-7 h-7 text-[#0284C7]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              My <span className="text-[#0284C7]">Complaints</span>
            </h1>
            <p className="text-[#6B7280] text-sm mt-0.5">
              Track your reported issues and community contributions.
            </p>
          </div>
        </div>
        
        {/* Community Hero Stats */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] px-5 py-3.5 rounded-2xl flex items-center gap-3.5 shrink-0 shadow-sm">
          <div className="w-10 h-10 bg-white border border-[#FDE68A] rounded-full flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#D97706]" />
          </div>
          <div>
            <p className="text-xs text-[#92400E] font-medium">Community Hero</p>
            <p className="text-xl font-bold text-[#D97706]">{solvedCount} <span className="text-xs font-normal text-[#B45309]">Issues Solved</span></p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#9CA3AF]" />
          </div>
          <input
            type="text"
            className="w-full bg-white border border-[#D1D5DB] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] shadow-sm transition-all"
            placeholder="Search by Complaint ID or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-[#0284C7]">{complaints.length}</p>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Total Filed</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-[#D97706]">
            {complaints.filter(c => c.status === 'Pending').length}
          </p>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Pending</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-[#0284C7]">
            {complaints.filter(c => c.status === 'In Progress').length}
          </p>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">In Progress</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-[#16A34A]">
            {complaints.filter(c => c.status === 'Resolved').length}
          </p>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Resolved</p>
        </div>
      </div>

      {/* Complaints Grid or Empty State */}
      {error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FEF2F2] rounded-2xl p-12 text-center border border-[#FECACA] shadow-sm"
        >
          <p className="text-[#DC2626] text-base font-semibold">{error}</p>
        </motion.div>
      ) : complaints.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-16 text-center border border-dashed border-[#D1D5DB] shadow-sm"
        >
          <Inbox className="w-14 h-14 mx-auto mb-4 text-[#9CA3AF]" />
          <h3 className="text-xl font-bold text-[#0F172A] mb-1.5">No complaints yet</h3>
          <p className="text-[#6B7280] text-sm max-w-md mx-auto">
            You haven't reported any civic issues yet. Head over to the{' '}
            <a href="/submit" className="text-[#0284C7] hover:text-[#0369A1] font-semibold underline transition-colors">
              Report Issue
            </a>{' '}
            page to file your first complaint.
          </p>
        </motion.div>
      ) : (
        <>
          {filteredComplaints.length === 0 && searchTerm ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No complaints found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComplaints.map((complaint, index) => (
                <motion.div
                  key={complaint.id || complaint._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ComplaintCard 
                    complaint={complaint} 
                    onAddIssue={setSelectedComplaint} 
                    onEdit={openEditModal}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Issue Modal */}
      <AnimatePresence>
        {selectedComplaint && (
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
              className="bg-white p-6 sm:p-8 rounded-2xl w-full max-w-md border border-[#E5E7EB] shadow-2xl relative text-[#0F172A]"
            >
              <button 
                onClick={() => setSelectedComplaint(null)} 
                className="absolute top-5 right-5 text-[#6B7280] hover:text-[#0F172A] transition-colors"
              >
                <X className="w-5 h-5"/>
              </button>
              
              <h3 className="text-xl font-bold text-[#0F172A] mb-1 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#0284C7]" />
                Add New Issue
              </h3>
              <p className="text-xs text-[#6B7280] mb-5">
                Add an update or report an additional related issue for this complaint.
              </p>

              <textarea 
                value={newIssueText} 
                onChange={(e) => setNewIssueText(e.target.value)} 
                placeholder="Describe the new issue or update..." 
                className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] resize-none h-28 mb-4" 
              />

              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#4B5563] mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#0284C7]" />
                  Attach an Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setNewIssueImage(file);
                      setNewIssueImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-xs text-[#6B7280] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F0F9FF] file:text-[#0284C7] hover:file:bg-[#E0F2FE] transition-all cursor-pointer"
                />
                {newIssueImagePreview && (
                  <div className="mt-2.5 relative w-28 h-28 rounded-xl overflow-hidden border border-[#E5E7EB]">
                    <img src={newIssueImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setNewIssueImage(null);
                        setNewIssueImagePreview(null);
                      }}
                      className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedComplaint(null);
                    setNewIssueImage(null);
                    setNewIssueImagePreview(null);
                  }} 
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs border border-[#D1D5DB] text-[#334155] hover:bg-[#F9FAFB] transition-colors"
                  disabled={isSubmittingIssue}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddIssueSubmit} 
                  disabled={isSubmittingIssue}
                  className="flex-1 py-2.5 px-4 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center"
                >
                  {isSubmittingIssue ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Complaint Modal */}
      <AnimatePresence>
        {selectedEditComplaint && (
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
                onClick={() => setSelectedEditComplaint(null)} 
                className="absolute top-5 right-5 text-[#6B7280] hover:text-[#0F172A] transition-colors"
              >
                <X className="w-5 h-5"/>
              </button>
              
              <h3 className="text-xl font-bold text-[#0F172A] mb-1 flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#0284C7]" />
                Edit Complaint
              </h3>
              <p className="text-xs text-[#6B7280] mb-5">
                Update the main details of your civic issue.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Issue Category/Title</label>
                  <input 
                    type="text"
                    value={editFormData.problemType} 
                    onChange={(e) => setEditFormData({...editFormData, problemType: e.target.value})} 
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B5563] mb-1">Description</label>
                  <textarea 
                    value={editFormData.description} 
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} 
                    className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] resize-none h-32" 
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedEditComplaint(null)} 
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs border border-[#D1D5DB] text-[#334155] hover:bg-[#F9FAFB] transition-colors"
                  disabled={isSubmittingEdit}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditSubmit} 
                  disabled={isSubmittingEdit}
                  className="flex-1 py-2.5 px-4 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center"
                >
                  {isSubmittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MyComplaints;
