# CALYX: Comprehensive API Inventory & Integration Matrix
**Document Version**: 1.0.0  
**Phase**: Phase 1 — Functionality and API Audit  
**Author**: Multidisciplinary Senior Engineering Team  
**Date**: November 2026  

---

## 1. Executive Summary & Audit Methodology

A complete functionality and endpoint audit was conducted across all five microservices comprising the **CALYX Autonomous Agentic AI Smart Hiring & Talent Screening Platform**. Every controller, route handler, Pydantic schema, database query, authorization dependency, and error handler was analyzed to construct this integration matrix.

### Endpoint Classification Taxonomy
* **Class A: Fully implemented and functional** — Production-ready endpoint with validation, DB persistence, and standard envelope.
* **Class B: Implemented but requiring security/validation hardening** — Functional, but requires token enforcement or CORS tightening.
* **Class C: Missing but necessary for complete frontend workflows** — Capabilities that should be added cleanly without breaking changes.
* **Class D: Internal-only / Service-to-Service endpoints** — Dedicated to inter-microservice communication or background orchestrators.
* **Class E: Administrative / Audit oversight endpoints** — Restricted strictly to users with the `admin` role.
* **Class F: Potentially risky or exposed endpoints** — Exposed on ingress without adequate authentication gates.

---

## 2. API Integration Matrix

### 2.1. `calyx-auth-service` (Base Ingress Route: `/api/v1/auth`)

| Method | Endpoint | Classification | Description & Role | Auth Requirement | Request Schema | Response Schema |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | **Class A** | Create new Candidate, Recruiter, or Admin account | Public | `UserRegisterRequest` | `StandardResponse` (`UserResponse`) |
| `POST` | `/api/v1/auth/login` | **Class A** | Verify credentials, issue JWT access & refresh tokens | Public (Rate limit: 10/min) | `UserLoginRequest` | `StandardResponse` (`AuthTokensData`) |
| `POST` | `/api/v1/auth/refresh` | **Class A** | Rotate short-lived access token using valid refresh token | Public | `TokenRefreshRequest` | `StandardResponse` (`AuthTokensData`) |
| `GET` | `/api/v1/auth/me` | **Class A** | Retrieve authenticated user profile | Bearer JWT (Any role) | None | `StandardResponse` (`UserResponse`) |
| `GET` | `/api/v1/auth/verify` | **Class D** | Downstream service verification of token claims | Bearer JWT Header | None | `StandardResponse` (`TokenVerifyResponse`) |
| `GET` | `/health/live` | **Class D** | Kubernetes liveness probe (checks process state) | None | None | `{"status": "alive"}` |
| `GET` | `/health/ready` | **Class D** | Kubernetes readiness probe (`SELECT 1` DB check) | None | None | `{"status": "ready", ...}` |

---

### 2.2. `calyx-job-service` (Base Ingress Routes: `/api/v1/jobs` & `/api/v1/applications`)

