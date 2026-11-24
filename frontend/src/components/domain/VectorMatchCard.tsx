import React from 'react';
import { CandidateMatchItem } from '../../types';
import { Award, Briefcase, Check, GraduationCap, Sparkles, User, X } from 'lucide-react';
import { Badge } from '../common/Badge';
import { ProgressBar } from '../common/ProgressBar';

export interface VectorMatchCardProps {
  match: CandidateMatchItem;
  rank: number;
  onEvaluate?: () => void;
}

export const VectorMatchCard: React.FC<VectorMatchCardProps> = ({ match, rank, onEvaluate }) => {
  const getScoreColor = (score: number): 'emerald' | 'brand' | 'amber' | 'rose' => {
    if (score >= 85) return 'emerald';
    if (score >= 70) return 'brand';
    if (score >= 50) return 'amber';
    return 'rose';
  };

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5 hover:border-surface-700 transition-all shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center font-mono font-bold text-sm text-brand-400 border border-surface-700 shrink-0">
            #{rank}
          </div>
          <div>
            <h4 className="text-base font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-surface-400" />
              {match.candidate_name}
            </h4>
            <div className="flex items-center gap-3 text-xs text-surface-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {match.experience_years} years exp
              </span>
              {match.email && <span>{match.email}</span>}
              {match.education && match.education.length > 0 && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {match.education[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score Pill */}
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-950 border border-surface-800">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="font-mono text-base font-bold text-white">{match.match_score.toFixed(1)}%</span>
          </div>
          <span className="text-[10px] font-mono text-surface-400 block mt-1">
            Cosine ANN: {(match.semantic_similarity * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Cosine similarity bar */}
      <div className="mt-4 pt-3 border-t border-surface-800/80">
        <ProgressBar
          value={match.match_score}
          color={getScoreColor(match.match_score)}
          size="sm"
          label="Vector Space Relevance"
        />
      </div>

      {/* Matched & Missing Skills */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[11px] font-semibold text-surface-400 flex items-center gap-1 mb-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Matched Skills ({match.matched_skills.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {match.matched_skills.map((s, i) => (
              <Badge key={i} variant="success" size="sm">
                {s}
              </Badge>
            ))}
            {match.matched_skills.length === 0 && <span className="text-surface-500">None matched</span>}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-surface-400 flex items-center gap-1 mb-1.5">
            <X className="w-3.5 h-3.5 text-rose-400" /> Missing Skills ({match.missing_skills.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {match.missing_skills.map((s, i) => (
              <Badge key={i} variant="danger" size="sm">
                {s}
              </Badge>
            ))}
            {match.missing_skills.length === 0 && (
              <Badge variant="success" size="sm">
                Full Coverage
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
