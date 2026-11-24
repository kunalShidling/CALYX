// ==============================================================================
// CALYX FRONTEND: TYPE DEFINITIONS
// ==============================================================================

export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: User;
}

export interface SkillRequirement {
  name: string;
  weight: number;
  required: boolean;
}

export interface RubricCriteria {
  category: string;
  weight: number;
  description: string;
}

export interface ScreeningQuestion {
  question_id: string;
  question_text: string;
  required: boolean;
}

export interface CandidateAnswer {
  question_id: string;
  answer_text: string;
}

export type JobStatus = 'draft' | 'published' | 'closed' | 'archived';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'principal';

export interface JobPosting {
  id: string;
  recruiter_id: number;
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  min_years_exp: number;
  max_years_exp?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency: string;
  description: string;
  required_skills: SkillRequirement[];
  nice_to_have_skills: string[];
  rubric_criteria: RubricCriteria[];
  screening_questions: ScreeningQuestion[];
  status: JobStatus;
  total_applicants: number;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | 'submitted'
  | 'screening'
  | 'agent_evaluated'
  | 'interviewing'
  | 'offered'
  | 'rejected';

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_id: number;
  resume_id: string;
  answers: CandidateAnswer[];
  status: ApplicationStatus;
  match_score?: number | null;
  agent_summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedResume {
  resume_id: string;
  candidate_id: number;
  file_name: string;
  candidate_name: string;
  email?: string | null;
  phone?: string | null;
  skills: string[];
  experience_years: number;
  education: string[];
  word_count: number;
  character_count: number;
  created_at: string;
}

export interface CandidateMatchItem {
  resume_id: string;
  candidate_id: number;
  candidate_name: string;
  email?: string | null;
  match_score: number;
  semantic_similarity: number;
  matched_skills: string[];
  missing_skills: string[];
  total_skills: string[];
  experience_years: number;
  education: string[];
}

export interface ResumeSearchResult {
  total_candidates_indexed: number;
  top_matches: CandidateMatchItem[];
}

export interface RubricCategoryScore {
  category: string;
  weight: number;
  score: number;
  weighted_score: number;
  justification: string;
}

export interface InterviewQuestionItem {
  question_id: string;
  focus_area: string;
  question_prompt: string;
  rationale: string;
  ideal_response_key: string;
  follow_up_probe: string;
}

export interface FairnessAuditResult {
  audit_passed: boolean;
  certificate_id: string;
  demographic_penalty_applied: boolean;
  masked_signals_count: number;
  audit_note: string;
}

export interface EvaluationResult {
  task_id: string;
  application_id: string;
  candidate_id?: number | null;
  status: string;
  final_score: number;
  detected_specialty: string;
  fairness_audit: FairnessAuditResult;
  rubric_breakdown: RubricCategoryScore[];
  interview_questionnaire: InterviewQuestionItem[];
  executive_summary: string;
  completed_at: string;
}

export interface AgentTraceStep {
  agent: string;
  timestamp: string;
  thought: string;
  action: string;
  output: any;
}

export interface AgentTraceResponse {
  task_id: string;
  steps: AgentTraceStep[];
}

export interface PipelineEventItem {
  id: number;
  event_type: string;
  entity_id: string;
  user_id?: number | null;
  created_at: string;
}

export interface DashboardOverview {
  total_events_recorded: number;
  total_applications_evaluated: number;
  average_pipeline_score: number;
  status_funnel: Record<string, number>;
  recent_activity: PipelineEventItem[];
}

export interface JobDistribution {
  job_id: string;
  total_applicants: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  score_brackets: {
    top_tier: number;
    strong: number;
    average: number;
    below_50: number;
  };
}

export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
