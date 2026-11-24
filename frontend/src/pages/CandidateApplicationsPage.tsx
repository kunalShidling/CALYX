import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { JobApplication } from '../types';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { Send, FileText, CheckCircle2, Clock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardBody } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

export const CandidateApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const data = await api.jobs.getMyApplications();
        setApplications(data);
      } catch (err: any) {
        error('Failed to load applications', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agent_evaluated':
        return <Badge variant="purple">AGENT EVALUATED</Badge>;
      case 'screening':
        return <Badge variant="warning">AI SCREENING IN PROGRESS</Badge>;
      case 'interviewing':
        return <Badge variant="brand">INTERVIEWING</Badge>;
      case 'offered':
        return <Badge variant="success">OFFER EXTENDED</Badge>;
      case 'rejected':
        return <Badge variant="danger">NOT SELECTED</Badge>;
      case 'submitted':
      default:
        return <Badge variant="info">APPLICATION SUBMITTED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Your Job Applications</h1>
        <p className="text-xs text-surface-400 mt-1">
          Monitor your application lifecycle and review transparent Agentic AI screening evaluations
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-surface-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<Send className="w-6 h-6" />}
          title="No Active Applications"
          description="You haven't submitted any applications yet. Browse the job board to find roles matching your skillset."
          actionText="Explore Job Openings"
          onAction={() => (window.location.href = '/jobs')}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardBody className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {getStatusBadge(app.status)}
                      <span className="font-mono text-xs text-surface-400">
                        Application ID: {app.id}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white">
                      Job Requisition #{app.job_id}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-surface-400 mt-1">
                      <span>Submitted: {new Date(app.created_at).toLocaleDateString()}</span>
                      <span className="font-mono text-surface-500">Resume Ref: {app.resume_id}</span>
                    </div>
                  </div>

                  {/* Match Score Display */}
                  <div className="text-right shrink-0">
                    {app.match_score !== null && app.match_score !== undefined ? (
                      <div className="bg-surface-950 p-3 rounded-xl border border-surface-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-lg font-bold text-white block">
                            {app.match_score.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-surface-400 uppercase font-mono">
                            Rubric Match Score
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-surface-950 px-3 py-2 rounded-xl border border-surface-800 text-xs text-amber-400 font-mono">
                        Awaiting Agent Scoring
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Summary critique if evaluated */}
                {app.agent_summary && (
                  <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 text-xs text-surface-300 leading-relaxed space-y-1">
                    <span className="font-semibold text-white block text-[11px] uppercase tracking-wider text-purple-400">
                      Multi-Agent Consensus Evaluation Critique:
                    </span>
                    <p>{app.agent_summary}</p>
                  </div>
                )}

                {/* Screening Question Responses */}
                {app.answers && app.answers.length > 0 && (
                  <div className="pt-3 border-t border-surface-800/80">
                    <span className="text-[11px] font-semibold text-surface-400 block mb-2">
                      Submitted Screening Answers ({app.answers.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {app.answers.map((ans, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-surface-950/60 border border-surface-800">
                          <span className="font-mono text-[10px] text-surface-500 uppercase block">
                            {ans.question_id}
                          </span>
                          <span className="text-surface-200 mt-0.5 block truncate">
                            {ans.answer_text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
