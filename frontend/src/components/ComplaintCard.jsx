import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, MapPin, Clock, TrendingUp, ExternalLink, Edit } from 'lucide-react';
import StatusTracker from './StatusTracker';

const severityConfig = {
  High: { 
    bg: 'bg-red-500/10', 
    text: 'text-red-400', 
    border: 'border-red-500/30',
    glow: 'group-hover:shadow-red-500/20',
    gradient: 'from-red-500/20 to-red-600/10'
  },
  Medium: { 
    bg: 'bg-yellow-500/10', 
    text: 'text-yellow-400', 
    border: 'border-yellow-500/30',
    glow: 'group-hover:shadow-yellow-500/20',
    gradient: 'from-yellow-500/20 to-yellow-600/10'
  },
  Low: { 
    bg: 'bg-green-500/10', 
    text: 'text-green-400', 
    border: 'border-green-500/30',
    glow: 'group-hover:shadow-green-500/20',
    gradient: 'from-green-500/20 to-green-600/10'
  },
};

const statusConfig = {
  'Pending': { 
    icon: '⏳', 
    bg: 'bg-yellow-500/20', 
    text: 'text-yellow-300',
    border: 'border-yellow-500/30',
    pulse: true
  },
  'In Progress': { 
    icon: '�', 
    bg: 'bg-blue-500/20', 
    text: 'text-blue-300',
    border: 'border-blue-500/30',
    pulse: true
  },
  'Resolved': { 
    icon: '✅', 
    bg: 'bg-green-500/20', 
    text: 'text-green-300',
    border: 'border-green-500/30',
    pulse: false
  },
};

const ComplaintCard = ({ complaint, onAddIssue, onEdit }) => {
  const navigate = useNavigate();

  const displayAddress = complaint.locationAddress || 
    (complaint.location && Array.isArray(complaint.location)
      ? `${complaint.location[0]?.toFixed?.(2) || '—'}, ${complaint.location[1]?.toFixed?.(2) || '—'}`
      : '—');

  const activeStatus = statusConfig[complaint.status] || statusConfig['Pending'];
  const severityStyle = severityConfig[complaint.severity] || severityConfig.Medium;

  return (
    <motion.div
      onClick={() => navigate(`/details/${complaint.id || complaint._id}`)}
      className="relative group cursor-pointer h-full flex flex-col"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${severityStyle.gradient} rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500`} />
      
      <div className="relative flex-1 h-full glass-premium flex flex-col overflow-hidden rounded-3xl border border-white/10 group-hover:border-white/20 transition-all duration-300">
        {/* Image Section */}
        <div className="relative h-52 overflow-hidden shrink-0">
          <motion.img
            src={complaint.imageUrl}
            alt={complaint.problemType}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/50 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <motion.span 
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border backdrop-blur-md ${activeStatus.bg} ${activeStatus.text} ${activeStatus.border}`}
              animate={activeStatus.pulse ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span>{activeStatus.icon}</span>
              <span>{complaint.status || 'Pending'}</span>
            </motion.span>
          </div>
          
          {/* Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <motion.span 
                  className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border backdrop-blur-sm mb-2 ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border}`}
                >
                  {complaint.severity} Priority
                </motion.span>
                <h3 className="text-xl font-bold text-white leading-tight group-hover:text-gradient transition-all">
                  {complaint.problemType}
                </h3>
              </div>
              
              {/* View Icon */}
              <motion.div
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.1 }}
              >
                <ExternalLink className="w-5 h-5 text-white" />
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Status Tracker */}
            <div className="mb-4">
              <StatusTracker status={complaint.status} compact />
            </div>
            
            {/* Footer Info */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <motion.div 
                  className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="max-w-[100px] truncate">{displayAddress}</span>
                </motion.div>
                
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Upvotes */}
              <motion.div 
                className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold text-white text-xs">{complaint.upvotes || 0}</span>
              </motion.div>
            </div>
          </div>

          {/* User Actions */}
          {(onAddIssue || onEdit) && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(complaint);
                  }}
                  className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-colors border border-blue-500/20"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              {onAddIssue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddIssue(complaint);
                  }}
                  className="flex-1 flex justify-center items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold transition-colors border border-purple-500/20"
                >
                  <TrendingUp className="w-4 h-4" />
                  Add Issue
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Hover Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t ${severityStyle.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      </div>
    </motion.div>
  );
};

export default ComplaintCard;