| Method | Endpoint | Classification | Description & Role | Auth Requirement | Request Schema | Response Schema |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/jobs` | **Class A** | Create job requisition with required skills & rubrics | Bearer JWT (`recruiter`, `admin`) | `JobPostingCreate` | `StandardResponse` (`JobPostingResponse`) |
| `GET` | `/api/v1/jobs` | **Class A** | Public job search, filter by dept/level/keyword, pagination | Public | Query params (`keyword`, `department`, `skip`, `limit`, etc.) | `StandardResponse` (`{"jobs": [...], "total": N}`) |
| `GET` | `/api/v1/jobs/{job_id}` | **Class A** | Retrieve complete job details & screening questions | Public | Path param `job_id` | `StandardResponse` (`JobPostingResponse`) |
| `PUT` | `/api/v1/jobs/{job_id}` | **Class A** | Update job details (Ownership verified: recruiter or admin) | Bearer JWT (`recruiter`, `admin`) | `JobPostingUpdate` | `StandardResponse` (`JobPostingResponse`) |
| `POST` | `/api/v1/jobs/{job_id}/apply`| **Class A** | Candidate applies to job with resume ID & screening answers | Bearer JWT (`candidate`, `admin`) | `JobApplicationCreate` | `StandardResponse` (`JobApplicationResponse`) |
| `GET` | `/api/v1/jobs/{job_id}/applications` | **Class A** | Recruiter views applicants pre-sorted by match score | Bearer JWT (`recruiter`, `admin` - Ownership verified) | Path `job_id`, Query `status` | `StandardResponse` (`List[JobApplicationResponse]`) |
| `GET` | `/api/v1/applications/me`| **Class A** | Candidate retrieves their submitted applications | Bearer JWT (`candidate`, `admin`) | None | `StandardResponse` (`List[JobApplicationResponse]`) |
| `PATCH` | `/api/v1/applications/{application_id}/evaluation` | **Class F** | Internal agent endpoint: updates match_score & critique | Currently Unauthenticated (Cluster network assumed) | `ApplicationEvaluationUpdate` | `StandardResponse` (`JobApplicationResponse`) |
| `GET` | `/health/live` | **Class D** | Kubernetes liveness probe | None | None | `{"status": "alive"}` |
| `GET` | `/health/ready` | **Class D** | Kubernetes readiness probe (MongoDB ping) | None | None | `{"status": "ready", ...}` |

---

### 2.3. `calyx-resume-service` (Base Ingress Route: `/api/v1/resumes`)

| Method | Endpoint | Classification | Description & Role | Auth Requirement | Request Schema | Response Schema |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/resumes/upload` | **Class A** | Multipart upload (PDF/DOCX/TXT) -> Extraction -> 384-dim embedding -> Vector indexing | Bearer JWT (`candidate`, `admin`) | Multipart Form `file` (Max: 10MB) | `StandardResponse` (`ParsedResumeResponse`) |
| `POST` | `/api/v1/resumes/upload-text` | **Class A** | Ingest raw text/markdown resume directly | Bearer JWT (`candidate`, `admin`) | `ResumeUploadTextRequest` | `StandardResponse` (`ParsedResumeResponse`) |
| `GET` | `/api/v1/resumes/{resume_id}`| **Class A** | Retrieve extracted structured entities for a resume ID | Public / Authenticated | Path param `resume_id` | `StandardResponse` (`ParsedResumeResponse`) |
| `GET` | `/api/v1/resumes/candidate/me` | **Class A** | Candidate retrieves list of all their uploaded resumes | Bearer JWT (`candidate`, `admin`) | None | `StandardResponse` (`List[ParsedResumeResponse]`) |
| `POST` | `/api/v1/resumes/search` | **Class A** | Recruiter semantic vector search: computes cosine similarity | Bearer JWT (`recruiter`, `admin`) | `ResumeSearchRequest` | `StandardResponse` (`ResumeSearchResponse`) |
| `GET` | `/health/live` | **Class D** | Kubernetes liveness probe | None | None | `{"status": "alive"}` |
| `GET` | `/health/ready` | **Class D** | Kubernetes readiness probe (Vector store count) | None | None | `{"status": "ready", ...}` |

---

### 2.4. `calyx-agent-service` (Base Ingress Route: `/api/v1/agents`)

| Method | Endpoint | Classification | Description & Role | Auth Requirement | Request Schema | Response Schema |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/agents/evaluate` | **Class B** | Dispatches 4-Agent Mesh: Normalization -> Criteria -> Bias Audit -> Interview Synthesis | Open / Authenticated | `EvaluationRequest` | `StandardResponse` (`EvaluationResponse`) |
| `GET` | `/api/v1/agents/tasks/{task_id}` | **Class A** | Retrieves evaluation state from Redis by task ID | Open / Authenticated | Path param `task_id` | `StandardResponse` (`Dict[str, Any]`) |
| `GET` | `/api/v1/agents/tasks/{task_id}/trace` | **Class A** | Retrieves full Explainable AI (XAI) step-by-step reasoning steps | Open / Authenticated | Path param `task_id` | `StandardResponse` (`AgentTraceResponse`) |
| `GET` | `/health/live` | **Class D** | Kubernetes liveness probe | None | None | `{"status": "alive"}` |
| `GET` | `/health/ready` | **Class D** | Kubernetes readiness probe (Redis ping) | None | None | `{"status": "ready", ...}` |

---

### 2.5. `calyx-analytics-service` (Base Ingress Route: `/api/v1/analytics`)

| Method | Endpoint | Classification | Description & Role | Auth Requirement | Request Schema | Response Schema |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/analytics/events` | **Class D** | Ingest asynchronous pipeline events (e.g. APPLICATION_SUBMITTED) | None / Service-to-Service | `PipelineEventCreate` | `StandardResponse` (`PipelineEventResponse`) |
| `GET` | `/api/v1/analytics/dashboard` | **Class A** | Global recruitment metrics, conversion funnels, activity feed | Open / Authenticated | None | `StandardResponse` (`DashboardOverviewResponse`) |
| `GET` | `/api/v1/analytics/jobs/{job_id}/distribution` | **Class A** | Score histogram distribution (Top Tier, Strong, Average, Below 50) | Open / Authenticated | Path param `job_id` | `StandardResponse` (`JobDistributionResponse`) |
| `GET` | `/health/live` | **Class D** | Kubernetes liveness probe | None | None | `{"status": "alive"}` |
| `GET` | `/health/ready` | **Class D** | Kubernetes readiness probe (PostgreSQL ping) | None | None | `{"status": "ready", ...}` |

