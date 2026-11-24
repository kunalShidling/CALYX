import React, { useState } from 'react';
import { InterviewQuestionItem } from '../../types';
import { ChevronDown, ChevronRight, HelpCircle, KeyRound, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';

export interface InterviewQuestionAccordionProps {
  questions: InterviewQuestionItem[];
}

export const InterviewQuestionAccordion: React.FC<InterviewQuestionAccordionProps> = ({ questions }) => {
  const [openIds, setOpenIds] = useState<string[]>([questions[0]?.question_id || '']);

  const toggle = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  if (!questions || questions.length === 0) {
    return <p className="text-xs text-surface-400">No interview questions synthesized.</p>;
  }

  return (
    <div className="space-y-3">
      {questions.map((q, idx) => {
        const isOpen = openIds.includes(q.question_id);

        return (
          <div
            key={q.question_id || idx}
            className="border border-surface-800 rounded-xl overflow-hidden bg-surface-900/60 hover:border-surface-700 transition-colors"
          >
            <button
              onClick={() => toggle(q.question_id)}
              className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
            >
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-purple-400">Question #{idx + 1}</span>
                    <Badge variant="purple" size="sm">
                      {q.focus_area}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-white mt-1 leading-snug line-clamp-1">
                    {q.question_prompt}
                  </p>
                </div>
              </div>

              <div className="text-surface-400 shrink-0">
                {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-2 border-t border-surface-800 bg-surface-950/60 space-y-4">
                {/* Full Question Prompt */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                    Interview Prompt:
                  </span>
                  <p className="text-sm text-surface-100 mt-1 leading-relaxed bg-surface-900 p-3.5 rounded-xl border border-surface-800">
                    {q.question_prompt}
                  </p>
                </div>

                {/* Rationale */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    AI Agent Synthesis Rationale:
                  </span>
                  <p className="text-xs text-surface-300 mt-1 leading-relaxed bg-surface-900/50 p-3 rounded-lg border border-surface-800/80">
                    {q.rationale}
                  </p>
                </div>

                {/* Ideal Response Key */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Ideal Answer Key & High-Signal Indicators:
                  </span>
                  <p className="text-xs text-emerald-200 mt-1 leading-relaxed bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-500/20">
                    {q.ideal_response_key}
                  </p>
                </div>

                {/* Follow up probe */}
                {q.follow_up_probe && (
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                      Recommended Follow-Up Probe:
                    </span>
                    <p className="text-xs text-amber-200 mt-1 leading-relaxed bg-amber-950/20 p-3 rounded-lg border border-amber-500/20">
                      "{q.follow_up_probe}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
