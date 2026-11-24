import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const steps = [
  { key: 'Pending', labelKey: 'track_submitted', defaultLabel: 'Submitted', icon: AlertTriangle, activeColor: 'text-[#0284C7]', activeBg: 'bg-[#EFF6FF]', activeBorder: 'border-[#BAE6FD]' },
  { key: 'In Progress', labelKey: 'track_progress', defaultLabel: 'In Progress', icon: Clock, activeColor: 'text-[#D97706]', activeBg: 'bg-[#FFFBEB]', activeBorder: 'border-[#FDE68A]' },
  { key: 'Resolved', labelKey: 'track_resolved', defaultLabel: 'Resolved', icon: CheckCircle2, activeColor: 'text-[#16A34A]', activeBg: 'bg-[#F0FDF4]', activeBorder: 'border-[#BBF7D0]' },
];

const statusIndex = { 'Pending': 0, 'In Progress': 1, 'Resolved': 2 };

const StatusTracker = ({ status = 'Pending', compact = false }) => {
  const { t } = useLanguage();
  const currentIdx = statusIndex[status] ?? 0;

  if (compact) {
    return (
      <div className="flex items-center space-x-1.5" title={`Status: ${status}`}>
        {steps.map((step, idx) => {
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isCurrent
                    ? `${idx === 2 ? 'bg-[#16A34A]' : idx === 1 ? 'bg-[#D97706]' : 'bg-[#0284C7]'} ring-2 ring-white ring-offset-1`
                    : isActive
                    ? 'bg-[#94A3B8]'
                    : 'bg-[#E2E8F0]'
                }`}
              />
              {idx < steps.length - 1 && (
                <div
                  className={`w-3.5 h-0.5 mx-0.5 ${
                    idx < currentIdx ? 'bg-[#94A3B8]' : 'bg-[#E2E8F0]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full py-1">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? `${step.activeBg} border-2 ${step.activeBorder} shadow-xs`
                    : isActive
                    ? 'bg-[#F8FAFC] border border-[#CBD5E1]'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isCurrent ? step.activeColor : isActive ? 'text-[#475569]' : 'text-[#94A3B8]'
                  }`}
                />
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  isCurrent ? 'text-[#0F172A] font-semibold' : isActive ? 'text-[#475569]' : 'text-[#94A3B8]'
                }`}
              >
                {t(step.labelKey, step.defaultLabel)}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                  idx < currentIdx ? 'bg-[#0284C7]' : 'bg-[#E2E8F0]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusTracker;
