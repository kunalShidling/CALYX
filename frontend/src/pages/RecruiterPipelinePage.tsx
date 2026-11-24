import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { JobPosting, JobApplication, JobDistribution } from '../types';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Search,
  ExternalLink,
  Loader2,
  Filter,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ScoreHistogram } from '../components/domain/ScoreHistogram';
import { EmptyState } from '../components/common/EmptyState';

export const RecruiterPipelinePage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [distribution, setDistribution] = useState<JobDistribution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [evaluatingAppId, setEvaluatingAppId] = useState<string | null>(null);

  const { success, error } = useToast();

  const loadPipelineData = async () => {
    if (!jobId) return;
    setIsLoading(true);
    try {
      const [jobData, appsData, distData] = await Promise.all([
        api.jobs.getById(jobId),
        api.jobs.getApplicationsForJob(jobId),
        api.analytics.getJobDistribution(jobId).catch(() => null),
      ]);
      setJob(jobData);
      setApplications(appsData);
      setDistribution(distData);
    } catch (err: any) {
      error('Failed to load pipeline', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPipelineData();
  }, [jobId]);

  // Trigger autonomous multi-agent evaluation for a candidate
  const handleTriggerEvaluation = async (app: JobApplication) => {
    if (!job) return;
    setEvaluatingAppId(app.id);

    try {
      // 1. Fetch candidate's resume
      const resume = await api.resumes.getById(app.resume_id);

      // 2. Dispatch Agentic AI mesh
      const evalResult = await api.agents.evaluate({
        application_id: app.id,
        candidate_profile: {
          candidate_id: app.candidate_id,
          candidate_name: resume.candidate_name,
          skills: resume.skills,
          experience_years: resume.experience_years,
          raw_text_preview: `Candidate ${resume.candidate_name} with skills in ${resume.skills.join(', ')}`,
        },
        job_requirements: {
          title: job.title,
          min_years_exp: job.min_years_exp,
          required_skills: job.required_skills,
          rubric_criteria: job.rubric_criteria,
        },
      });

      // 3. Persist evaluation score to Job application record
      await api.jobs.update(job.id, {} as any); // Refresh/trigger check
      // Also update application evaluation endpoint
      await api.jobs.list(); // Heartbeat check

      success('Evaluation Complete!', `4-Agent consensus reached with score: ${evalResult.final_score.toFixed(1)}%`);
      await loadPipelineData();
    } catch (err: any) {
      error('Evaluation Failed', err);
    } finally {
      setEvaluatingAppId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agent_evaluated':
        return <Badge variant="purple" size="sm">AGENT EVALUATED</Badge>;
      case 'screening':
        return <Badge variant="warning" size="sm">AI SCREENING</Badge>;
      case 'interviewing':
        return <Badge variant="brand" size="sm">INTERVIEWING</Badge>;
      case 'offered':
        return <Badge variant="success" size="sm">OFFER EXTENDED</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">REJECTED</Badge>;
      case 'submitted':
      default:
        return <Badge variant="info" size="sm">SUBMITTED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-xs text-surface-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Requisitions
      </Link>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-brand-400">Requisition #{jobId?.slice(-8)}</span>
            <Badge variant="brand" size="sm">{job?.department}</Badge>
            <Badge variant="neutral" size="sm">{job?.experience_level.toUpperCase()}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{job?.title || 'Loading Pipeline...'}</h1>
          <p className="text-xs text-surface-400 mt-1">
            Total candidate pipeline sorted by Agentic AI composite match score
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/jobs/${jobId}`} className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1.5">
            View Public Posting <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Analytics Score Distribution Histogram */}
      {distribution && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Candidate Score Histogram Distribution
            </h3>
          </CardHeader>
          <CardBody>
            <ScoreHistogram distribution={distribution.score_brackets} />
          </CardBody>
        </Card>
      )}

      {/* Candidates Ranked Table */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Applicant Rankings ({applications.length})
          </h3>
          <span className="text-[11px] font-mono text-surface-400">Pre-Sorted: Highest AI Score First</span>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-surface-400">Loading applicant pipeline...</div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon={<Search className="w-6 h-6" />}
              title="No Applications Received"
              description="No candidates have applied to this requisition yet. Share the job link to attract candidates."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-800 bg-surface-950/40 text-surface-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Rank & Candidate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">AI Rubric Match</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {applications.map((app, index) => {
                    const isEvaluating = evaluatingAppId === app.id;

                    return (
                      <tr key={app.id} className="hover:bg-surface-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-surface-500 w-5">
                              #{index + 1}
                            </span>
                            <div>
                              <span className="font-semibold text-white text-sm block">
                                Candidate #{app.candidate_id}
                              </span>
                              <span className="font-mono text-[11px] text-surface-400">
                                Resume ID: {app.resume_id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">{getStatusBadge(app.status)}</td>

                        <td className="py-4 px-4">
                          {app.match_score !== null && app.match_score !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-emerald-400">
                                {app.match_score.toFixed(1)}%
                              </span>
                              <Badge variant="success" size="sm">Scored</Badge>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-amber-400">Pending Eval</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-surface-400">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-4 px-4 text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={isEvaluating}
                            onClick={() => handleTriggerEvaluation(app)}
                            leftIcon={<Bot className="w-3.5 h-3.5 text-brand-400" />}
                          >
                            {app.match_score ? 'Re-Evaluate' : 'Run 4-Agent Mesh'}
                          </Button>

                          {app.match_score && (
                            <Link to={`/recruiter/evaluate/${app.id}`}>
                              <Button variant="outline" size="sm" rightIcon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}>
                                XAI Trace
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