---

## 3. Detailed Request & Response Schemas

### 3.1. Standard Response Envelope (Common to all microservices)
Every successful HTTP response (status 200, 201) returns:
```json
{
  "success": true,
  "message": "Descriptive human-readable confirmation",
  "data": { ... },
  "timestamp": "2026-11-24T10:00:00.000000+00:00"
}
```

Every error HTTP response (status >= 400) returns:
```json
{
  "success": false,
  "error": {
    "code": "HTTP_404",
    "message": "Resource not found explanation",
    "details": null
  },
  "timestamp": "2026-11-24T10:00:00.000000+00:00"
}
```

### 3.2. Authentication Contracts
#### `POST /api/v1/auth/register`
* **Request**:
  ```json
  {
    "email": "candidate@calyx.ai",
    "password": "SecurePassword123!",
    "full_name": "Ada Lovelace",
    "role": "candidate" // "candidate", "recruiter", or "admin"
  }
  ```
* **Validation**:
  * Email must be a valid RFC 5322 address.
  * Password must be 8–128 characters and contain at least one numeric digit and one alphabet character.
  * Role defaults to `candidate`.

#### `POST /api/v1/auth/login`
* **Request**:
  ```json
  {
    "email": "candidate@calyx.ai",
    "password": "SecurePassword123!"
  }
  ```
