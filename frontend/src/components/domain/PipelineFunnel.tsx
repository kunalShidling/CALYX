import React from 'react';
import { Users, Bot, MessageSquare, Award } from 'lucide-react';

export interface PipelineFunnelProps {
  funnel: Record<string, number>;
}

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ funnel }) => {
  const stages = [
    {
      id: 'applications_submitted',
      label: 'Applications Submitted',
      icon: <Users className="w-4 h-4 text-sky-400" />,
      color: 'bg-sky-500',
      count: funnel['applications_submitted'] || 0,
    },
    {
      id: 'agent_evaluations_completed',
      label: 'Agent Evaluations',
      icon: <Bot className="w-4 h-4 text-brand-400" />,
      color: 'bg-brand-500',
      count: funnel['agent_evaluations_completed'] || 0,
    },
    {
      id: 'interview_invites',
      label: 'Technical Interviews',
      icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
      color: 'bg-purple-500',
      count: funnel['interview_invites'] || 0,
    },
    {
      id: 'offers_extended',
      label: 'Offers Extended',
      icon: <Award className="w-4 h-4 text-emerald-400" />,
      color: 'bg-emerald-500',
      count: funnel['offers_extended'] || 0,
    },
  ];

  const maxVal = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-4">
      {stages.map((stage, idx) => {
        const percentage = Math.min(100, Math.max(5, (stage.count / maxVal) * 100));

        return (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-surface-300 font-medium">
                {stage.icon}
                {stage.label}
              </span>
              <span className="font-mono font-bold text-white text-sm">{stage.count}</span>
            </div>

            <div className="h-3 w-full bg-surface-950 rounded-full overflow-hidden border border-surface-800">
              <div
                className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
