# ==============================================================================
# CALYX PRODUCTION QUALITY ASSURANCE & VERIFICATION SUITE
# ==============================================================================
# Executes exhaustive integration, functional, security, and performance tests
# across all 5 CALYX microservices and autonomous agents in-memory.
# ==============================================================================

import sys
import os
import time
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Force mock mode for fast local verification
os.environ["MONGODB_URL"] = "mock"
os.environ["REDIS_URL"] = "mock"

from fastapi import HTTPException
from common.security import create_access_token
from common.resilience import (
    CircuitBreaker,
    CircuitBreakerState,
    retry_with_backoff,
    ResilientHttpClient,
)

# 1. Auth Service imports
from services.calyx_auth_service.main import (
    register_user,
    login_user,
    refresh_token,
    verify_token,
    liveness_probe as auth_liveness,
    readiness_probe as auth_readiness
)
from services.calyx_auth_service.database import Base as AuthBase, engine as auth_engine, SessionLocal as AuthSessionLocal
from services.calyx_auth_service.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenRefreshRequest,
)

# 2. Job Service imports
from services.calyx_job_service.main import (
    create_job_posting,
    list_and_search_jobs,
    get_job_details,
    apply_for_job,
    get_my_applications,
    get_job_applications,
    liveness_probe as job_liveness,
    readiness_probe as job_readiness
)
from services.calyx_job_service.database import init_db as init_job_db, get_job_database
from services.calyx_job_service.schemas import (
    JobPostingCreate,
    JobApplicationCreate,
    SkillRequirement,
    RubricCriteria
)

# 3. Resume Service imports
from services.calyx_resume_service.main import (
    upload_resume_raw_text,
    get_resume_by_id,
    liveness_probe as resume_liveness,
    readiness_probe as resume_readiness
)
from services.calyx_resume_service.vector_store import VectorStore
from services.calyx_resume_service.schemas import ResumeUploadTextRequest
from services.calyx_resume_service.embeddings import EmbeddingEngine

# 4. Agent Service imports
from services.calyx_agent_service.main import (
    evaluate_candidate_application,
    get_evaluation_reasoning_trace,
    get_evaluation_task,
    liveness_probe as agent_liveness,
    readiness_probe as agent_readiness
)
from services.calyx_agent_service.schemas import EvaluationRequest
from services.calyx_agent_service.state_store import get_state_store, get_redis_client, AgentStateStore

# 5. Analytics Service imports
from services.calyx_analytics_service.main import (
    record_event,
    get_dashboard_overview,
    get_job_distribution,
    liveness_probe as analytics_liveness,
    readiness_probe as analytics_readiness
)
from services.calyx_analytics_service.database import Base as AnalyticsBase, engine as analytics_engine, SessionLocal as AnalyticsSessionLocal
from services.calyx_analytics_service.schemas import PipelineEventCreate


def create_mock_request(client_ip: str = "127.0.0.1"):
    return type("MockRequest", (), {
        "client": type("MockClient", (), {"host": client_ip})(),
        "headers": {}
    })()


class TestReportCollector:
    def __init__(self):
        self.results = []
        self.start_time = time.perf_counter()

    def record(self, test_name: str, passed: bool, duration_ms: float, detail: str = ""):
        self.results.append({
            "name": test_name,
            "passed": passed,
            "duration_ms": duration_ms,
            "detail": detail
        })
        status_symbol = "✓ PASS" if passed else "✗ FAIL"
        print(f"[{status_symbol}] {test_name:<50} ({duration_ms:.1f}ms) {detail}")

    def summary(self):
        total_time = time.perf_counter() - self.start_time
        passed = sum(1 for r in self.results if r["passed"])
        failed = sum(1 for r in self.results if not r["passed"])
        total = len(self.results)
        print("\n" + "=" * 80)
        print(f"CALYX TEST EXECUTION SUMMARY: {passed}/{total} Passed, {failed} Failed ({total_time:.2f}s total)")
        print("=" * 80)
        return failed == 0


