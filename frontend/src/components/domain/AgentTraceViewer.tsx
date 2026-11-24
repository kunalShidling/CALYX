import React, { useState } from 'react';
import { AgentTraceStep } from '../../types';
import { Bot, CheckCircle, ChevronDown, ChevronRight, Cpu, Eye, ShieldCheck, HelpCircle } from 'lucide-react';
import { Badge } from '../common/Badge';

export interface AgentTraceViewerProps {
  steps: AgentTraceStep[];
  taskId?: string;
}

export const AgentTraceViewer: React.FC<AgentTraceViewerProps> = ({ steps, taskId }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const getAgentIcon = (name: string) => {
    if (name.includes('Normalization')) return <Bot className="w-4 h-4 text-sky-400" />;
    if (name.includes('Criteria') || name.includes('Rubric')) return <Cpu className="w-4 h-4 text-brand-400" />;
    if (name.includes('Bias') || name.includes('Fairness')) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    if (name.includes('Interview')) return <HelpCircle className="w-4 h-4 text-purple-400" />;
    return <Eye className="w-4 h-4 text-surface-400" />;
  };

  const getAgentBadgeVariant = (name: string) => {
    if (name.includes('Normalization')) return 'info';
    if (name.includes('Criteria')) return 'brand';
    if (name.includes('Bias')) return 'success';
    if (name.includes('Interview')) return 'purple';
    return 'neutral';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-400" />
          Autonomous Multi-Agent Consensus Stream
        </h4>
        {taskId && (
          <span className="font-mono text-xs text-surface-400 bg-surface-950 px-2.5 py-1 rounded-md border border-surface-800">
            Task: {taskId}
          </span>
        )}
      </div>

      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-800">
        {steps.map((step, idx) => {
          const isExpanded = expandedIndex === idx;

          return (
            <div key={idx} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-surface-900 border-2 border-brand-500 flex items-center justify-center text-brand-400 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              </div>

              {/* Step Card */}
              <div className="bg-surface-900/90 border border-surface-800 rounded-xl overflow-hidden hover:border-surface-700 transition-colors">
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-surface-950 border border-surface-800">
                      {getAgentIcon(step.agent)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white truncate">{step.agent}</span>
                        <Badge variant={getAgentBadgeVariant(step.agent) as any} size="sm">
                          {step.action}
                        </Badge>
                      </div>
                      <p className="text-xs text-surface-400 mt-0.5 truncate">{step.thought}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="font-mono text-[11px] text-surface-400 hidden sm:inline">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-surface-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-surface-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-surface-800/80 bg-surface-950/40 space-y-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                        Agent Reasoning / Thought Process:
                      </span>
                      <p className="text-xs text-surface-200 mt-1 leading-relaxed bg-surface-950 p-3 rounded-lg border border-surface-800">
                        {step.thought}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                        Structured Output Data:
                      </span>
                      <pre className="font-mono text-xs text-surface-300 mt-1 p-3 bg-surface-950 rounded-lg border border-surface-800 overflow-x-auto max-h-48 leading-snug">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
