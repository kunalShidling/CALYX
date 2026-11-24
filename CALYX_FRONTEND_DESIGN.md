# CALYX: Frontend Architecture & Product Design Specification
**Document Version**: 1.0.0  
**Phase**: Phase 3 — Frontend Architecture and Product Design  
**Author**: Principal Frontend Engineer & Product Designer  
**Date**: November 2026  

---

## 1. Design Direction & Product Philosophy

CALYX is an enterprise-grade talent intelligence and autonomous multi-agent recruitment platform. The web application is designed to feel like a high-performance mission control center for engineering hiring—clean, authoritative, dense with high-signal data, and free of superficial gimmicks.

### Core Visual Principles
1. **Purpose-Driven Information Density**: Every pixel conveys actionable information. Complex data (384-dimensional vector matches, multi-agent consensus loops, weighted scoring rubrics) is presented with visual clarity and structured hierarchy.
2. **Enterprise Color Palette & Design Tokens**:
   - **Backgrounds**: Slate-900 / Slate-950 for deep command views; Slate-50 / White for clean light surfaces; Slate-800 for card borders and elevated layers.
   - **Primary Brand / Accent**: Indigo-600 (`#4F46E5`) and Cyan-500 (`#06B6D4`) representing precision and intelligence.
   - **Semantic Indicators**:
     - *Success / Pass*: Emerald-500 (`#10B981`)
     - *Warning / Flagged*: Amber-500 (`#F59E0B`)
     - *Error / Danger*: Rose-500 (`#F43F5E`)
     - *Agent Reasoning*: Purple-500 (`#8B5CF6`)
     - *Vector Spatial*: Sky-500 (`#0EA5E9`)
3. **Typography**: Clean, neutral geometric sans-serif (Inter system font stack) paired with tabular monospace (`JetBrains Mono` / `Courier`) for hash certificates, token digests, and vector metrics.
4. **Zero Vanity Fluff**: No random floating gradients, excessive box-shadow glows, or meaningless cards. Visual transitions are subtle (150ms–200ms ease-out).

---

## 2. Technology Stack Selection & Technical Justification

* **Core Framework**: **React 18** with **TypeScript 5**
  * *Justification*: Component reusability, type-safe API contracts directly matching backend Pydantic models, and rich ecosystem.
* **Build Tool**: **Vite 5**
  * *Justification*: Sub-second HMR (Hot Module Replacement), fast production bundle optimization with ES modules, and zero-config proxy capabilities.
* **Styling & Design System**: **Tailwind CSS 3.4**
  * *Justification*: Utility-first CSS ensuring strict adherence to consistent spacing, typography scales, and responsive breakpoints without runtime CSS overhead.
* **Iconography**: **Lucide React**
  * *Justification*: Crisp, lightweight, consistent vector icon set matching modern enterprise developer tools.
* **Data Visualizations**: **Recharts** (SVG based, responsive, highly accessible).
* **HTTP Client**: **Axios** with centralized interceptors, automatic JWT injection, and unified error handling.

---

## 3. Information Architecture (IA) & Route Hierarchy

```
/
├── /login                          [Public: Email/Password, role toggle]
├── /register                       [Public: Candidate or Recruiter account creation]
├── /jobs                           [Public / Candidate: Search & filter active openings]
├── /jobs/:jobId                    [Public / Candidate: Detailed description & requirements]
│
├── /candidate                      [Protected: role in ['candidate', 'admin']]
│   ├── /candidate/dashboard        [Overview: Active applications, match status, uploaded resumes]
│   ├── /candidate/resumes          [Resume Ingestion: Upload PDF/DOCX/TXT, view parsed skills & experience]
│   ├── /candidate/applications     [Application Tracker: Submission state, AI screening progress]
│   └── /candidate/apply/:jobId     [Apply Flow: Select resume, answer screening questions]
│
├── /recruiter                      [Protected: role in ['recruiter', 'admin']]
│   ├── /recruiter/dashboard        [Executive Overview: Analytics funnels, average scores, recent activity]
│   ├── /recruiter/jobs             [Job Management: Active, draft, and closed requisitions]
│   ├── /recruiter/jobs/new         [Job Builder: Title, skills weights, rubric categories, questions]
│   ├── /recruiter/jobs/:jobId/pipeline [Applicant Pipeline: Ranked candidate table by match score]
│   ├── /recruiter/search           [Vector Search: 384-dim semantic KNN candidate retrieval]
│   └── /recruiter/evaluate/:applicationId [Agent Evaluation: Multi-agent consensus, XAI traces, interview]
│
└── /profile                        [Protected: User profile and session information]
```

---

## 4. Application Modules & Functional Specifications

### 4.1. Authentication & Role Gatekeeper
* **Dual Persona Architecture**: Clear user segmentation between **Job Candidates** and **Recruiters / Hiring Managers**.
* **Session Persistence**: JWT access token in memory with automatic rotation via long-lived refresh tokens stored securely in `localStorage`.
* **Guarded Routing**: `ProtectedRoute` wrapper inspecting JWT claims; unauthorized role attempts automatically redirect with helpful notifications.

### 4.2. Candidate Portal: Job Discovery & Application Lifecycle
* **Live Job Board**: Instant full-text search across titles and descriptions, filtered by department, experience level, and location.
* **Multi-Format Resume Ingestion**: Drag-and-drop document upload (PDF, DOCX, TXT) with client-side file validation (max 10MB).
* **Instant Text Extraction & Skill Entity Pills**: Displays detected technical competencies (Kubernetes, Python, Docker, etc.), estimated experience years, and degrees.
* **Application Tracker**: Live status tags (`Submitted`, `Screening`, `Agent Evaluated`, `Interviewing`, `Offered`, `Rejected`).

