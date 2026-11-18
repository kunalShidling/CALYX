
# ==============================================================================
# CALYX AGENT SERVICE: MULTI-AGENT STATE MACHINE & ORCHESTRATOR
# ==============================================================================
# Responsibilities:
# 1. Coordinate the four specialized agents.
# 2. Prevent duplicate evaluations using a Redis distributed lock.
# 3. Persist task status and execution traces in Redis.
# 4. Store the final evaluation report.
# 5. Release only the lock owned by this worker.
#
# Agents:
#   Step 1: Normalization Agent
#   Step 2: Criteria Matching Agent
#   Step 3: Bias Audit Agent
#   Step 4: Technical Interview Agent
#   Step 5: Consensus Synthesis
# ==============================================================================

import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from common.logging_config import configure_logger
from services.calyx_agent_service.config import agent_settings
from services.calyx_agent_service.state_store import AgentStateStore

from services.calyx_agent_service.agents.normalization_agent import (
    NormalizationAgent,
)
from services.calyx_agent_service.agents.criteria_agent import (
    CriteriaMatchingAgent,
)
from services.calyx_agent_service.agents.bias_agent import (
    BiasAuditAgent,
)
from services.calyx_agent_service.agents.interview_agent import (
    TechnicalInterviewAgent,
)

logger = configure_logger(
    agent_settings.SERVICE_NAME,
    agent_settings.LOG_LEVEL,
)


