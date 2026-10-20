import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const steps = [
  { key: 'Pending', label: 'Submitted', icon: AlertTriangle, color: 'orange' },
  { key: 'In Progress', label: 'In Progress', icon: Clock, color: 'blue' },
  { key: 'Resolved', label: 'Resolved', icon: CheckCircle2, color: 'green' },
];

const statusIndex = { 'Pending': 0, 'In Progress': 1, 'Resolved': 2 };

const StatusTracker = ({ status = 'Pending', compact = false }) => {
  const currentIdx = statusIndex[status] ?? 0;

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        {steps.map((step, idx) => {
          const isActive = idx <= currentIdx;
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  isActive
                    ? `bg-${step.color}-400 shadow-[0_0_6px] shadow-${step.color}-400/50`
                    : 'bg-gray-600'
                }`}
              />
              {idx < steps.length - 1 && (
                <div
                  className={`w-4 h-0.5 ${
                    idx < currentIdx ? `bg-${steps[idx + 1].color}-400/50` : 'bg-gray-700'
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
    <div className="flex items-center justify-between w-full">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? `bg-${step.color}-500/20 border-2 border-${step.color}-400 shadow-lg shadow-${step.color}-500/25`
                    : isActive
                    ? `bg-${step.color}-500/10 border border-${step.color}-400/50`
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? `text-${step.color}-400` : 'text-gray-600'
                  }`}
                />
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  isCurrent ? `text-${step.color}-400` : isActive ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                  idx < currentIdx
                    ? 'bg-gradient-to-r from-blue-500/50 to-green-500/50'
                    : 'bg-white/10'
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
