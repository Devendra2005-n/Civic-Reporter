/**
 * DuplicateModal.jsx — Premium Duplicate Complaint Detection Modal
 * 
 * Shows when the AI detects similar existing complaints.
 * Allows users to upvote existing complaints or submit anyway.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, ThumbsUp, Plus, X, MapPin, Clock, 
  TrendingUp, Shield, ChevronDown, ChevronUp, Sparkles,
  CheckCircle2, Users, Zap
} from 'lucide-react';
import { upvoteComplaint } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DuplicateModal = ({ 
  isOpen, 
  onClose, 
  similarComplaints = [], 
  onSubmitAnyway, 
  isSubmitting = false 
}) => {
  const { userData } = useAuth();
  const [expandedId, setExpandedId] = useState(null);
  const [upvotingId, setUpvotingId] = useState(null);
  const [upvotedIds, setUpvotedIds] = useState(new Set());
  const [localComplaints, setLocalComplaints] = useState(similarComplaints);

  if (!isOpen) return null;

  // Handle upvote action
  const handleUpvote = async (complaintId) => {
    if (!userData?.uid) {
      toast.error('Please log in to upvote complaints');
      return;
    }

    setUpvotingId(complaintId);
    try {
      const res = await upvoteComplaint(complaintId);
      const updated = res.data;

      // Update local state
      setLocalComplaints(prev => prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            upvotes: updated.upvotes,
            upvotedBy: updated.upvotedBy || [],
          };
        }
        return c;
      }));

      const alreadyUpvoted = upvotedIds.has(complaintId);
      if (alreadyUpvoted) {
        setUpvotedIds(prev => { const next = new Set(prev); next.delete(complaintId); return next; });
        toast('Vote removed', { icon: '👎' });
      } else {
        setUpvotedIds(prev => new Set(prev).add(complaintId));
        toast.success('Thanks for supporting this issue! 👍', { duration: 3000 });
      }
    } catch (err) {
      console.error('Upvote failed:', err);
      toast.error('Failed to upvote. Please try again.');
    } finally {
      setUpvotingId(null);
    }
  };

  const hasUserUpvoted = (complaint) => {
    return upvotedIds.has(complaint.id) || (complaint.upvotedBy || []).includes(userData?.uid);
  };

  // Get severity color based on similarity %
  const getSimilarityColor = (percent) => {
    if (percent >= 95) return { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/20' };
    if (percent >= 90) return { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/40', text: 'text-orange-400', glow: 'shadow-orange-500/20' };
    return { bg: 'from-yellow-500/20 to-amber-600/10', border: 'border-yellow-500/40', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' };
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4"
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl relative">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-red-500/30 blur-sm animate-pulse" />
              
              <div className="relative bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden">
                {/* Header Section */}
                <div className="relative overflow-hidden">
                  {/* Animated background effect */}
                  <div className="absolute inset-0">
                    <motion.div
                      className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-[80px]"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/15 rounded-full blur-[60px]"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    />
                  </div>

                  <div className="relative px-8 pt-8 pb-6">
                    {/* Close button */}
                    <button
                      onClick={onClose}
                      className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
                    >
                      <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>

                    {/* Icon + Title */}
                    <div className="flex items-start gap-4">
                      <motion.div
                        initial={{ rotate: -10, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0"
                      >
                        <AlertTriangle className="w-7 h-7 text-amber-400" />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-extrabold text-white mb-1">
                          Similar Issues Found
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          Our AI detected <span className="text-amber-400 font-semibold">{localComplaints.length}</span> existing complaint{localComplaints.length !== 1 ? 's' : ''} that appear similar to yours. 
                          Help reduce duplicates by supporting existing reports instead.
                        </p>
                      </div>
                    </div>

                    {/* Info Banner */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-5 flex items-center gap-3 bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-xs text-blue-300/80 leading-relaxed">
                        <span className="font-semibold text-blue-300">Why upvote?</span> Upvoting existing complaints increases their priority and helps authorities address issues faster.
                      </p>
                    </motion.div>
                  </div>
                </div>

                {/* Complaints List */}
                <div className="px-8 pb-4 max-h-[40vh] overflow-y-auto custom-scrollbar space-y-3">
                  {localComplaints.map((complaint, index) => {
                    const colors = getSimilarityColor(complaint.similarityPercent);
                    const isExpanded = expandedId === complaint.id;
                    const userUpvoted = hasUserUpvoted(complaint);
                    const isUpvoting = upvotingId === complaint.id;

                    return (
                      <motion.div
                        key={complaint.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`rounded-2xl border ${colors.border} bg-gradient-to-r ${colors.bg} overflow-hidden transition-all hover:shadow-lg ${colors.glow}`}
                      >
                        {/* Complaint Header */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Similarity Badge + Problem Type */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${colors.text} bg-white/5 border ${colors.border}`}
                                >
                                  <Sparkles className="w-3 h-3" />
                                  {complaint.similarityPercent}% Match
                                </motion.span>

                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white/70 bg-white/5 border border-white/10 capitalize">
                                  {complaint.problemType}
                                </span>

                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                  complaint.status === 'Resolved' ? 'text-green-400 bg-green-500/10 border border-green-500/20' :
                                  complaint.status === 'IN_PROGRESS' ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' :
                                  'text-gray-400 bg-white/5 border border-white/10'
                                }`}>
                                  {complaint.status}
                                </span>
                              </div>

                              {/* Description preview */}
                              <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                                {complaint.description}
                              </p>

                              {/* Metadata row */}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {complaint.city && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {complaint.area ? `${complaint.area}, ` : ''}{complaint.city}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getTimeAgo(complaint.createdAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {complaint.upvotes} upvote{complaint.upvotes !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>

                            {/* Upvote Button */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleUpvote(complaint.id)}
                              disabled={isUpvoting}
                              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl font-bold text-sm transition-all flex-shrink-0 min-w-[72px] ${
                                userUpvoted
                                  ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400 shadow-lg shadow-green-500/10'
                                  : 'bg-white/5 border-2 border-white/10 text-gray-400 hover:bg-blue-500/15 hover:border-blue-500/40 hover:text-blue-400'
                              }`}
                            >
                              {isUpvoting ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : userUpvoted ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <ThumbsUp className="w-5 h-5" />
                              )}
                              <span className="text-xs font-bold">{complaint.upvotes}</span>
                            </motion.button>
                          </div>

                          {/* Expand/Collapse toggle */}
                          {complaint.imageUrl && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mt-2 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? 'Hide details' : 'Show image'}
                            </button>
                          )}
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && complaint.imageUrl && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden border-t border-white/5"
                            >
                              <div className="p-4 pt-3">
                                <img
                                  src={complaint.imageUrl}
                                  alt="Complaint evidence"
                                  className="w-full h-40 object-cover rounded-xl border border-white/10"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action Buttons Footer */}
                <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02]">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Submit Anyway */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={onSubmitAnyway}
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Submit Anyway
                        </>
                      )}
                    </motion.button>

                    {/* Close / Done */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={onClose}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
                    >
                      <Shield className="w-4 h-4" />
                      {upvotedIds.size > 0 ? "Done — Thanks for Supporting!" : "Close"}
                    </motion.button>
                  </div>

                  {upvotedIds.size > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-xs text-green-400/80 mt-3 flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      You supported {upvotedIds.size} existing complaint{upvotedIds.size !== 1 ? 's' : ''}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DuplicateModal;