### 4.3. Recruiter Mission Control: Requisition & Rubric Builder
* **Dynamic Rubric Matrix**: Recruiters don't just write text descriptions; they define weighted criteria:
  - Required skills with numeric importance multipliers (0.1 to 1.0).
  - Custom evaluation rubric categories (e.g. *System Architecture: 40%*, *Concurrency: 30%*, *Code Quality: 30%*).
  - Custom candidate screening questions.
* **Applicant Pipeline & Algorithmic Ranking**: Applications are pre-sorted by `match_score` descending, allowing recruiters to instantly identify the top 5% talent.

### 4.4. Candidate Semantic Vector Search (384-Dimensional Space)
* **High-Dimensional ANN Search Interface**: Recruiters input a paragraph of job requirements. The engine computes vector cosine distance and returns ranked candidate profiles with:
  - Overall match percentage.
  - Pure semantic cosine similarity score.
  - Matched vs. missing skill breakdown chips.
  - Verified career history and degrees.

### 4.5. Autonomous Agentic AI Evaluation & Explainable AI (XAI)
* **Interactive 4-Agent Execution Timeline**:
  1. *Normalization Agent*: Visualizes jargon resolution (e.g., `"k8s admin"` mapped to `"Kubernetes Orchestration"`).
  2. *Criteria Matching Agent*: Breaks down weighted scores for each rubric category with explicit justification text.
  3. *Fairness & Bias Audit Agent*: Renders cryptographic `AUDIT-XXXX` certificate card confirming zero demographic bias.
  4. *Technical Interview Agent*: Renders customized questionnaire with focus areas, technical prompts, expected answer keys, and follow-up probes.
* **Full Redis Reasoning Trace Drawer**: Chronological step-by-step stream of agent thoughts and actions for complete auditability.

### 4.6. Executive Recruitment Analytics Dashboard
* **Pipeline Conversion Funnel**: Visual progression from Applications Submitted -> Agent Evaluations -> Interviewing -> Offers.
* **Score Histogram**: Candidate distribution brackets (`Top Tier >=85%`, `Strong 70-84%`, `Average 50-69%`, `Below 50%`).
* **Recent Activity Feed**: Real-time audit log of pipeline events.

---

## 5. Reusable Component Design System

```
frontend/src/
├── components/
│   ├── common/
│   │   ├── Button.tsx             [Primary, secondary, outline, danger, ghost, loading states]
│   │   ├── Input.tsx              [Validated text, email, password, search, textarea]
│   │   ├── Badge.tsx              [Role badges, status badges, score pill tags]
│   │   ├── Card.tsx               [Elevated surface with header, body, footer slots]
│   │   ├── Modal.tsx              [Accessible dialog overlay with Esc / outside click dismiss]
│   │   ├── Tabs.tsx               [Underline and pill style tab switchers]
│   │   ├── Table.tsx              [Sortable, responsive tabular data presentation]
│   │   ├── ProgressBar.tsx        [Smooth score and upload progress indicator]
│   │   ├── Alert.tsx              [Success, warning, error, info alert boxes]
│   │   └── EmptyState.tsx         [Descriptive illustration and action button when lists are empty]
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx          [Responsive shell with sidebar, header, and content viewport]
│   │   ├── Header.tsx             [Brand icon, search bar, role pill, profile avatar, logout]
│   │   └── Sidebar.tsx            [Collapsible navigation with role-aware menu items]
│   │
│   └── domain/
│       ├── AgentTraceViewer.tsx   [Interactive XAI timeline showing agent thought/action/output]
│       ├── FairnessAuditCard.tsx  [Cryptographic certificate badge with audit verification details]
│       ├── InterviewQuestionAccordion.tsx [Question cards with ideal answer keys and probes]
│       ├── VectorMatchCard.tsx    [Candidate match card with cosine similarity and skill tags]
│       ├── JobRubricBuilder.tsx   [Interactive dynamic skill and rubric weight sliders]
│       └── ScoreHistogram.tsx     [Recharts-based distribution bar chart]
```

---

## 6. Centralized API Client Architecture

All network communication flows through a unified Axios client (`src/api/client.ts`):
* **Request Interceptor**: Automatically attaches `Authorization: Bearer <token>` from active auth state.
* **Response Interceptor**:
  - Automatically unwraps the `StandardResponse` envelope (`response.data.data`).
  - Detects `HTTP 401 Unauthorized` and attempts seamless token refresh via `POST /api/v1/auth/refresh`.
  - On refresh failure, clears tokens and redirects to `/login`.
  - Normalizes `StandardErrorResponse` into predictable client error objects with human-readable messages.

---

## 7. Next Steps & Phase 4 Execution Roadmap

With the frontend design and architecture fully specified, we will implement the frontend incrementally in Phase 4:
1. **Foundation**: Initialize Vite + React + TypeScript + Tailwind CSS project in `frontend/`, configure design tokens and router.
2. **API Client & Auth Layer**: Implement centralized API client, auth context, token storage, and protected routes.
3. **Candidate Modules**: Build Job Discovery, Document Uploader, and Application Tracker.
4. **Recruiter Modules**: Build Requisition Builder, Applicant Pipeline, and Vector Search.
5. **Agentic AI Mesh Views**: Build Live Evaluation Runner, XAI Reasoning Trace Drawer, and Interview Questionnaire.
6. **Executive Dashboard**: Build conversion funnels and distribution charts.
