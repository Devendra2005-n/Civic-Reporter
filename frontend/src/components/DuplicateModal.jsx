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
            <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl relative shadow-2xl bg-white border border-[#E5E7EB]">
              <div className="relative bg-white rounded-2xl overflow-hidden">
                {/* Header Section */}
                <div className="relative px-8 pt-8 pb-5 border-b border-[#E5E7EB]">
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-all group"
                  >
                    <X className="w-4 h-4 text-[#6B7280] group-hover:text-[#0F172A] transition-colors" />
                  </button>

                  {/* Icon + Title */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-[#D97706]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#0F172A] mb-1">
                        Similar Issues Found
                      </h2>
                      <p className="text-[#6B7280] text-sm leading-relaxed">
                        Our AI detected <span className="text-[#D97706] font-semibold">{localComplaints.length}</span> existing complaint{localComplaints.length !== 1 ? 's' : ''} matching yours. 
                        Help reduce duplicates by supporting existing reports.
                      </p>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="mt-4 flex items-center gap-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl px-4 py-2.5">
                    <Users className="w-4 h-4 text-[#0284C7] shrink-0" />
                    <p className="text-xs text-[#0369A1] leading-relaxed">
                      <span className="font-semibold">Why upvote?</span> Upvoting increases issue priority so municipal teams resolve it faster.
                    </p>
                  </div>
                </div>

                {/* Complaints List */}
                <div className="px-8 py-4 max-h-[42vh] overflow-y-auto custom-scrollbar space-y-3">
                  {localComplaints.map((complaint, index) => {
                    const isExpanded = expandedId === complaint.id;
                    const userUpvoted = hasUserUpvoted(complaint);
                    const isUpvoting = upvotingId === complaint.id;

                    return (
                      <motion.div
                        key={complaint.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden transition-all hover:border-[#BAE6FD] hover:bg-[#F0F9FF]/20"
                      >
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-[#0F172A] uppercase">
                                {complaint.problemType || 'Civic Issue'}
                              </span>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                                {complaint.similarityPercent}% match
                              </span>
                            </div>
                            <p className="text-xs text-[#4B5563] line-clamp-2">
                              {complaint.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpvote(complaint.id)}
                              disabled={isUpvoting}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                userUpvoted
                                  ? 'bg-[#0284C7] text-white border-[#0284C7]'
                                  : 'bg-white text-[#334155] border-[#E5E7EB] hover:border-[#BAE6FD] hover:text-[#0284C7]'
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${userUpvoted ? 'fill-current' : ''}`} />
                              <span>{complaint.upvotes || 0}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action Buttons Footer */}
                <div className="px-8 py-5 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={onSubmitAnyway}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-white border border-[#D1D5DB] text-[#334155] hover:bg-[#F3F4F6] transition-all disabled:opacity-50"
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
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-[#0284C7] hover:bg-[#0369A1] text-white transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {upvotedIds.size > 0 ? "Done — Thanks for Supporting!" : "Close"}
                  </button>
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
