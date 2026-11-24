import React from 'react';
import { FairnessAuditResult } from '../../types';
import { ShieldCheck, AlertTriangle, Award, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export interface FairnessAuditCardProps {
  audit: FairnessAuditResult;
}

export const FairnessAuditCard: React.FC<FairnessAuditCardProps> = ({ audit }) => {
  return (
    <div className="bg-gradient-to-br from-surface-900 to-surface-950 border border-emerald-500/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Background seal watermarking */}
      <div className="absolute -right-6 -bottom-6 text-emerald-500/5 pointer-events-none">
        <Award className="w-48 h-48" />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-white">Algorithmic Fairness Certificate</h4>
              <Badge variant={audit.audit_passed ? 'success' : 'warning'} size="sm">
                {audit.audit_passed ? 'VERIFIED PASSED' : 'FLAGGED'}
              </Badge>
            </div>
            <p className="text-xs text-surface-400 mt-0.5">Autonomous Ethics & Bias Verification Engine</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono uppercase text-surface-400 block">Certificate ID</span>
          <span className="font-mono text-xs font-semibold text-emerald-400 bg-surface-950 px-2.5 py-1 rounded-md border border-emerald-500/20 inline-block mt-0.5">
            {audit.certificate_id}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        <div className="bg-surface-950/80 border border-surface-800 p-3 rounded-xl">
          <span className="text-[11px] text-surface-400 block">Demographic Penalties</span>
          <span className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {audit.demographic_penalty_applied ? 'Detected' : '0.00% (Strict Merit)'}
          </span>
        </div>

        <div className="bg-surface-950/80 border border-surface-800 p-3 rounded-xl">
          <span className="text-[11px] text-surface-400 block">Scrubbed Demographic Markers</span>
          <span className="text-sm font-semibold text-white mt-0.5">
            {audit.masked_signals_count} protected signals masked
          </span>
        </div>

        <div className="bg-surface-950/80 border border-surface-800 p-3 rounded-xl">
          <span className="text-[11px] text-surface-400 block">Compliance Standard</span>
          <span className="text-sm font-semibold text-emerald-400 mt-0.5">
            EEOC & DE&I Calibrated
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-surface-800/80 text-xs text-surface-300 leading-relaxed relative z-10 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>{audit.audit_note}</span>
      </div>
    </div>
  );
};
