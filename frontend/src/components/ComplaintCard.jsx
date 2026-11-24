import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, MapPin, Clock, TrendingUp, ExternalLink, Edit, Trash2, FileDown } from 'lucide-react';
import StatusTracker from './StatusTracker';

const categoryColors = {
  pothole: { label: 'Pothole', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  garbage: { label: 'Garbage', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  streetlight: { label: 'Streetlight', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'broken streetlight': { label: 'Streetlight', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  water: { label: 'Water Leakage', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  drainage: { label: 'Drainage', color: 'text-purple-600 bg-purple-50 border-purple-200' },
};

const statusConfig = {
  'Pending': { 
    label: 'Submitted',
    badge: 'bg-[#EFF6FF] text-[#0284C7] border-[#BAE6FD]',
    dot: 'bg-[#0284C7]',
  },
  'Submitted': { 
    label: 'Submitted',
    badge: 'bg-[#EFF6FF] text-[#0284C7] border-[#BAE6FD]',
    dot: 'bg-[#0284C7]',
  },
  'Under Review': { 
    label: 'Under Review',
    badge: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
    dot: 'bg-[#7C3AED]',
  },
  'In Progress': { 
    label: 'In Progress',
    badge: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
    dot: 'bg-[#D97706]',
  },
  'Resolved': { 
    label: 'Resolved',
    badge: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
    dot: 'bg-[#16A34A]',
  },
  'Rejected': { 
    label: 'Rejected',
    badge: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    dot: 'bg-[#DC2626]',
  },
};

const severityBadges = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-slate-50 text-slate-600 border-slate-200',
};

const ComplaintCard = ({ complaint, onAddIssue, onEdit, onDelete, onDownloadPDF, isOwner }) => {
  const navigate = useNavigate();

  const displayAddress = complaint.locationAddress || 
    (complaint.location && Array.isArray(complaint.location)
      ? `${complaint.location[0]?.toFixed?.(2) || '—'}, ${complaint.location[1]?.toFixed?.(2) || '—'}`
      : 'Location details available');

  const activeStatus = statusConfig[complaint.status] || statusConfig['Pending'];
  const pTypeKey = (complaint.problemType || '').toLowerCase();
  const categoryInfo = categoryColors[pTypeKey] || { label: complaint.problemType || 'Issue', color: 'text-sky-700 bg-sky-50 border-sky-200' };

  return (
    <motion.div
      onClick={() => navigate(`/details/${complaint.id || complaint._id}`)}
      className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col overflow-hidden group hover:border-[#BAE6FD]"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-[#F3F4F6] shrink-0 border-b border-[#E5E7EB]">
        {complaint.imageUrl ? (
          <img
            src={complaint.imageUrl}
            alt={complaint.problemType}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#9CA3AF] bg-[#F8FAFC]">
            No image available
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border shadow-2xs backdrop-blur-xs flex items-center gap-1.5 ${activeStatus.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activeStatus.dot}`} />
            {activeStatus.label}
          </span>

          {complaint.severity && (
            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border shadow-2xs ${severityBadges[complaint.severity] || severityBadges.Medium}`}>
              {complaint.severity}
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Tag & Title */}
          <div className="flex items-center justify-between mb-1.5">
            <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md border ${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
            <span className="text-[11px] font-mono text-[#6B7280]">
              #{String(complaint.id || complaint._id).slice(-6).toUpperCase()}
            </span>
          </div>

          <h3 className="text-base font-bold text-[#0F172A] leading-snug mb-2 group-hover:text-[#0284C7] transition-colors line-clamp-1">
            {complaint.problemType || 'Civic Issue'}
          </h3>

          <p className="text-xs text-[#4B5563] line-clamp-2 mb-3">
            {complaint.description || 'Citizen reported issue requiring department inspection and action.'}
          </p>

          {/* Stepper */}
          <div className="mb-3 pt-1">
            <StatusTracker status={complaint.status} compact />
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-[#F3F4F6] mt-2">
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <div className="flex items-center gap-1 max-w-[140px] truncate" title={displayAddress}>
              <MapPin className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
              <span className="truncate">{displayAddress}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Upvote Pill */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] font-semibold text-[11px]">
                <ThumbsUp className="w-3 h-3" />
                <span>{complaint.upvotes || 0}</span>
              </div>
            </div>
          </div>

          {/* User action buttons for owner */}
          {(isOwner || onEdit || onDelete || onDownloadPDF || onAddIssue) && (
            <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between gap-1.5">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(complaint);
                  }}
                  title="Edit Complaint"
                  className="flex-1 flex justify-center items-center gap-1 px-2 py-1.5 bg-[#F9FAFB] hover:bg-[#F0F9FF] text-[#334155] hover:text-[#0284C7] rounded-lg text-xs font-semibold transition-colors border border-[#E5E7EB] hover:border-[#BAE6FD]"
                >
                  <Edit className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Edit</span>
                </button>
              )}
              {onDownloadPDF && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadPDF(complaint);
                  }}
                  title="Download Formal PDF Letter"
                  className="flex-1 flex justify-center items-center gap-1 px-2 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-lg text-xs font-semibold transition-colors border border-[#BBF7D0]"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(complaint);
                  }}
                  title="Delete Complaint"
                  className="flex-1 flex justify-center items-center gap-1 px-2 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] rounded-lg text-xs font-semibold transition-colors border border-[#FECACA]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
              {onAddIssue && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddIssue(complaint);
                  }}
                  className="flex-1 flex justify-center items-center gap-1 px-2 py-1.5 bg-[#F0F9FF] hover:bg-[#E0F2FE] text-[#0284C7] rounded-lg text-xs font-semibold transition-colors border border-[#BAE6FD]"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Add Issue</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ComplaintCard;
