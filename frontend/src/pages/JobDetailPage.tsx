import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { JobPosting, ParsedResume } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  Send,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [resumes, setResumes] = useState<ParsedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAuthenticated, isCandidate } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      setIsLoading(true);
      try {
        const data = await api.jobs.getById(jobId);
        setJob(data);
      } catch (err: any) {
        error('Error Loading Job', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleOpenApply = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/jobs/${jobId}` } } });
      return;
    }

    try {
      const userResumes = await api.resumes.getMyResumes();
      setResumes(userResumes);
      if (userResumes.length > 0) {
        setSelectedResumeId(userResumes[0].resume_id);
      }
      setIsApplyModalOpen(true);
    } catch (err: any) {
      error('Failed to load resumes', 'Please upload a resume in the candidate portal before applying.');
      navigate('/candidate/resumes');
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId || !selectedResumeId) {
      error('Selection Required', 'Please choose a resume for this application.');
      return;
    }

    // Check required screening questions
    if (job?.screening_questions) {
      for (const q of job.screening_questions) {
        if (q.required && (!answers[q.question_id] || !answers[q.question_id].trim())) {
          error('Missing Answer', `Please answer the required question: "${q.question_text}"`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([question_id, answer_text]) => ({
        question_id,
        answer_text,
      }));

      await api.jobs.apply(jobId, {
        job_id: jobId,
        resume_id: selectedResumeId,
        answers: formattedAnswers,
      });

      success('Application Submitted!', 'Your application has been received and queued for Agentic AI screening.');
      setIsApplyModalOpen(false);
      navigate('/candidate/applications');
    } catch (err: any) {
      error('Application Failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8">
        <div className="h-8 bg-surface-900 rounded-lg w-1/3 animate-pulse" />
        <div className="h-64 bg-surface-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Job Requisition Not Found</h2>
        <Link to="/jobs" className="text-brand-400 text-xs mt-2 inline-block">
          Return to Job Openings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/jobs" className="inline-flex items-center gap-2 text-xs text-surface-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to All Openings
      </Link>

      {/* Main Job Header Card */}
      <Card>
        <CardBody className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="brand" size="sm">
                  {job.department}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {job.experience_level.toUpperCase()}
                </Badge>
                <Badge variant="info" size="sm">
                  {job.employment_type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{job.title}</h1>
              <div className="flex items-center gap-4 text-xs text-surface-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Min. {job.min_years_exp} years experience
                </span>
                {job.salary_min && job.salary_max && (
                  <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.salary_currency}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleOpenApply}
              leftIcon={<Send className="w-4 h-4" />}
              className="shrink-0"
            >
              Apply for Position
            </Button>
          </div>

          <div className="pt-6 border-t border-surface-800 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-300">
              Role Overview & Responsibilities
            </h3>
            <p className="text-xs text-surface-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Required Skills Matrix */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-white">Technical Competencies & AI Rubrics</h3>
        </CardHeader>
        <CardBody className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 block mb-3">
              Required Technical Skills & Importance Multipliers
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.required_skills?.map((skill, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-surface-800"
                >
                  <span className="text-xs font-medium text-white flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                    {skill.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-surface-500 font-mono">Weight:</span>
                    <Badge variant={skill.weight >= 0.8 ? 'brand' : 'neutral'} size="sm">
                      {skill.weight}x
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {job.nice_to_have_skills && job.nice_to_have_skills.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 block mb-3">
                Preferred Nice-to-Have Skills
              </span>
              <div className="flex flex-wrap gap-2">
                {job.nice_to_have_skills.map((skill, idx) => (
                  <Badge key={idx} variant="neutral" size="sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {job.rubric_criteria && job.rubric_criteria.length > 0 && (
            <div className="pt-4 border-t border-surface-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 block mb-3 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-brand-400" />
                Multi-Agent Evaluation Rubric Breakdown
              </span>
              <div className="space-y-2">
                {job.rubric_criteria.map((rubric, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-950 border border-surface-800 flex items-start justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white">{rubric.category}</span>
                      <p className="text-[11px] text-surface-400 mt-0.5">{rubric.description}</p>
                    </div>
                    <Badge variant="purple" size="sm" className="shrink-0 font-mono">
                      {(rubric.weight * 100).toFixed(0)}% weight
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Candidate Apply Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply for ${job.title}`}
        description="Select your parsed resume and answer the required screening questions"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitApplication} className="space-y-6">
          {/* Resume Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-2">
              Select Profile Resume
            </label>
            {resumes.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-surface-800 text-center space-y-2">
                <FileText className="w-6 h-6 text-surface-400 mx-auto" />
                <p className="text-xs text-surface-300">No resumes found in your candidate profile.</p>
                <Link
                  to="/candidate/resumes"
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 inline-block"
                >
                  Upload a resume first →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {resumes.map((r) => (
                  <label
                    key={r.resume_id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedResumeId === r.resume_id
                        ? 'border-brand-500 bg-brand-500/10 text-white'
                        : 'border-surface-800 bg-surface-950 text-surface-300 hover:border-surface-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="selected_resume"
                        value={r.resume_id}
                        checked={selectedResumeId === r.resume_id}
                        onChange={() => setSelectedResumeId(r.resume_id)}
                        className="text-brand-500 focus:ring-brand-500 bg-surface-900 border-surface-700"
                      />
                      <div>
                        <span className="text-xs font-semibold text-white block">{r.file_name}</span>
                        <span className="text-[10px] text-surface-400 font-mono">
                          {r.skills.slice(0, 3).join(', ')} • {r.experience_years} yrs exp
                        </span>
                      </div>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </Badge>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Screening Questions */}
          {job.screening_questions && job.screening_questions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-surface-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-300 block">
                Screening Questions
              </span>
              {job.screening_questions.map((q) => (
                <div key={q.question_id} className="space-y-1.5">
                  <label className="block text-xs font-medium text-surface-200">
                    {q.question_text}{' '}
                    {q.required && <span className="text-rose-400">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Your technical response..."
                    value={answers[q.question_id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.question_id]: e.target.value })}
                    className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
                    required={q.required}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={resumes.length === 0}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