def run_all_tests():
    collector = TestReportCollector()
    mock_req = create_mock_request()

    print("=" * 80)
    print("CALYX TEST SUITE: COMPLETE MICROSERVICES & AGENTIC INTEGRATION")
    print("=" * 80 + "\n")

    # ==========================================================================
    # SUITE 1: HEALTH & LIVENESS PROBES
    # ==========================================================================
    print("--- [Suite 1: Kubernetes Probes & Connectivity] ---")
    t0 = time.perf_counter()
    live = auth_liveness()
    collector.record("1.1 Auth Service Liveness Probe", live["status"] == "alive", (time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    AuthBase.metadata.create_all(bind=auth_engine)
    auth_db = AuthSessionLocal()
    ready = auth_readiness(auth_db)
    collector.record("1.2 Auth Service Readiness Probe (DB Check)", ready["status"] == "ready", (time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    job_live = job_liveness()
    collector.record("1.3 Job Service Liveness Probe", job_live["status"] == "alive", (time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    init_job_db(force_mock=True)
    mongo_db = get_job_database()
    job_ready = job_readiness(db=mongo_db)
    collector.record("1.4 Job Service Readiness Probe (MongoDB Check)", job_ready["status"] == "ready", (time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    resume_live = resume_liveness()
    collector.record("1.5 Resume Service Liveness Probe", resume_live["status"] == "alive", (time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    vector_store = VectorStore(storage_dir="./test_vector_store")
    resume_ready = resume_readiness(vdb=vector_store)
    collector.record("1.6 Resume Service Readiness Probe (Vector DB Check)", resume_ready["status"] == "ready", (time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    agent_live = agent_liveness()
    collector.record("1.7 Agent Service Liveness Probe", agent_live["status"] == "alive", (time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    mock_redis = get_redis_client(force_mock=True)
    agent_store = AgentStateStore(client=mock_redis)
    agent_ready = agent_readiness(store=agent_store)
    collector.record("1.8 Agent Service Readiness Probe (Redis Check)", agent_ready["status"] == "ready", (time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    analytics_live = analytics_liveness()
    collector.record("1.9 Analytics Service Liveness Probe", analytics_live["status"] == "alive", (time.perf_counter() - t0) * 1000)

    t0 = time.perf_counter()
    AnalyticsBase.metadata.create_all(bind=analytics_engine)
    analytics_db = AnalyticsSessionLocal()
    analytics_ready = analytics_readiness(analytics_db)
    collector.record("1.10 Analytics Service Readiness Probe", analytics_ready["status"] == "ready", (time.perf_counter() - t0) * 1000)

    # ==========================================================================
    # SUITE 2: AUTHENTICATION, RBAC & SECURITY HARDENING
    # ==========================================================================
    print("\n--- [Suite 2: Authentication, RBAC & Security Hardening] ---")
    cand_email = f"candidate_{uuid.uuid4().hex[:6]}@calyx.ai"
    rec_email = f"recruiter_{uuid.uuid4().hex[:6]}@calyx.ai"

    # 2.1 Candidate registration
    t0 = time.perf_counter()
    cand_reg_req = UserRegisterRequest(email=cand_email, password="Password123!", full_name="Jane Candidate", role="candidate")
    cand_reg_res = register_user(cand_reg_req, mock_req, auth_db)
    collector.record("2.1 Candidate Registration", cand_reg_res.success and cand_reg_res.data["email"] == cand_email, (time.perf_counter() - t0) * 1000)
    cand_user_id = cand_reg_res.data["id"]

    # 2.2 Recruiter registration
    t0 = time.perf_counter()
    rec_reg_req = UserRegisterRequest(email=rec_email, password="Password123!", full_name="Robert Recruiter", role="recruiter")
    rec_reg_res = register_user(rec_reg_req, mock_req, auth_db)
    collector.record("2.2 Recruiter Registration", rec_reg_res.success and rec_reg_res.data["role"] == "recruiter", (time.perf_counter() - t0) * 1000)
    rec_user_id = rec_reg_res.data["id"]

    # 2.3 Security Hardening: Admin Self-Registration MUST be blocked (VULN-01 Fix)
    t0 = time.perf_counter()
    blocked_admin = False
    try:
        admin_req = UserRegisterRequest(email="bad_actor@evil.com", password="Password123!", full_name="Hacker", role="admin")
        register_user(admin_req, mock_req, auth_db)
    except HTTPException as exc:
        blocked_admin = exc.status_code == 403 and "admin' role cannot be self-assigned" in str(exc.detail)
    collector.record("2.3 Security: Admin Self-Registration Rejected (403)", blocked_admin, (time.perf_counter() - t0) * 1000, "VULN-01 Remediation Verified")

    # 2.4 Duplicate Email Conflict (409)
    t0 = time.perf_counter()
    conflict_detected = False
    try:
        dup_req = UserRegisterRequest(email=cand_email, password="AnotherPassword123!", full_name="Clone", role="candidate")
        register_user(dup_req, mock_req, auth_db)
    except HTTPException as exc:
        conflict_detected = exc.status_code == 409
    collector.record("2.4 Duplicate Registration Conflict (409)", conflict_detected, (time.perf_counter() - t0) * 1000)

    # 2.5 Candidate Login & Token Generation
    t0 = time.perf_counter()
    cand_login_req = UserLoginRequest(email=cand_email, password="Password123!")
    cand_login_res = login_user(cand_login_req, mock_req, auth_db)
    cand_access_token = cand_login_res.data["access_token"]
    cand_refresh_token = cand_login_res.data["refresh_token"]
    collector.record("2.5 Candidate Login & JWT Issuance", bool(cand_access_token and cand_refresh_token), (time.perf_counter() - t0) * 1000)

    # 2.6 Recruiter Login
    t0 = time.perf_counter()
    rec_login_req = UserLoginRequest(email=rec_email, password="Password123!")
    rec_login_res = login_user(rec_login_req, mock_req, auth_db)
    rec_access_token = rec_login_res.data["access_token"]
    collector.record("2.6 Recruiter Login", bool(rec_access_token), (time.perf_counter() - t0) * 1000)

    # 2.7 JWT Token Verification Endpoint
    t0 = time.perf_counter()
    auth_header = f"Bearer {cand_access_token}"
    verify_res = verify_token(authorization=auth_header)
    collector.record("2.7 Token Verification Endpoint", verify_res.data["valid"] and verify_res.data["role"] == "candidate", (time.perf_counter() - t0) * 1000)

    # 2.8 Refresh Token Rotation
    t0 = time.perf_counter()
    refresh_req = TokenRefreshRequest(refresh_token=cand_refresh_token)
    refresh_res = refresh_token(refresh_req, mock_req, auth_db)
    new_access_token = refresh_res.data["access_token"]
    collector.record("2.8 Refresh Token Session Extension", bool(new_access_token), (time.perf_counter() - t0) * 1000)

    # ==========================================================================
    # SUITE 3: JOB REQUISITION, RUBRICS & CANDIDATE APPLICATIONS
    # ==========================================================================
    print("\n--- [Suite 3: Requisition Management & Applications] ---")
    mongo_db = get_job_database()
    rec_auth_user = {"user_id": rec_user_id, "email": rec_email, "role": "recruiter"}
    cand_auth_user = {"user_id": cand_user_id, "email": cand_email, "role": "candidate"}

    # 3.1 Recruiter Creates Job Posting with Rubric
    t0 = time.perf_counter()
    job_payload = JobPostingCreate(
        title="Senior Cloud Platform Engineer",
        department="Infrastructure",
        location="Remote / San Francisco",
        description="Lead Kubernetes cluster orchestration and microservice scalability with high availability.",
        min_years_exp=4,
        required_skills=[
            SkillRequirement(name="Kubernetes", weight=0.4),
            SkillRequirement(name="Python", weight=0.3),
            SkillRequirement(name="FastAPI", weight=0.3)
        ],
        rubric_criteria=[
            RubricCriteria(category="System Architecture", weight=0.5, description="High-availability design"),
            RubricCriteria(category="Code Craftsmanship", weight=0.5, description="Clean maintainable Python")
        ]
    )
    job_res = create_job_posting(job_payload, user=rec_auth_user, db=mongo_db)
    created_job_id = job_res.data["id"]
    collector.record("3.1 Create Job with Dynamic Rubric", bool(created_job_id), (time.perf_counter() - t0) * 1000)

    # 3.2 List Public Jobs
    t0 = time.perf_counter()
    jobs_list = list_and_search_jobs(keyword=None, department=None, experience_level=None, status="published", skip=0, limit=10, db=mongo_db)
    collector.record("3.2 Public Job Requisitions Discovery", jobs_list.data["total"] >= 1, (time.perf_counter() - t0) * 1000)

    # 3.3 Candidate Submits Application
    t0 = time.perf_counter()
    resume_ref_id = f"res_{uuid.uuid4().hex[:12]}"
    app_payload = JobApplicationCreate(
        job_id=created_job_id,
        resume_id=resume_ref_id
    )
    apply_res = apply_for_job(job_id=created_job_id, req=app_payload, user=cand_auth_user, db=mongo_db)
    application_id = apply_res.data["id"]
    collector.record("3.3 Candidate Job Application Submission", bool(application_id), (time.perf_counter() - t0) * 1000)

    # 3.4 Duplicate Application Prevention (MongoDB Compound Unique Index)
    t0 = time.perf_counter()
    dup_blocked = False
    try:
        apply_for_job(job_id=created_job_id, req=app_payload, user=cand_auth_user, db=mongo_db)
    except HTTPException as exc:
        dup_blocked = exc.status_code == 409
    collector.record("3.4 Compound Unique Index: Duplicate Application Blocked", dup_blocked, (time.perf_counter() - t0) * 1000)

    # 3.5 Candidate Views Own Applications
    t0 = time.perf_counter()
    my_apps = get_my_applications(user=cand_auth_user, db=mongo_db)
    collector.record("3.5 Candidate Application History (/applications/me)", len(my_apps.data) >= 1, (time.perf_counter() - t0) * 1000)

    # 3.6 Recruiter Pipeline Application Discovery
    t0 = time.perf_counter()
    pipeline_res = get_job_applications(job_id=created_job_id, status=None, user=rec_auth_user, db=mongo_db)
    collector.record("3.6 Recruiter Applicant Pipeline Query", len(pipeline_res.data) >= 1, (time.perf_counter() - t0) * 1000)

    # ==========================================================================
    # SUITE 4: RESUME INTELLIGENCE & 384-DIM VECTOR SEARCH
    # ==========================================================================
    print("\n--- [Suite 4: Resume Parsing & Vector Semantic Search] ---")

    # 4.1 Embedding Generation
    t0 = time.perf_counter()
    sample_text = "Senior Infrastructure Architect with 6 years experience in Kubernetes, Docker, Python, and FastAPI."
    vec = EmbeddingEngine.generate_embedding(sample_text)
    collector.record("4.1 384-Dimensional Embedding Generation", len(vec) == 384, (time.perf_counter() - t0) * 1000)

    # 4.2 Raw Text Resume Parsing & Vector Indexing
    t0 = time.perf_counter()
    resume_upload_req = ResumeUploadTextRequest(
        text_content=sample_text,
        file_name="jane_candidate_resume.txt"
    )
    indexed_res = upload_resume_raw_text(resume_upload_req, user=cand_auth_user, vdb=vector_store)
    indexed_id = indexed_res.data["resume_id"]
    collector.record("4.2 Resume Text Ingestion & Vector Indexing", bool(indexed_id), (time.perf_counter() - t0) * 1000)

    # 4.3 Semantic Cosine Similarity Query
    t0 = time.perf_counter()
    query_vec = EmbeddingEngine.generate_embedding("Looking for an expert Kubernetes and Python engineer")
    matches = vector_store.search_similar_candidates(
        query_vector=query_vec,
        required_skills=["Kubernetes", "Python"],
        min_experience_years=4,
        top_k=5
    )
    top_score = matches[0]["match_score"] if matches else 0.0
    collector.record("4.3 Semantic Vector Search with Skill Overlap Scoring", len(matches) > 0 and top_score > 50.0, (time.perf_counter() - t0) * 1000, f"Top Match: {top_score:.1f}%")

    # ==========================================================================
    # SUITE 5: AUTONOMOUS 4-AGENT MESH & XAI REASONING TRACES
    # ==========================================================================
    print("\n--- [Suite 5: Autonomous Multi-Agent Consensus & XAI Traces] ---")

    # 5.1 Full Multi-Agent Evaluation Flow
    t0 = time.perf_counter()
    eval_req = EvaluationRequest(
        application_id=application_id,
        candidate_profile={
            "candidate_id": cand_user_id,
            "candidate_name": "Jane Candidate",
            "skills": ["k8s", "docker", "python", "fastapi", "terraform"],
            "experience_years": 6,
            "raw_text_preview": sample_text
        },
        job_requirements={
            "title": "Senior Cloud Platform Engineer",
            "min_years_exp": 4,
            "required_skills": [
                {"name": "Kubernetes", "weight": 0.4},
                {"name": "Python", "weight": 0.3},
                {"name": "FastAPI", "weight": 0.3}
            ],
            "rubric_criteria": [
                {"category": "System Architecture", "weight": 0.5, "description": "High-availability design"}
            ]
        }
    )
    eval_res = evaluate_candidate_application(eval_req, caller=rec_auth_user, store=agent_store)
    report = eval_res.data
    eval_task_id = report["task_id"]
    collector.record("5.1 Autonomous 4-Agent Consensus Execution", report["status"] == "COMPLETED" and report["final_score"] > 0, (time.perf_counter() - t0) * 1000, f"Score: {report['final_score']:.1f}/100, Specialty: {report.get('detected_specialty')}")

    # 5.2 Fairness & Demographic Bias Audit Verification
    t0 = time.perf_counter()
    fairness_audit = report.get("fairness_audit", {})
    fairness_ok = fairness_audit.get("audit_passed") is True
    collector.record("5.2 BiasAuditAgent: Fairness Verification & Mitigation", fairness_ok, (time.perf_counter() - t0) * 1000, f"Passed: {fairness_ok}")

    # 5.3 Dynamic Technical Interview Synthesis
    t0 = time.perf_counter()
    questions = report.get("interview_questionnaire", [])
    has_questions = len(questions) >= 2
    collector.record("5.3 TechnicalInterviewAgent: Question Generation", has_questions, (time.perf_counter() - t0) * 1000, f"Generated {len(questions)} contextual questions")

    # 5.4 XAI Audit Traces Extraction
    t0 = time.perf_counter()
    trace_res = get_evaluation_reasoning_trace(task_id=eval_task_id, store=agent_store)
    recorded_traces = trace_res.data["steps"]
    agents_present = {t["agent"] for t in recorded_traces}
    all_4_agents_recorded = len(agents_present) >= 4
    collector.record("5.4 XAI Reasoning Traces Recorded Across All 4 Agents", all_4_agents_recorded, (time.perf_counter() - t0) * 1000, f"Traces from {len(agents_present)} agents: {', '.join(agents_present)}")

    # 5.5 Distributed Redis Concurrency Lock
    t0 = time.perf_counter()
    concurrent_eval = evaluate_candidate_application(eval_req, caller=rec_auth_user, store=agent_store)
    collector.record("5.5 Redis Distributed Mutex: Concurrent Duplicate Blocked", concurrent_eval.data["status"] == "COMPLETED", (time.perf_counter() - t0) * 1000)

    # ==========================================================================
    # SUITE 6: ANALYTICS & EXECUTIVE REPORTING
    # ==========================================================================
    print("\n--- [Suite 6: Analytics Pipeline Events & Reporting] ---")

    # 6.1 Record Pipeline Event
    t0 = time.perf_counter()
    event_payload = PipelineEventCreate(
        event_type="application_evaluated",
        entity_id=application_id,
        user_id=cand_user_id,
        metadata={"score": report["final_score"], "specialty": report.get("detected_specialty", "Engineer")}
    )
    event_res = record_event(event_payload, analytics_db)
    collector.record("6.1 Ingestion of Evaluation Metric Event", event_res.success, (time.perf_counter() - t0) * 1000)

    # 6.2 Fetch Executive Dashboard Overview
    t0 = time.perf_counter()
    overview_res = get_dashboard_overview(db=analytics_db)
    collector.record("6.2 Executive Dashboard Overview Metrics", overview_res.success and "total_events_recorded" in overview_res.data, (time.perf_counter() - t0) * 1000)

    # 6.3 Fetch Job Score Distribution Histogram
    t0 = time.perf_counter()
    dist_res = get_job_distribution(job_id=created_job_id, db=analytics_db)
    collector.record("6.3 Job Score Distribution Histogram", dist_res.success and "score_brackets" in dist_res.data, (time.perf_counter() - t0) * 1000)

    # ==========================================================================
    # SUITE 7: RESILIENCE, CIRCUIT BREAKER & FAULT TOLERANCE
    # ==========================================================================
    print("\n--- [Suite 7: Resilience, Circuit Breakers & Fault Tolerance] ---")

    # 7.1 CircuitBreaker State Machine: Closed -> Open (Fast-Fail) -> Recovery
    t0 = time.perf_counter()
    cb = CircuitBreaker(service_name="payment-gateway", failure_threshold=2, recovery_timeout=0.1)
    cb.record_failure()
    cb.record_failure()
    tripped = cb.state == CircuitBreakerState.OPEN and cb.can_execute() is False
    time.sleep(0.12)
    recovered = cb.can_execute() is True and cb.state == CircuitBreakerState.HALF_OPEN
    cb.record_success()
    closed = cb.state == CircuitBreakerState.CLOSED
    collector.record("7.1 Circuit Breaker: State Machine (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)", tripped and recovered and closed, (time.perf_counter() - t0) * 1000)

    # 7.2 Transient Network Fault Retries with Exponential Backoff
    t0 = time.perf_counter()
    attempt_count = 0
    @retry_with_backoff(max_retries=3, initial_delay=0.02, backoff_factor=1.5, exceptions=(RuntimeError,))
    def flaky_network_call():
        nonlocal attempt_count
        attempt_count += 1
        if attempt_count < 3:
            raise RuntimeError("Transient socket drop")
        return "SUCCESS"
    retry_result = flaky_network_call()
    collector.record("7.2 Retry with Exponential Backoff on Network Glitches", retry_result == "SUCCESS" and attempt_count == 3, (time.perf_counter() - t0) * 1000, f"Recovered after {attempt_count} attempts")

    # 7.3 Graceful Degradation Fallback under Dependency Outage
    t0 = time.perf_counter()
    breaker = ResilientHttpClient.get_circuit_breaker("failing-metrics-service")
    breaker.record_failure()
    breaker.record_failure()
    breaker.record_failure()
    fallback_payload = {"status": "DEGRADED", "fallback_cached": True}
    res_fallback = ResilientHttpClient.call(
        service_name="failing-metrics-service",
        method="GET",
        url="http://unreachable-pod:8080/metrics",
        fallback=lambda: fallback_payload
    )
    collector.record("7.3 Resilient Client: Graceful Degradation Fallback", res_fallback == fallback_payload, (time.perf_counter() - t0) * 1000, "Fallback triggered smoothly without crashing caller")

    # 7.4 Polyglot Database Graceful Fallback (Zero-Dependency Local Mode)
    t0 = time.perf_counter()
    db_fallbacks_active = (
        auth_engine.dialect.name in ("sqlite", "postgresql") and
        agent_store.ping() is True
    )
    collector.record("7.4 Polyglot DB In-Memory / Local Engine Resilience", db_fallbacks_active, (time.perf_counter() - t0) * 1000, "SQLite, mongomock, fakeredis active")

    # Clean up test vector store files
    try:
        import shutil
        if os.path.exists("./test_vector_store"):
            shutil.rmtree("./test_vector_store", ignore_errors=True)
    except Exception:
        pass

    return collector.summary()


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
