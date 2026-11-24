# CALYX: Production Deployment, Infrastructure & Operations Guide

This guide details the complete deployment, configuration, infrastructure orchestration, and operations procedures for the **CALYX Autonomous Agentic AI Smart Hiring & Talent Screening Platform**.

---

## 1. System Architecture & Infrastructure Overview

CALYX follows a microservice-oriented, database-per-service distributed architecture designed to run on container orchestrators (Kubernetes) or local multi-container development engines (Docker Compose).

```mermaid
graph TD
    Client[Browser / Client] -->|HTTPS:443| Ingress[Kubernetes Ingress / Cloud ALB]
    Ingress -->|/| Frontend[calyx-frontend :80]
    Ingress -->|/api/v1/auth| S1[calyx-auth-service :8001]
    Ingress -->|/api/v1/jobs| S2[calyx-job-service :8002]
    Ingress -->|/api/v1/resumes| S3[calyx-resume-service :8003]
    Ingress -->|/api/v1/agents| S4[calyx-agent-service :8004]
    Ingress -->|/api/v1/analytics| S5[calyx-analytics-service :8005]

    S1 --> DB1[(PostgreSQL / SQLite)]
    S2 --> DB2[(MongoDB / mongomock)]
    S3 --> DB3[(Vector Store / In-Memory)]
    S4 --> DB4[(Redis / fakeredis)]
    S5 --> DB5[(PostgreSQL / SQLite)]

    S4 -.->|Read Job Rubric| S2
    S4 -.->|Read Resume Vector| S3
    S4 -.->|Write AI Evaluation| S2
    S4 -.->|Publish Telemetry| S5
```

### Minimum System Requirements

| Environment | CPU | RAM | Storage | Target Scale |
| :--- | :--- | :--- | :--- | :--- |
| **Local Dev / Testing** | 2 cores | 4 GB | 10 GB SSD | 1-5 concurrent requests |
| **Docker Compose Staging**| 4 cores | 8 GB | 30 GB SSD | 50-100 concurrent requests |
| **Production Kubernetes** | 8+ cores (Cluster) | 16+ GB (Cluster) | 100+ GB NVMe | 500+ concurrent requests (HPA enabled) |

---

## 2. Environment Variables & Secret Configuration

CALYX uses environment variables for operational configuration and Kubernetes Secrets for credential injection.

### Comprehensive Variable Reference

| Service | Variable Name | Default / Example | Purpose / Description |
| :--- | :--- | :--- | :--- |
| **Global / All** | `ENVIRONMENT` | `production` (`development` in dev) | Toggles debug mode, documentation endpoints, and verbose logging |
| **Global / All** | `LOG_LEVEL` | `INFO` (`DEBUG` in dev) | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| **Global / All** | `CORS_ORIGINS` | `http://localhost:3000,https://calyx.ai` | Comma-separated list of allowed web origins |
| **calyx-auth-service** | `DATABASE_URL` | `postgresql+psycopg2://user:pass@calyx-auth-db:5432/calyx_auth` | SQLAlchemy connection string (SQLite fallback in local mode) |
| **calyx-auth-service** | `JWT_SECRET_KEY` | *(Strong 256-bit random string)* | HMAC SHA-256 signing key for authentication tokens |
| **calyx-auth-service** | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Lifespan of short-lived access JWTs |
| **calyx-auth-service** | `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Lifespan of long-lived refresh tokens |
| **calyx-job-service** | `MONGODB_URL` | `mongodb://calyx-mongo:27017` | MongoDB connection URI (`mongomock` fallback in local dev) |
| **calyx-job-service** | `DATABASE_NAME` | `calyx_jobs` | Target MongoDB database name |
| **calyx-resume-service**| `VECTOR_STORE_DIR` | `/app/data/vector_store` | Path for persistent dense vector indexes |
| **calyx-resume-service**| `EMBEDDING_DIMENSION` | `384` | Dimension of candidate profile semantic vectors |
| **calyx-agent-service** | `REDIS_URL` | `redis://calyx-redis:6379/0` | Redis instance for distributed locks & consensus state |
| **calyx-agent-service** | `JOB_SERVICE_URL` | `http://calyx-job-service:8002` | Inter-service base URL for job requisitions and evaluations |
| **calyx-agent-service** | `RESUME_SERVICE_URL` | `http://calyx-resume-service:8003` | Inter-service base URL for resume vector extraction |
| **calyx-agent-service** | `ANALYTICS_SERVICE_URL`| `http://calyx-analytics-service:8005` | Inter-service base URL for evaluation metrics telemetry |
| **calyx-agent-service** | `INTERNAL_SERVICE_TOKEN` | *(Shared Secret)* | Bearer token for inter-service RPC authorization |
| **calyx-analytics-service**| `DATABASE_URL` | `postgresql+psycopg2://user:pass@calyx-analytics-db:5432/calyx_analytics` | SQLAlchemy connection string for analytics metrics warehouse |
| **calyx-frontend** | `VITE_API_BASE_URL` | `/api/v1` (Relative via Ingress or NGINX proxy) | Base endpoint URL for client API requests |

