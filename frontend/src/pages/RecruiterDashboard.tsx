import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DashboardOverview, JobPosting } from '../types';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Briefcase,
  Sparkles,
  PlusCircle,
  Search,
  ArrowRight,
  Activity,
  Layers,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PipelineFunnel } from '../components/domain/PipelineFunnel';

export const RecruiterDashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [dashData, jobsData] = await Promise.all([
          api.analytics.getDashboard(),
          api.jobs.list({ limit: 4 }),
        ]);
        setOverview(dashData);
        setRecentJobs(jobsData.jobs);
      } catch (err) {
        console.error('Failed to load recruiter analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-widest block mb-1">
            Recruiter Operations Control
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Recruitment Intelligence</h1>
          <p className="text-xs text-surface-400 mt-1">
            Real-time pipeline funnels, autonomous multi-agent evaluations, and hiring velocity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/recruiter/search">
            <Button variant="secondary" size="sm" leftIcon={<Search className="w-3.5 h-3.5" />}>
              Vector Candidate Search
            </Button>
          </Link>
          <Link to="/recruiter/jobs/new">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
              Create Requisition
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-5">
            <span className="text-xs text-surface-400 font-medium">Pipeline Events Recorded</span>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-2xl font-bold text-white font-mono">
                {overview?.total_events_recorded || 0}
              </h3>
              <div className="p-2.5 rounded-xl bg-surface-950 border border-surface-800 text-sky-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs text-surface-400 font-medium">AI Screened Candidates</span>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-2xl font-bold text-white font-mono">
                {overview?.total_applications_evaluated || 0}
              </h3>
              <div className="p-2.5 rounded-xl bg-surface-950 border border-surface-800 text-brand-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs text-surface-400 font-medium">Average Rubric Match</span>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-2xl font-bold text-emerald-400 font-mono">
                {overview?.average_pipeline_score ? overview.average_pipeline_score.toFixed(1) + '%' : '0.0%'}
              </h3>
              <div className="p-2.5 rounded-xl bg-surface-950 border border-surface-800 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs text-surface-400 font-medium">Active Requisitions</span>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-2xl font-bold text-white font-mono">
                {recentJobs.length}
              </h3>
              <div className="p-2.5 rounded-xl bg-surface-950 border border-surface-800 text-purple-400">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Conversion Funnel & Requisitions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pipeline Conversion Funnel */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-400" />
              Recruitment Conversion Funnel
            </h3>
            <span className="text-[11px] font-mono text-surface-400">Event-Sourced</span>
          </CardHeader>
          <CardBody className="p-6">
            {overview?.status_funnel ? (
              <PipelineFunnel funnel={overview.status_funnel} />
            ) : (
              <p className="text-xs text-surface-400">No conversion funnel data available.</p>
            )}
          </CardBody>
        </Card>

        {/* Right: Active Requisitions Pipeline Status */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Requisitions & Applicant Pools
            </h3>
            <Link to="/recruiter/jobs" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
              View all →
            </Link>
          </CardHeader>
          <CardBody className="p-6 space-y-3">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white truncate block">{job.title}</span>
                  <span className="text-[11px] text-surface-400 mt-0.5 block">
                    {job.department} • {job.experience_level.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-white block">
                      {job.total_applicants}
                    </span>
                    <span className="text-[10px] text-surface-400 block">Applicants</span>
                  </div>

                  <Link
                    to={`/recruiter/jobs/${job.id}/pipeline`}
                    className="p-2 rounded-lg bg-surface-800 hover:bg-brand-600 text-surface-300 hover:text-white transition-colors"
                    title="Open Pipeline"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Recent Platform Activity Stream
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          {overview?.recent_activity && overview.recent_activity.length > 0 ? (
            <div className="divide-y divide-surface-800">
              {overview.recent_activity.slice(0, 6).map((event) => (
                <div key={event.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500" />
                    <div>
                      <span className="font-mono font-semibold text-white">{event.event_type}</span>
                      <span className="text-surface-400 ml-2">Entity #{event.entity_id.slice(-8)}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-surface-500">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-surface-400">No activity events recorded yet.</div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
