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
      <div className="min-h-screen flex items-center justify-center pt-36 text-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="text-gray-400">Loading your complaints...</p>
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
    <div className="min-h-screen pt-36 px-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              My <span className="text-gradient">Complaints</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Track your reported issues and community contributions.
            </p>
          </div>
        </div>
        
        {/* Community Hero Stats */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 px-6 py-4 rounded-2xl flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-yellow-400/80 font-medium">Community Hero</p>
            <p className="text-2xl font-bold text-yellow-400">{solvedCount} <span className="text-sm font-normal text-gray-400">Issues Solved</span></p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            placeholder="Search by Complaint ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-blue-400">{complaints.length}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Total Filed</p>
        </div>
        <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-orange-400">
            {complaints.filter(c => c.status === 'Pending').length}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Pending</p>
        </div>
        <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-sky-400">
            {complaints.filter(c => c.status === 'In Progress').length}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">In Progress</p>
        </div>
        <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-green-400">
            {complaints.filter(c => c.status === 'Resolved').length}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Resolved</p>
        </div>
      </div>

      {/* Complaints Grid or Empty State */}
      {error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0B0F19] rounded-2xl p-12 text-center border border-dashed border-red-500/30"
        >
          <p className="text-red-400 text-lg">{error}</p>
        </motion.div>
      ) : complaints.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0B0F19] rounded-2xl p-16 text-center border border-dashed border-white/20"
        >
          <Inbox className="w-16 h-16 mx-auto mb-6 text-gray-600" />
          <h3 className="text-2xl font-bold text-gray-300 mb-2">No complaints yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            You haven't reported any civic issues yet. Head over to the{' '}
            <a href="/submit" className="text-blue-400 hover:text-blue-300 underline transition-colors">
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
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0B0F19] p-8 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedComplaint(null)} 
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5"/>
              </button>
              
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-purple-400" />
                Add New Issue
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Add an update or report an additional related issue for this complaint.
              </p>

              <textarea 
                value={newIssueText} 
                onChange={(e) => setNewIssueText(e.target.value)} 
                placeholder="Describe the new issue or update..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-32 mb-4" 
              />

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
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
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30 transition-all cursor-pointer"
                />
                {newIssueImagePreview && (
                  <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border border-white/10">
                    <img src={newIssueImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setNewIssueImage(null);
                        setNewIssueImagePreview(null);
                      }}
                      className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setSelectedComplaint(null);
                    setNewIssueImage(null);
                    setNewIssueImagePreview(null);
                  }} 
                  className="flex-1 py-3 px-4 rounded-xl font-bold border border-white/10 text-white hover:bg-white/5 transition-colors"
                  disabled={isSubmittingIssue}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddIssueSubmit} 
                  disabled={isSubmittingIssue}
                  className="flex-1 py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center"
                >
                  {isSubmittingIssue ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
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
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0B0F19] p-8 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedEditComplaint(null)} 
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5"/>
              </button>
              
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Edit className="w-6 h-6 text-blue-400" />
                Edit Complaint
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Update the main details of your civic issue.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Issue Category/Title</label>
                  <input 
                    type="text"
                    value={editFormData.problemType} 
                    onChange={(e) => setEditFormData({...editFormData, problemType: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea 
                    value={editFormData.description} 
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-40" 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedEditComplaint(null)} 
                  className="flex-1 py-3 px-4 rounded-xl font-bold border border-white/10 text-white hover:bg-white/5 transition-colors"
                  disabled={isSubmittingEdit}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditSubmit} 
                  disabled={isSubmittingEdit}
                  className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center"
                >
                  {isSubmittingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
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