---

## 3. Local Development (Zero External Dependencies)

CALYX is engineered with **Zero-Daemon Local Fallbacks**. You can run the entire platform locally on Windows, macOS, or Linux using Python 3.11+ and Node.js 18+ without installing PostgreSQL, MongoDB, or Redis.

### 3.1 Backend Setup

1. **Activate Virtual Environment**:
   ```bash
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r docker/requirements.txt
   ```

3. **Run Services Individually**:
   Each service can be launched in a dedicated terminal. When external databases are absent, services automatically fall back to SQLite, `mongomock`, `fakeredis`, and local vector storage:

   ```bash
   # Terminal 1: Auth Service (Port 8001)
   python -m uvicorn services.calyx_auth_service.main:app --port 8001 --reload

   # Terminal 2: Job Service (Port 8002)
   python -m uvicorn services.calyx_job_service.main:app --port 8002 --reload

   # Terminal 3: Resume Service (Port 8003)
   python -m uvicorn services.calyx_resume_service.main:app --port 8003 --reload

   # Terminal 4: Agent Service (Port 8004)
   python -m uvicorn services.calyx_agent_service.main:app --port 8004 --reload

   # Terminal 5: Analytics Service (Port 8005)
   python -m uvicorn services.calyx_analytics_service.main:app --port 8005 --reload
   ```

### 3.2 Frontend Setup

1. **Navigate to the frontend workspace**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   pnpm install
   ```

3. **Start Vite development server**:
   ```bash
   pnpm run dev
   ```
   The web application will be accessible at `http://localhost:3000`.

### 3.3 Automated End-to-End Test Verification

To verify full system integrity without starting background server processes, run the automated in-process test suite:
```bash
python tests/comprehensive_e2e_verification.py
```
Expected output:
```text
================================================================================
CALYX PLATFORM VERIFICATION SUMMARY
================================================================================
  Total Test Cases Executed: 35
  Passed:                    35
  Failed:                    0
  Success Rate:              100.0%
================================================================================
```

---

## 4. Docker Compose Deployment

Docker Compose coordinates all 5 microservices, 4 database engines, and the NGINX-powered production frontend container into a single orchestrated network.

### 4.1 Build and Start

From the root repository directory:
```bash
docker compose up --build -d
```

### 4.2 Verify Container Status

```bash
docker compose ps
```
All containers should report state `running` or `healthy`:
```text
NAME                     IMAGE                       STATUS                   PORTS
calyx-auth-db            postgres:15-alpine          Up (healthy)             0.0.0.0:5432->5432/tcp
calyx-mongo              mongo:6.0                   Up (healthy)             0.0.0.0:27017->27017/tcp
calyx-redis              redis:7.0-alpine            Up (healthy)             0.0.0.0:6379->6379/tcp
calyx-analytics-db       postgres:15-alpine          Up (healthy)             0.0.0.0:5433->5432/tcp
calyx-auth-service       calyx/auth-service:latest   Up (healthy)             0.0.0.0:8001->8001/tcp
calyx-job-service        calyx/job-service:latest    Up (healthy)             0.0.0.0:8002->8002/tcp
calyx-resume-service     calyx/resume-service:latest Up (healthy)             0.0.0.0:8003->8003/tcp
calyx-agent-service      calyx/agent-service:latest  Up (healthy)             0.0.0.0:8004->8004/tcp
calyx-analytics-service  calyx/analytics-service:..  Up (healthy)             0.0.0.0:8005->8005/tcp
calyx-frontend           calyx/frontend:latest       Up                       0.0.0.0:3000->80/tcp
```