* **Response Data**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "Bearer",
    "expires_in_seconds": 1800,
    "user": {
      "id": 1,
      "email": "candidate@calyx.ai",
      "full_name": "Ada Lovelace",
      "role": "candidate",
      "is_active": true,
      "created_at": "2026-11-24T10:00:00"
    }
  }
  ```

---

### 3.3. Job & Requisition Contracts
#### `POST /api/v1/jobs`
* **Request**:
  ```json
  {
    "title": "Principal Distributed Systems Engineer",
    "department": "Infrastructure",
    "location": "Remote",
    "employment_type": "full_time",
    "experience_level": "senior",
    "min_years_exp": 5,
    "salary_min": 180000,
    "salary_max": 240000,
    "salary_currency": "USD",
    "description": "Architect high-throughput Kubernetes microservices and vector indices...",
    "required_skills": [
      { "name": "Kubernetes", "weight": 1.0, "required": true },
      { "name": "Python", "weight": 0.8, "required": true },
      { "name": "FastAPI", "weight": 0.7, "required": true }
    ],
    "nice_to_have_skills": ["Rust", "Redis Streams", "Qdrant"],
    "rubric_criteria": [
      { "category": "Distributed Systems", "weight": 0.4, "description": "Hands-on microservices & consensus" },
      { "category": "Container Orchestration", "weight": 0.4, "description": "Kubernetes HPA, PDBs & Ingress" },
      { "category": "System Architecture", "weight": 0.2, "description": "Database-per-service & DDD" }
    ],
    "screening_questions": [
      { "question_id": "q1", "question_text": "How do you handle zero-downtime rolling updates in K8s?", "required": true }
    ]
  }
  ```

#### `POST /api/v1/jobs/{job_id}/apply`
* **Request**:
  ```json
  {
    "job_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "resume_id": "res_a1b2c3d4e5f6",
    "answers": [
      { "question_id": "q1", "answer_text": "Configure preStop sleep hooks and Readiness probes..." }
    ]
  }
  ```

---

### 3.4. Resume Intelligence & Vector Search Contracts
#### `POST /api/v1/resumes/search`
* **Request**:
  ```json
  {
    "job_description": "We are seeking a senior Kubernetes engineer with deep Docker, Go, and Python experience to manage autoscaling clusters.",
    "required_skills": ["Kubernetes", "Docker", "Python"],
    "min_experience_years": 3,
    "top_k": 5
  }
  ```
* **Response Data**:
  ```json
  {
    "total_candidates_indexed": 42,
    "top_matches": [
      {
        "resume_id": "res_12345",
        "candidate_id": 2,
        "candidate_name": "Linus Torvalds",
        "email": "linus@kernel.org",
        "match_score": 92.4,
        "semantic_similarity": 0.892,
        "matched_skills": ["Kubernetes", "Docker", "Python"],
        "missing_skills": [],
        "total_skills": ["Kubernetes", "Docker", "Python", "Linux", "C"],
        "experience_years": 8,
        "education": ["M.S. Computer Science"]
      }
    ]
  }
  ```

---

### 3.5. Multi-Agent Evaluation & XAI Trace Contracts
#### `POST /api/v1/agents/evaluate`
* **Request**:
  ```json
  {
    "application_id": "app_98765",
    "candidate_profile": {
      "candidate_id": 2,
      "candidate_name": "Linus Torvalds",
      "skills": ["Kubernetes", "Docker", "Python"],
      "experience_years": 8,
      "raw_text_preview": "Senior systems engineer with 8 years building cloud infrastructure..."
    },
    "job_requirements": {
      "title": "Principal Distributed Systems Engineer",
      "min_years_exp": 5,
      "required_skills": [
        { "name": "Kubernetes", "weight": 1.0 },
        { "name": "Python", "weight": 0.8 }
      ],
      "rubric_criteria": [
        { "category": "Container Orchestration", "weight": 0.5, "description": "HPA & K8s" },
        { "category": "Language Proficiency", "weight": 0.5, "description": "Python / FastAPI" }
      ]
    }
  }
  ```
* **Response Data** (`EvaluationResponse`):
  ```json
  {
    "task_id": "task_abc123def456",
    "application_id": "app_98765",
    "candidate_id": 2,
    "status": "COMPLETED",
    "final_score": 91.5,
    "detected_specialty": "Cloud & Infrastructure Engineer",
    "fairness_audit": {
      "audit_passed": true,
      "certificate_id": "AUDIT-E2903FBA",
      "demographic_penalty_applied": false,
      "masked_signals_count": 0,
      "audit_note": "Score 100% verified on technical criteria."
    },
    "rubric_breakdown": [
      {
        "category": "Container Orchestration",
        "weight": 0.5,
        "score": 95.0,
        "weighted_score": 47.5,
        "justification": "Candidate has 8 years vs 5 min, matches Kubernetes skill."
      }
    ],
    "interview_questionnaire": [
      {
        "question_id": "tech_q1",
        "focus_area": "Kubernetes Autoscaling & Rolling Updates",
        "question_prompt": "When configuring Horizontal Pod Autoscaling (HPA) in production, how do you prevent flapping?",
        "rationale": "Candidate claims production Kubernetes experience; verifying hands-on HPA tuning expertise.",
        "ideal_response_key": "Candidate should mention scaleDown stabilizationWindowSeconds (e.g. 300s)...",
        "follow_up_probe": "What custom Prometheus metrics would you expose for HPA?"
      }
    ],
    "executive_summary": "Multi-Agent Evaluation Consensus: Candidate classified as 'Cloud & Infrastructure Engineer' with a composite rubric score of 91.5%. Fairness Audit: PASSED.",
    "completed_at": "2026-11-24T10:05:00.000000+00:00"
  }
  ```

#### `GET /api/v1/agents/tasks/{task_id}/trace`
* **Response Data** (`AgentTraceResponse`):
  ```json
  {
    "task_id": "task_abc123def456",
    "steps": [
      {
        "agent": "Extraction & Normalization Agent",
        "timestamp": "2026-11-24T10:04:58.120Z",
        "thought": "Standardizing technical terminology and mapping synonyms to canonical skills.",
        "action": "NORMALIZE_SKILLS_AND_SPECIALTY",
        "output": { "normalized_skills": ["Kubernetes", "Docker", "Python"], "detected_specialty": "Cloud Infrastructure" }
      },
      {
        "agent": "Criteria & Rubric Matching Agent",
        "timestamp": "2026-11-24T10:04:58.650Z",
        "thought": "Comparing candidate skills against weighted job requirements and calculating the match score.",
        "action": "SCORE_RUBRICS",
        "output": { "overall_match_score": 91.5 }
      },
      {
        "agent": "Fairness & Bias Audit Agent",
        "timestamp": "2026-11-24T10:04:59.010Z",
        "thought": "Checking the evaluation for demographic signals and potential fairness concerns.",
        "action": "AUDIT_FAIRNESS",
        "output": { "audit_passed": true, "certificate_id": "AUDIT-E2903FBA" }
      },
      {
        "agent": "Dynamic Technical Interview Synthesizer Agent",
        "timestamp": "2026-11-24T10:04:59.480Z",
        "thought": "Generating technical interview questions based on the candidate's skills and evaluation results.",
        "action": "GENERATE_INTERVIEW_QUESTIONS",
        "output": { "total_questions_synthesized": 3 }
      }
    ]
  }
  ```

---

## 4. Frontend Integration Requirements & Path Mapping

| Frontend View / Feature | Required Endpoints | Flow & Data Contract |
| :--- | :--- | :--- |
| **Authentication & Session** | `POST /api/v1/auth/login`<br>`POST /api/v1/auth/register`<br>`POST /api/v1/auth/refresh`<br>`GET /api/v1/auth/me` | Stores JWT access token in memory/secure state, refresh token in local storage; checks role (`candidate` vs `recruiter`). |
| **Job Discovery & Search (Candidate)** | `GET /api/v1/jobs`<br>`GET /api/v1/jobs/{job_id}` | Paginated list with department and experience filters; detail view displays required skills and screening questions. |
| **Resume Upload & Parsing (Candidate)** | `POST /api/v1/resumes/upload`<br>`POST /api/v1/resumes/upload-text`<br>`GET /api/v1/resumes/candidate/me` | Drag-and-drop file upload with progress bar, entity tag pills, and word count statistics. |
| **Apply to Job (Candidate)** | `POST /api/v1/jobs/{job_id}/apply`<br>`GET /api/v1/applications/me` | Select parsed resume from dropdown, fill in custom screening questions, view status badge (Submitted, Screening, Evaluated). |
| **Requisition Manager (Recruiter)** | `POST /api/v1/jobs`<br>`PUT /api/v1/jobs/{job_id}`<br>`GET /api/v1/jobs` | Dynamic form builder to define required skills with weights (0.1–1.0) and custom rubric categories. |
| **Applicant Pipeline & Ranking (Recruiter)**| `GET /api/v1/jobs/{job_id}/applications` | Real-time ranked table sorted by `match_score` descending; displays candidate match badges and evaluation trigger. |
| **Candidate Semantic Vector Search (Recruiter)** | `POST /api/v1/resumes/search` | Input job description or query text; displays ranked candidate cards with cosine similarity % and skill breakdown. |
| **AI Evaluation & XAI Reasoning Trace** | `POST /api/v1/agents/evaluate`<br>`GET /api/v1/agents/tasks/{task_id}/trace` | Interactive multi-step timeline showing thoughts and actions for each of the 4 autonomous agents. |
| **Technical Interview Questionnaire** | Output from `POST /api/v1/agents/evaluate` or `GET /api/v1/agents/tasks/{task_id}` | Expandable accordion cards displaying question prompt, rationale, ideal answer key, and follow-up probe. |
| **Fairness & Bias Audit Certificate** | Output from `fairness_audit` block in evaluation | Cryptographic certificate badge (`AUDIT-XXXX`), verification timestamp, and demographic scrubbing confirmation. |
| **Executive Analytics & Metrics** | `GET /api/v1/analytics/dashboard`<br>`GET /api/v1/analytics/jobs/{job_id}/distribution` | Interactive charts showing pipeline conversion funnel, total volume, average scores, and score distribution histogram. |

---

## 5. Security & Architectural Findings (Phase 1 Audit)

1. **Class F Remediation**: `PATCH /api/v1/applications/{application_id}/evaluation` in `calyx-job-service` lacks Bearer token validation. While intended for internal agent calls, it is routed through the Ingress path `/api/v1/applications`. In Phase 2, this must be protected so only authorized workers/agents can invoke it.
2. **Class B Remediation**: `POST /api/v1/agents/evaluate` does not enforce `get_current_user` dependency in `calyx-agent-service/main.py`. Any caller can currently trigger evaluations. In Phase 2, we will add recruiter/admin verification.
3. **Response Uniformity**: All endpoints across all 5 services strictly conform to the `StandardResponse` and `StandardErrorResponse` envelope, providing seamless client integration.

---

## 6. Conclusion

Phase 1 API & Functionality Audit is complete. The full inventory of endpoints, schemas, validation rules, and frontend integration paths is documented. We are ready to proceed to **Phase 2: Security and Architecture Review**.
