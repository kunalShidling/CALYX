import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { JobPosting } from '../types';
import { Link } from 'react-router-dom';
import { Briefcase, Search, MapPin, DollarSign, Clock, ArrowRight, Filter } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Card, CardBody } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';

export const JobListPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [department, setDepartment] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await api.jobs.list({
        keyword: keyword || undefined,
        department: department || undefined,
        experience_level: experienceLevel || undefined,
        limit: 50,
      });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, department, experienceLevel]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Active Job Openings</h1>
        <p className="text-xs text-surface-400 mt-1">
          Explore engineering and infrastructure positions evaluated by the CALYX Agentic AI mesh
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Search job title, skills, description..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg px-3 py-2.5 text-xs text-surface-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="DevOps">DevOps & Cloud</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Security">Security</option>
                <option value="AI / ML">AI / ML</option>
              </select>
            </div>

            <div>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-lg px-3 py-2.5 text-xs text-surface-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Experience Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="principal">Principal</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-surface-400 px-1">
        <span>Showing {jobs.length} of {total} available positions</span>
      </div>

      {/* Job Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 bg-surface-900/60 rounded-2xl animate-pulse border border-surface-800" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-6 h-6" />}
          title="No Matching Openings"
          description="We couldn't find any job requisitions matching your filter criteria. Try clearing filters."
          actionText="Clear Filters"
          onAction={() => {
            setKeyword('');
            setDepartment('');
            setExperienceLevel('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="group block">
              <Card hover className="h-full flex flex-col justify-between">
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="brand" size="sm">
                          {job.department}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {job.experience_level.toUpperCase()}
                        </Badge>
                      </div>
                      <h3 className="text-base font-semibold text-white mt-2 group-hover:text-brand-400 transition-colors">
                        {job.title}
                      </h3>
                    </div>

                    <div className="p-2 rounded-lg bg-surface-800 text-surface-400 group-hover:text-white group-hover:bg-brand-600 transition-all shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs text-surface-400 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Required skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.required_skills?.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-950 border border-surface-800 text-surface-300"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {job.required_skills?.length > 4 && (
                      <span className="text-[11px] text-surface-400 self-center">
                        +{job.required_skills.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-xs text-surface-400 pt-3 border-t border-surface-800/80">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                    {job.salary_min && job.salary_max && (
                      <span className="flex items-center gap-1 font-mono text-emerald-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.salary_currency}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {job.min_years_exp}+ yrs
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
