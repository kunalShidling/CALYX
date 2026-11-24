import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { JobApplication, ParsedResume, JobPosting } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  FileText,
  Briefcase,
  Send,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [resumes, setResumes] = useState<ParsedResume[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [userApps, userResumes, activeJobs] = await Promise.all([
          api.jobs.getMyApplications(),
          api.resumes.getMyResumes(),
          api.jobs.list({ limit: 4 }),
        ]);
        setApplications(userApps);
        setResumes(userResumes);
        setJobs(activeJobs.jobs);
      } catch (err) {
        console.error('Failed to load candidate dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-surface-900 via-surface-900 to-brand-950/40 border border-surface-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-widest">
              Candidate Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome, {user?.full_name}!
          </h1>
          <p className="text-xs text-surface-400 mt-1 max-w-xl leading-relaxed">
            Track your job applications, manage high-dimensional vector parsed resumes, and review
            autonomous AI screening outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/candidate/resumes">
            <Button variant="primary" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />}>
              Upload New Resume
            </Button>
          </Link>
          <Link to="/jobs">
            <Button variant="secondary" size="sm" leftIcon={<Briefcase className="w-3.5 h-3.5" />}>
              Browse Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-surface-400 font-medium">Submitted Applications</span>
              <h3 className="text-2xl font-bold text-white mt-1">{applications.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 text-sky-400">
              <Send className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-surface-400 font-medium">Indexed Resumes</span>
              <h3 className="text-2xl font-bold text-white mt-1">{resumes.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-surface-400 font-medium">Average Evaluation Score</span>
              <h3 className="text-2xl font-bold text-white mt-1">
                {applications.filter((a) => a.match_score).length > 0
                  ? (
                      applications.reduce((acc, a) => acc + (a.match_score || 0), 0) /
                      applications.filter((a) => a.match_score).length
                    ).toFixed(1) + '%'
                  : 'N/A'}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Grid: Applications & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Applications Tracker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-brand-400" />
              Recent Applications
            </h3>
            <Link to="/candidate/applications" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
              View all →
            </Link>
          </div>

          {applications.length === 0 ? (
            <Card>
              <CardBody className="p-8 text-center text-xs text-surface-400">
                You haven't submitted any job applications yet.{' '}
                <Link to="/jobs" className="text-brand-400 underline font-medium">
                  Browse open positions
                </Link>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <Card key={app.id} hover>
                  <CardBody className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(app.status)}
                        <span className="text-[11px] font-mono text-surface-400">
                          ID: {app.id.slice(-8)}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1 truncate">
                        Requisition #{app.job_id.slice(-8)}
                      </h4>
                      <p className="text-[11px] text-surface-400 mt-0.5">
                        Applied on {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {app.match_score !== null && app.match_score !== undefined ? (
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-base font-bold text-emerald-400">
                            {app.match_score.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-surface-400">AI Match Score</span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-amber-400">In Screening</span>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Openings Spotlight */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              Latest Openings
            </h3>
            <Link to="/jobs" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
              Explore →
            </Link>
          </div>

          <div className="space-y-3">
            {jobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="block group">
                <Card hover>
                  <CardBody className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="brand" size="sm">
                        {job.department}
                      </Badge>
                      <span className="text-[11px] text-surface-400">{job.location}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-brand-400 transition-colors">
                      {job.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-surface-400 pt-2 border-t border-surface-800">
                      <span>{job.experience_level.toUpperCase()}</span>
                      <span className="text-brand-400 group-hover:translate-x-1 transition-transform">
                        View Details →
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
