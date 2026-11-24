import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { JobPosting } from '../types';
import { Link } from 'react-router-dom';
import { Briefcase, PlusCircle, Users, ArrowRight, MapPin, Clock, Search } from 'lucide-react';
import { Card, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';

export const RecruiterJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const data = await api.jobs.list({ keyword: keyword || undefined, limit: 100 });
      setJobs(data.jobs);
    } catch (err) {
      console.error('Failed to load recruiter jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Job Requisitions</h1>
          <p className="text-xs text-surface-400 mt-1">
            Manage hiring requirements, evaluate candidate pipelines, and calibrate AI rubrics
          </p>
        </div>

        <Link to="/recruiter/jobs/new">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
            Create New Requisition
          </Button>
        </Link>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Filter requisitions by title or department..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-surface-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-6 h-6" />}
          title="No Requisitions Created"
          description="Create your first job requisition to start receiving and screening candidate applications."
          actionText="Create Requisition"
          onAction={() => (window.location.href = '/recruiter/jobs/new')}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} hover>
              <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <Badge variant="brand" size="sm">
                      {job.department}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {job.experience_level.toUpperCase()}
                    </Badge>
                    <Badge variant={job.status === 'published' ? 'success' : 'neutral'} size="sm">
                      {job.status.toUpperCase()}
                    </Badge>
                    <span className="font-mono text-xs text-surface-400">ID: #{job.id.slice(-8)}</span>
                  </div>

                  <h3 className="text-base font-semibold text-white truncate">{job.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-surface-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Min. {job.min_years_exp} yrs exp
                    </span>
                    <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-xl font-bold text-white block">
                      {job.total_applicants}
                    </span>
                    <span className="text-[10px] text-surface-400 uppercase font-mono">
                      Applicants
                    </span>
                  </div>

                  <Link to={`/recruiter/jobs/${job.id}/pipeline`}>
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Pipeline
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
