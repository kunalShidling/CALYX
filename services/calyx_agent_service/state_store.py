
# ==============================================================================
# CALYX AGENT SERVICE: REDIS STATE STORE & DISTRIBUTED LOCKS
# ==============================================================================

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

import redis
import fakeredis

from common.logging_config import configure_logger
from services.calyx_agent_service.config import agent_settings


logger = configure_logger(
    agent_settings.SERVICE_NAME,
    agent_settings.LOG_LEVEL
)

_redis_client = None


def get_redis_client(force_mock: bool = False):
    """
    Initialize Redis client.

    Production:
        Requires a real Redis connection.
        Does not allow fakeredis fallback.

    Development:
        Allows fakeredis fallback when Redis is unavailable.
    """

    global _redis_client

    if _redis_client is not None:
        return _redis_client

    environment = agent_settings.ENVIRONMENT.lower()

    # Prevent mock Redis from being used in production.
    if force_mock or agent_settings.REDIS_URL == "mock":

        if environment == "production":
            raise RuntimeError(
                "In-memory fakeredis is not allowed in production."
            )

        logger.info(
            "Using in-memory Redis mock engine (fakeredis)."
        )

        _redis_client = fakeredis.FakeRedis(
            decode_responses=True
        )

        return _redis_client

    try:
        logger.info(
            f"Connecting to Redis at {agent_settings.REDIS_URL}..."
        )

        client = redis.Redis.from_url(
            agent_settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=5
        )

        # Verify that the real Redis server is reachable.
        client.ping()

        _redis_client = client

        logger.info(
            "Successfully established connection to real Redis server."
        )

        return _redis_client

    except Exception as exc:

        if environment == "production":

            logger.exception(
                "Redis connection failed in production."
            )

            raise RuntimeError(
                "Agent Service cannot start without a working Redis connection."
            ) from exc

        logger.warning(
            f"Redis unavailable: {exc}. "
            "Falling back to fakeredis for development."
        )

        _redis_client = fakeredis.FakeRedis(
            decode_responses=True
        )

        return _redis_client


class AgentStateStore:
    """
    Redis abstraction for:
    1. Agent task state
    2. Distributed locks
    3. Agent reasoning traces
    """

    def __init__(self, client=None):

        self.r = (
            client
            if client is not None
            else get_redis_client()
        )

    # --------------------------------------------------------------------------
    # DISTRIBUTED LOCK MANAGEMENT
    # --------------------------------------------------------------------------

    def acquire_lock(
        self,
        lock_name: str,
        expire_seconds: int = 120
    ) -> Optional[str]:
        """
        Acquire a distributed lock using a unique ownership token.

        Returns:
            Unique token if acquired.
            None if another worker owns the lock.
        """

        key = f"agent:lock:{lock_name}"

        # Every worker receives a unique ownership token.
        token = uuid.uuid4().hex

        acquired = self.r.set(
            key,
            token,
            nx=True,
            ex=expire_seconds
        )

        if acquired:
            logger.info(
                f"Distributed lock acquired: {lock_name}"
            )

            return token

        logger.warning(
            f"Distributed lock already held: {lock_name}"
        )

        return None

    def release_lock(
        self,
        lock_name: str,
        token: str
    ) -> bool:
        """
        Release a lock only if the current worker owns it.

        Redis Lua script ensures GET and DELETE execute atomically.
        """

        key = f"agent:lock:{lock_name}"

        release_script = """
        if redis.call('GET', KEYS[1]) == ARGV[1] then
            return redis.call('DEL', KEYS[1])
        else
            return 0
        end
        """

        try:
            result = self.r.eval(
                release_script,
                1,
                key,
                token
            )
        except Exception:
            # Fallback for Redis mock engines without embedded Lua interpreter
            if self.r.get(key) == token:
                result = self.r.delete(key)
            else:
                result = 0

        if result:
            logger.info(
                f"Distributed lock released: {lock_name}"
            )

            return True

        logger.warning(
            f"Lock not released because ownership changed: {lock_name}"
        )

        return False

    # --------------------------------------------------------------------------
    # TASK STATE MANAGEMENT
    # --------------------------------------------------------------------------

    def save_task_state(
        self,
        task_id: str,
        state_data: Dict[str, Any]
    ) -> None:
        """
        Save or update agent task state in Redis.
        Task state expires after 24 hours.
        """

        key = f"agent:task:{task_id}"

        payload = json.dumps(state_data)

        self.r.set(
            key,
            payload,
            ex=86400
        )

    def get_task_state(
        self,
        task_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve agent task state from Redis.
        """

        key = f"agent:task:{task_id}"

        raw = self.r.get(key)

        if not raw:
            return None

        return json.loads(raw)

    # --------------------------------------------------------------------------
    # REASONING TRACE MANAGEMENT
    # --------------------------------------------------------------------------

    def append_trace_step(
        self,
        task_id: str,
        agent_name: str,
        thought: str,
        action: str,
        output: Any
    ) -> None:
        """
        Append an agent execution trace to Redis.
        """

        key = f"agent:trace:{task_id}"

        step_record = {
            "agent": agent_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "thought": thought,
            "action": action,
            "output": output
        }

        self.r.rpush(
            key,
            json.dumps(step_record)
        )

        # Keep trace data for 24 hours.
        self.r.expire(key, 86400)

    def get_full_trace(
        self,
        task_id: str
    ) -> List[Dict[str, Any]]:
        """
        Retrieve the chronological agent reasoning trace.
        """

        key = f"agent:trace:{task_id}"

        raw_items = self.r.lrange(
            key,
            0,
            -1
        )

        return [
            json.loads(item)
            for item in raw_items
        ]

    # --------------------------------------------------------------------------
    # HEALTH CHECK
    # --------------------------------------------------------------------------

    def ping(self) -> bool:
        """
        Verify Redis connectivity.
        """

        return bool(self.r.ping())


# ==============================================================================
# GLOBAL STATE STORE
# ==============================================================================

state_store = AgentStateStore()


def get_state_store() -> AgentStateStore:
    """
    FastAPI dependency providing the shared Redis state store.
    """

    return state_store
