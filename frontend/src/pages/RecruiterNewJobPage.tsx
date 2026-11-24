import React, { useState } from 'react';
import { api } from '../api/client';
import { EmploymentType, ExperienceLevel, RubricCriteria, ScreeningQuestion, SkillRequirement } from '../types';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, HelpCircle } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { JobRubricBuilder } from '../components/domain/JobRubricBuilder';

export const RecruiterNewJobPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('Remote');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('senior');
  const [minYearsExp, setMinYearsExp] = useState(3);
  const [salaryMin, setSalaryMin] = useState<number | ''>(120000);
  const [salaryMax, setSalaryMax] = useState<number | ''>(160000);
  const [description, setDescription] = useState('');

  // Skills & Rubrics state
  const [skills, setSkills] = useState<SkillRequirement[]>([
    { name: 'Kubernetes', weight: 1.0, required: true },
    { name: 'Python', weight: 0.9, required: true },
    { name: 'FastAPI', weight: 0.8, required: true },
    { name: 'Docker', weight: 0.8, required: true },
  ]);

  const [rubrics, setRubrics] = useState<RubricCriteria[]>([
    { category: 'System Architecture', weight: 0.4, description: 'Microservices and DDD distributed systems expertise' },
    { category: 'Container Orchestration', weight: 0.4, description: 'Production Kubernetes cluster management and HPA' },
    { category: 'Code Quality & Security', weight: 0.2, description: 'Defensive programming and automated test coverage' },
  ]);

  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestion[]>([
    { question_id: 'q1', question_text: 'How do you design zero-downtime rolling updates in Kubernetes?', required: true },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const addQuestion = () => {
    const nextId = `q${screeningQuestions.length + 1}`;
    setScreeningQuestions([...screeningQuestions, { question_id: nextId, question_text: '', required: true }]);
  };

  const removeQuestion = (idx: number) => {
    setScreeningQuestions(screeningQuestions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      error('Validation Error', 'Please specify a job title and description.');
      return;
    }

    if (skills.length === 0) {
      error('Validation Error', 'Please specify at least one required technical skill.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.jobs.create({
        title,
        department,
        location,
        employment_type: employmentType,
        experience_level: experienceLevel,
        min_years_exp: Number(minYearsExp),
        salary_min: salaryMin ? Number(salaryMin) : undefined,
        salary_max: salaryMax ? Number(salaryMax) : undefined,
        salary_currency: 'USD',
        description,
        required_skills: skills,
        nice_to_have_skills: [],
        rubric_criteria: rubrics,
        screening_questions: screeningQuestions.filter((q) => q.question_text.trim()),
      });

      success('Requisition Created!', `Job "${created.title}" is published and ready for applicants.`);
      navigate(`/recruiter/jobs/${created.id}/pipeline`);
    } catch (err: any) {
      error('Failed to create job', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/recruiter/jobs" className="inline-flex items-center gap-2 text-xs text-surface-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Requisitions
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create Job Requisition</h1>
            <p className="text-xs text-surface-400 mt-1">
              Configure role parameters, skill importance multipliers, and AI evaluation rubrics
            </p>
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} leftIcon={<Save className="w-4 h-4" />}>
            Publish Requisition
          </Button>
        </div>

        {/* 1. Basic Details */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-white">Position Specifications</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Job Title"
              placeholder="e.g. Senior Cloud & Infrastructure Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="DevOps">DevOps & Cloud</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Security">Security</option>
                  <option value="AI / ML">AI / ML</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full bg-surface-950 border border-surface-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="full_time">Full-Time</option>
                  <option value="contract">Contract</option>
                  <option value="part_time">Part-Time</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full bg-surface-950 border border-surface-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="principal">Principal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Location"
                placeholder="e.g. Remote / San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <Input
                label="Min Experience (Years)"
                type="number"
                min={0}
                max={30}
                value={minYearsExp}
                onChange={(e) => setMinYearsExp(Number(e.target.value))}
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Salary Min ($)"
                  type="number"
                  placeholder="Min"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <Input
                  label="Salary Max ($)"
                  type="number"
                  placeholder="Max"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5">
                Full Job Description & Overview
              </label>
              <textarea
                rows={5}
                placeholder="Describe role expectations, day-to-day responsibilities, and architecture scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </CardBody>
        </Card>

        {/* 2. Skills & Rubric Builder */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-white">AI Agent Rubric Matrix</h3>
          </CardHeader>
          <CardBody>
            <JobRubricBuilder
              skills={skills}
              onSkillsChange={setSkills}
              rubrics={rubrics}
              onRubricsChange={setRubrics}
            />
          </CardBody>
        </Card>

        {/* 3. Screening Questions */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Applicant Screening Questions</h3>
              <p className="text-xs text-surface-400 mt-0.5">Custom questions candidates must answer during submission</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addQuestion} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Question
            </Button>
          </CardHeader>
          <CardBody className="space-y-3">
            {screeningQuestions.map((q, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-surface-950 p-3 rounded-xl border border-surface-800">
                <span className="font-mono text-xs text-surface-400 w-8">{q.question_id}:</span>
                <input
                  type="text"
                  placeholder="Type screening question..."
                  value={q.question_text}
                  onChange={(e) => {
                    const next = [...screeningQuestions];
                    next[idx].question_text = e.target.value;
                    setScreeningQuestions(next);
                  }}
                  className="flex-1 bg-surface-900 border border-surface-800 rounded-lg px-3 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  className="p-1.5 text-surface-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </CardBody>
        </Card>
      </form>
    </div>
  );
};