class AgentOrchestrator:
    """
    Coordinates the multi-agent candidate evaluation workflow.

    Redis stores:
      - Task status
      - Intermediate execution results
      - Agent execution traces
      - Final evaluation output

    A unique lock token ensures that a worker can release only
    the distributed lock it successfully acquired.
    """

    @classmethod
    def evaluate_candidate(
        cls,
        state_store: AgentStateStore,
        application_id: str,
        candidate_profile: Dict[str, Any],
        job_requirements: Dict[str, Any],
    ) -> Dict[str, Any]:

        # ------------------------------------------------------------------
        # Initialize task information
        # ------------------------------------------------------------------

        task_id = f"task_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now(timezone.utc).isoformat()
        lock_name = f"eval_{application_id}"

        # ------------------------------------------------------------------
        # Step 0: Acquire distributed Redis lock
        # ------------------------------------------------------------------

        lock_token = state_store.acquire_lock(
            lock_name,
            expire_seconds=120,
        )

        if not lock_token:
            logger.warning(
                "Evaluation already in progress for application: %s",
                application_id,
            )

            return {
                "task_id": task_id,
                "application_id": application_id,
                "status": "IN_PROGRESS",
                "message": (
                    "Evaluation is currently being processed "
                    "by another agent worker."
                ),
            }

        try:
            # ------------------------------------------------------------------
            # Initialize task state
            # ------------------------------------------------------------------

            initial_state = {
                "task_id": task_id,
                "application_id": application_id,
                "candidate_id": candidate_profile.get("candidate_id"),
                "status": "PROCESSING",
                "current_step": "NORMALIZATION",
                "started_at": now_str,
            }

            state_store.save_task_state(
                task_id,
                initial_state,
            )

            # ------------------------------------------------------------------
            # Step 1: Normalization Agent
            # ------------------------------------------------------------------

            logger.info(
                "[%s] Step 1: Invoking Normalization Agent",
                task_id,
            )

            norm_result = NormalizationAgent.run(
                candidate_profile,
            )

            state_store.append_trace_step(
                task_id=task_id,
                agent_name=NormalizationAgent.NAME,
                thought=(
                    "Standardizing technical terminology and "
                    "mapping synonyms to canonical skills."
                ),
                action="NORMALIZE_SKILLS_AND_SPECIALTY",
                output=norm_result,
            )

            # ------------------------------------------------------------------
            # Step 2: Criteria Matching Agent
            # ------------------------------------------------------------------

            logger.info(
                "[%s] Step 2: Invoking Criteria Matching Agent",
                task_id,
            )

            criteria_result = CriteriaMatchingAgent.run(
                normalized_data=norm_result,
                job_requirements=job_requirements,
            )

            state_store.append_trace_step(
                task_id=task_id,
                agent_name=CriteriaMatchingAgent.NAME,
                thought=(
                    "Comparing candidate skills against weighted "
                    "job requirements and calculating the match score."
                ),
                action="SCORE_RUBRICS",
                output=criteria_result,
            )

            # ------------------------------------------------------------------
            # Step 3: Bias and Fairness Audit Agent
            # ------------------------------------------------------------------

            logger.info(
                "[%s] Step 3: Invoking Bias Audit Agent",
                task_id,
            )

            bias_result = BiasAuditAgent.run(
                candidate_profile=candidate_profile,
                criteria_evaluation=criteria_result,
            )

            state_store.append_trace_step(
                task_id=task_id,
                agent_name=BiasAuditAgent.NAME,
                thought=(
                    "Checking the evaluation for demographic signals "
                    "and potential fairness concerns."
                ),
                action="AUDIT_FAIRNESS",
                output=bias_result,
            )

            # ------------------------------------------------------------------
            # Step 4: Technical Interview Agent
            # ------------------------------------------------------------------

            logger.info(
                "[%s] Step 4: Invoking Technical Interview Agent",
                task_id,
            )

            interview_result = TechnicalInterviewAgent.run(
                normalized_data=norm_result,
                criteria_evaluation=criteria_result,
            )

            state_store.append_trace_step(
                task_id=task_id,
                agent_name=TechnicalInterviewAgent.NAME,
                thought=(
                    "Generating technical interview questions based "
                    "on the candidate's skills and evaluation results."
                ),
                action="GENERATE_INTERVIEW_QUESTIONS",
                output=interview_result,
            )

            # ------------------------------------------------------------------
            # Step 5: Consensus Synthesis
            # ------------------------------------------------------------------

            final_score = criteria_result.get(
                "overall_match_score",
                0.0,
            )

            specialty = norm_result.get(
                "detected_specialty",
                "Software Engineer",
            )

            audit_pass = bias_result.get(
                "audit_passed",
                False,
            )

            total_questions = interview_result.get(
                "total_questions_synthesized",
                0,
            )

            synthesis_summary = (
                f"Multi-Agent Evaluation Consensus: "
                f"Candidate classified as '{specialty}' with a "
                f"composite rubric score of {final_score}%. "
                f"Fairness Audit: "
                f"{'PASSED' if audit_pass else 'FLAGGED'}. "
                f"Generated {total_questions} personalized "
                f"technical interview questions."
            )

            # ------------------------------------------------------------------
            # Save completed task
            # ------------------------------------------------------------------

            completed_state = {
                "task_id": task_id,
                "application_id": application_id,
                "candidate_id": candidate_profile.get("candidate_id"),
                "status": "COMPLETED",
                "final_score": final_score,
                "detected_specialty": specialty,
                "fairness_audit": bias_result,
                "rubric_breakdown": criteria_result.get(
                    "rubric_breakdowns",
                    [],
                ),
                "interview_questionnaire": interview_result.get(
                    "questions",
                    [],
                ),
                "executive_summary": synthesis_summary,
                "completed_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

            state_store.save_task_state(
                task_id,
                completed_state,
            )

            logger.info(
                "[%s] Multi-agent evaluation completed. Score: %s%%",
                task_id,
                final_score,
            )

            return completed_state

        except Exception as exc:
            # --------------------------------------------------------------
            # Record task failure
            # --------------------------------------------------------------

            logger.exception(
                "[%s] Candidate evaluation failed",
                task_id,
            )

            failed_state = {
                "task_id": task_id,
                "application_id": application_id,
                "candidate_id": candidate_profile.get("candidate_id"),
                "status": "FAILED",
                "error": str(exc),
                "failed_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

            try:
                state_store.save_task_state(
                    task_id,
                    failed_state,
                )
            except Exception:
                logger.exception(
                    "[%s] Could not persist failure state to Redis",
                    task_id,
                )

            # Preserve the original exception for the API error handler.
            raise

        finally:
            # --------------------------------------------------------------
            # Release only the lock owned by this worker
            # --------------------------------------------------------------

            try:
                released = state_store.release_lock(
                    lock_name,
                    lock_token,
                )

                if released:
                    logger.info(
                        "[%s] Distributed lock released successfully",
                        task_id,
                    )
                else:
                    logger.warning(
                        "[%s] Lock was not released. It may have expired "
                        "or ownership may have changed.",
                        task_id,
                    )

            except Exception:
                logger.exception(
                    "[%s] Error while releasing distributed lock",
                    task_id,
                )