### 4.3 Inspect Logs

```bash
# Stream all logs
docker compose logs -f

# Stream specific service logs
docker compose logs -f calyx-agent-service
docker compose logs -f calyx-frontend
```

### 4.4 Graceful Teardown

```bash
# Stop containers while preserving database volume data
docker compose down

# Stop containers and destroy volumes (clean slate)
docker compose down -v
```

---

## 5. Kubernetes Production Deployment

CALYX includes enterprise Kubernetes manifests located in the [k8s/](file:///d:/CALYX/k8s/) directory.

### 5.1 Deployment Sequence

Deploy the manifests in their numerical order to ensure prerequisites, namespaces, and datastores initialize before dependent application pods start:

```bash
# Step 1: Create Namespace and Isolation Boundaries
kubectl apply -f k8s/00-namespace.yaml

# Step 2: Apply Shared ConfigMaps and Production Secrets
kubectl apply -f k8s/01-configmaps.yaml
kubectl apply -f k8s/02-secrets.yaml

# Step 3: Deploy Stateful Datastores
kubectl apply -f k8s/03-databases.yaml

# Step 4: Deploy Microservice Backends
kubectl apply -f k8s/04-auth-service.yaml
kubectl apply -f k8s/05-job-service.yaml
kubectl apply -f k8s/06-resume-service.yaml
kubectl apply -f k8s/07-agent-service.yaml

# Step 5: Deploy Frontend Web Application
kubectl apply -f k8s/11-frontend-service.yaml

# Step 6: Configure Zero-Trust Network Policies
kubectl apply -f k8s/10-network-policy.yaml

# Step 7: Configure Horizontal Pod Autoscalers (HPA)
kubectl apply -f k8s/08-autoscaling-hpa.yaml

# Step 8: Configure Ingress Gateway Routing
kubectl apply -f k8s/09-ingress.yaml
```

### 5.2 Verification Commands

```bash
# Verify all pods are running and ready
kubectl get pods -n calyx -o wide

# Verify cluster services
kubectl get svc -n calyx

# Verify Ingress routing rules
kubectl get ingress -n calyx

# Verify Horizontal Pod Autoscalers
kubectl get hpa -n calyx
```

Expected HPA status:
```text
NAME                      REFERENCE                            TARGETS   MINPODS   MAXPODS   REPLICAS
calyx-auth-service-hpa    Deployment/calyx-auth-service        12%/70%   2         10        2
calyx-job-service-hpa     Deployment/calyx-job-service         15%/70%   2         10        2
calyx-resume-service-hpa  Deployment/calyx-resume-service      18%/70%   2         8         2
calyx-agent-service-hpa   Deployment/calyx-agent-service       22%/75%   2         12        2
calyx-analytics-service-.. Deployment/calyx-analytics-service  10%/70%   2         6         2
calyx-frontend-hpa        Deployment/calyx-frontend            8%/80%    2         10        2
```

---

## 6. Security Hardening & Zero-Trust Network Isolation

The platform enforces zero-trust pod segmentation via [k8s/10-network-policy.yaml](file:///d:/CALYX/k8s/10-network-policy.yaml):

1. **Default Deny Ingress**: All incoming traffic across the `calyx` namespace is rejected unless an explicit allow policy matches.
2. **Database Isolation**:
   - `calyx-auth-db` permits ingress traffic exclusively from pods labeled `app: calyx-auth-service`.
   - `calyx-mongo` permits ingress traffic exclusively from pods labeled `app: calyx-job-service`.
   - `calyx-redis` permits ingress traffic exclusively from pods labeled `app: calyx-agent-service`.
   - `calyx-analytics-db` permits ingress traffic exclusively from pods labeled `app: calyx-analytics-service`.
3. **Least Privilege Container Security Contexts**:
   - Containers run as non-root user `uid: 10001`.
   - `readOnlyRootFilesystem: true` enabled where temporary storage is restricted to mounted `emptyDir` volumes.
   - Privilege escalation (`allowPrivilegeEscalation: false`) and all Linux capabilities dropped (`drop: ["ALL"]`).

---

## 7. Observability, Health Checks & Monitoring

### 7.1 Microservice Health Probes

Every backend microservice implements two standardized health endpoints:

- **Liveness Probe**: `GET /health` — Returns HTTP 200 `{"status": "healthy"}` confirming the ASGI event loop is active.
- **Readiness Probe**: `GET /ready` — Validates database and socket connectivity before the pod accepts live ingress traffic.

### 7.2 Prometheus Metrics

All services expose Prometheus scrapable metrics at `/metrics`. Standard monitored metrics include:
- `http_requests_total{method, path, status}`
- `http_request_duration_seconds{method, path}`
- `agent_evaluation_duration_seconds`
- `db_connection_pool_active`
- `db_connection_pool_overflow`

---

## 8. Backup, Disaster Recovery & High Availability

### 8.1 Database Backup Procedures

#### PostgreSQL Databases (`calyx_auth`, `calyx_analytics`)
```bash
# Take hot snapshot
docker exec -t calyx-auth-db pg_dump -U calyx_auth_user calyx_auth > calyx_auth_backup_$(date +%Y%m%d).sql

# Restore snapshot
docker exec -i calyx-auth-db psql -U calyx_auth_user -d calyx_auth < calyx_auth_backup_20261124.sql
```

#### MongoDB (`calyx_jobs`)
```bash
# Take snapshot
docker exec -t calyx-mongo mongodump --db calyx_jobs --out /data/backup/

# Restore snapshot
docker exec -t calyx-mongo mongorestore --db calyx_jobs /data/backup/calyx_jobs/
```

#### Redis Distributed State
Redis is configured with append-only file persistence (`appendonly yes`). Snapshots are persisted to the mounted Docker volume `redis_data`.

---

## 9. Operational Runbook & Troubleshooting

### Scenario 1: `502 Bad Gateway` on Frontend Ingress
- **Cause**: Backend service pod is restarting or failing readiness probes.
- **Diagnosis**:
  ```bash
  kubectl describe ingress calyx-ingress -n calyx
  kubectl get endpoints -n calyx
  ```
- **Remediation**: Check pod logs (`kubectl logs -n calyx -l app=calyx-auth-service --tail=100`). Verify database connectivity.

### Scenario 2: Agent Service Evaluation Timeout (`HTTP 504`)
- **Cause**: Distributed Redis lock contention or high LLM API response latency.
- **Diagnosis**:
  ```bash
  kubectl logs -n calyx -l app=calyx-agent-service | grep -i "lock"
  ```
- **Remediation**: Verify Redis memory and health. If a worker pod crashed while holding a lock, locks auto-expire via TTL (300 seconds).

### Scenario 3: Database Connection Pool Exhaustion
- **Cause**: Sudden traffic burst exceeding connection limit.
- **Remediation**:
  The platform utilizes SQLAlchemy connection pool tuning (`pool_size=20`, `max_overflow=40`). If saturation occurs, scale the database pod or enable PgBouncer proxying in the cluster.

---

## 10. Release Verification Checklist

Prior to signing off on a production release, verify that:
- [x] All 35 integration tests pass (`python tests/comprehensive_e2e_verification.py`).
- [x] Concurrent load test executes without dropped requests (`python tests/load_test_hpa_simulation.py`).
- [x] Frontend builds with zero TypeScript compiler errors (`pnpm run build`).
- [x] Zero-trust Kubernetes NetworkPolicies are applied (`k8s/10-network-policy.yaml`).
- [x] All 6 project documentation deliverables are verified and current.
