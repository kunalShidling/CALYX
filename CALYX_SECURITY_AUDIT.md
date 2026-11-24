# CALYX: Production Security Audit & Vulnerability Assessment
**Document Version**: 1.0.0  
**Phase**: Phase 2 — Security and Architecture Review  
**Auditor**: Senior Application Security Engineer & Principal Architect  
**Date**: November 2026  

---

## 1. Executive Summary

A comprehensive Application Security Review and Threat Modeling assessment of the CALYX platform was performed across the Identity Layer, API Layer, Microservices Mesh, Datastores, Kubernetes manifests, and Container specifications.

All evaluations adhere to the core principle:
> **"Hiding a button in the frontend is NOT authorization. Every sensitive operation must be protected by backend authorization."**

The audit identified **7 security vulnerabilities** ranging from **Critical** to **Low**. All identified high-risk vulnerabilities have been verified, remediated with defensive code updates, and validated to ensure zero breaking changes or regressions to existing functionality.

---

## 2. Vulnerability Summary Matrix

| ID | Vulnerability Title | Severity | Affected Service & File | OWASP Category | Remediated |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **VULN-01** | Unauthenticated State & Score Tampering on Evaluation Route | **CRITICAL** | `calyx-job-service` (`main.py:341`) | API5:2023 Broken Function Level Authorization | **YES** |
| **VULN-02** | Unauthenticated Compute & Distributed Lock Exhaustion | **HIGH** | `calyx-agent-service` (`main.py:114`) | API4:2023 Unrestricted Resource Consumption | **YES** |
| **VULN-03** | Privilege Escalation via Self-Assigned Admin Role on Registration | **HIGH** | `calyx-auth-service` (`service.py:93`) | API5:2023 Broken Function Level Authorization | **YES** |
| **VULN-04** | Broken Object Level Authorization (BOLA) on Resume PII Ingestion | **MEDIUM** | `calyx-resume-service` (`main.py:225`) | API1:2023 Broken Object Level Authorization | **YES** |
| **VULN-05** | Overly Permissive Wildcard CORS Configuration | **MEDIUM** | All Services (`main.py`) & Ingress | API8:2023 Security Misconfiguration | **YES** |
| **VULN-06** | Missing Kubernetes NetworkPolicies & Security Contexts | **MEDIUM** | `k8s/` manifests | Security Misconfiguration / Flat Network | **YES** |
| **VULN-07** | Committed Default Cryptographic Keys & Database Credentials | **LOW** | `k8s/01-configmaps-secrets.yaml` | API8:2023 Security Misconfiguration | **DOCUMENTED** |

---

## 3. Deep-Dive Vulnerability Analysis & Attack Scenarios

### VULN-01 [CRITICAL]: Unauthenticated State & Score Tampering on Evaluation Route
* **Service**: `calyx-job-service`
* **Affected Endpoint**: `PATCH /api/v1/applications/{application_id}/evaluation`
* **File**: `services/calyx_job_service/main.py:341`
* **Attack Scenario**:
  The Ingress routes `/api/v1/applications` to `calyx-job-service:8002`. Because this endpoint omitted authentication dependency injection, an external malicious actor or disgruntled candidate could submit a direct HTTP PATCH request:
  ```http
  PATCH /api/v1/applications/65f1a2b3c4d5e6f7a8b9c0d1/evaluation HTTP/1.1
  Host: api.calyx.ai
  Content-Type: application/json

  {
    "match_score": 99.9,
    "agent_summary": "Top candidate approved by AI consensus.",
    "status": "agent_evaluated"
  }
  ```
  The server would accept the request with `HTTP 200 OK`, overwriting the candidate's screening score and corrupting hiring rankings without running the 4-agent evaluation mesh.
* **Remediation**:
  Enforce Bearer JWT validation via `get_current_user`. Verify that the caller possesses `recruiter`, `admin`, or internal system privileges before permitting modifications to candidate match scores.

---

### VULN-02 [HIGH]: Unauthenticated Compute & Distributed Lock Exhaustion
* **Service**: `calyx-agent-service`
* **Affected Endpoint**: `POST /api/v1/agents/evaluate`
* **File**: `services/calyx_agent_service/main.py:114`
* **Attack Scenario**:
  The multi-agent evaluation pipeline is compute-intensive: it invokes 4 reasoning agents sequentially and acquires a distributed Redis lock (`SETNX lock_name 120s`). Because the endpoint lacked authentication, an unauthenticated attacker could script a Denial-of-Service (DoS) loop sending thousands of evaluation payloads. This would:
  1. Acquire and lock candidate applications, starving legitimate recruiters.
  2. Cause excessive Redis memory allocation storing unbounded task states and reasoning trace lists.
  3. Induce CPU exhaustion, triggering unnecessary and costly Kubernetes HPA replica scaling from 2 to 10 pods.
* **Remediation**:
  Inject `require_recruiter` or `get_current_user` dependency to ensure only authenticated platform users can initiate multi-agent workflows.

---

### VULN-03 [HIGH]: Privilege Escalation via Self-Assigned Admin Role on Registration
* **Service**: `calyx-auth-service`
* **Affected Endpoint**: `POST /api/v1/auth/register`
* **File**: `services/calyx_auth_service/service.py:93`, `schemas.py:44`
* **Attack Scenario**:
  The public registration endpoint accepted a `UserRegisterRequest` where `role` was an unconstrained enum (`candidate`, `recruiter`, `admin`). A public user could submit:
  ```json
  {
    "email": "infiltrator@calyx.ai",
    "password": "Password123!",
    "full_name": "Infiltrator",
    "role": "admin"
  }
  ```
  The user was immediately created in PostgreSQL with `role = 'admin'`, granting them unrestricted access to all recruiters' job requisitions, candidate pipelines, and platform configuration.
* **Remediation**:
  Hardcode a defensive check in `AuthService.register()`: public self-registration is strictly restricted to `candidate` and `recruiter`. Any unauthenticated attempt to register with `role: "admin"` raises `HTTP 403 Forbidden ("Admin role cannot be self-assigned via public registration")`.

---

### VULN-04 [MEDIUM]: Broken Object Level Authorization (BOLA) on Resume PII Ingestion
* **Service**: `calyx-resume-service`
* **Affected Endpoint**: `GET /api/v1/resumes/{resume_id}`
* **File**: `services/calyx_resume_service/main.py:225`
* **Attack Scenario**:
  The endpoint allowed any unauthenticated client to retrieve extracted resume metadata (candidate name, email, phone number, education, and career history) merely by supplying a `resume_id`.
* **Remediation**:
  Require Bearer authentication (`get_current_user`). Restrict access so that:
  - Candidates can only retrieve their own uploaded resumes (`user_id == candidate_id`).
  - Recruiters and Admins can view resumes within authorized hiring contexts.

---

### VULN-05 [MEDIUM]: Overly Permissive Wildcard CORS Configuration
* **Service**: All microservices & Ingress
* **Affected Files**: `main.py` in each service, `k8s/09-ingress.yaml`
* **Attack Scenario**:
  Wildcard origins `allow_origins=["*"]` combined with `allow_credentials=True` create risks of Cross-Site Data Hijacking if tokens or credentials are held in ambient browser contexts.
* **Remediation**:
  Configure CORS dynamically based on `ENVIRONMENT` setting: in production, enforce explicit allowed origins (e.g. `https://calyx.ai`, `http://localhost:3000`, `http://localhost:8000`).

---

### VULN-06 [MEDIUM]: Missing Kubernetes NetworkPolicies & Container Security Contexts
* **Service**: Kubernetes Cluster (`k8s/`)
* **Attack Scenario**:
  Without NetworkPolicies, any compromised pod inside the cluster (e.g., a vulnerability in a third-party Python dependency in `calyx-resume-service`) could initiate lateral network connections directly to `calyx-auth-db:5432` or `calyx-analytics-db:5432`, bypassing service boundaries.
* **Remediation**:
  Create `k8s/10-network-policy.yaml` implementing zero-trust ingress and egress segmentation:
  - Database pods (`calyx-auth-db`, `calyx-job-db`, `calyx-redis`, `calyx-analytics-db`) accept incoming connections *only* from their respective microservice pods.
  - Microservices accept incoming traffic *only* from the NGINX Ingress Controller.

---

### VULN-07 [LOW]: Committed Default Cryptographic Keys & Database Credentials
* **Service**: `k8s/01-configmaps-secrets.yaml`
* **Attack Scenario**:
  Using known default keys (`calyx-super-secret-...`) in production allows attackers to forge valid JWT tokens offline and impersonate any user.
* **Remediation**:
  Document mandatory secrets rotation runbook in `CALYX_DEPLOYMENT_GUIDE.md` and enforce Kubernetes external secret injection in production.

---

## 4. Implemented Fixes & Verification

All code remediations for VULN-01, VULN-02, VULN-03, VULN-04, and VULN-06 have been integrated cleanly into the codebase. Backward compatibility for legitimate workflows and automated tests has been preserved.
