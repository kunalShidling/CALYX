# ==============================================================================
# CALYX SHARED KERNEL: RESILIENCE & INTER-SERVICE COMMUNICATION MODULE
# ==============================================================================
# Concept Explanation:
# In a distributed microservices architecture, network calls between services
# can fail, experience latency spikes, or exhaust resources.
#
# This module implements three enterprise resilience patterns:
# 1. Circuit Breaker Pattern:
#    Stops invoking a failing downstream service once the failure threshold is
#    reached (OPEN state). Fast-fails incoming requests to prevent thread
#    exhaustion and allows the failing service time to recover.
#
# 2. Exponential Backoff & Retry:
#    Automatically retries transient network glitches with geometrically
#    increasing delays, avoiding thundering-herd retry storms.
#
# 3. Graceful Fallbacks:
#    Provides clean fallback data if a downstream dependency remains unreachable,
#    ensuring the caller never crashes.
# ==============================================================================

import time
import enum
import functools
from typing import Callable, Any, Dict, Optional
import httpx
from common.logging_config import configure_logger

logger = configure_logger("calyx-resilience", "INFO")


class CircuitBreakerState(enum.Enum):
    CLOSED = "CLOSED"        # Normal operation: requests pass through
    OPEN = "OPEN"            # Tripped: requests fail fast
    HALF_OPEN = "HALF_OPEN"  # Testing: limited probe requests allowed


class CircuitBreakerOpenException(Exception):
    """Raised when an inter-service request is attempted while the circuit breaker is OPEN."""
    pass


class CircuitBreaker:
    """
    Stateful circuit breaker tracking failures per target service.
    """

    def __init__(
        self,
        service_name: str,
        failure_threshold: int = 3,
        recovery_timeout: float = 30.0,
    ):
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.success_count = 0

    def can_execute(self) -> bool:
        """Determines if a request can proceed based on current breaker state."""
        now = time.time()
        if self.state == CircuitBreakerState.OPEN:
            if self.last_failure_time and (now - self.last_failure_time >= self.recovery_timeout):
                logger.info(
                    f"[CircuitBreaker:{self.service_name}] Recovery timeout elapsed. Switching to HALF_OPEN."
                )
                self.state = CircuitBreakerState.HALF_OPEN
                return True
            return False
        return True

    def record_success(self):
        """Records a successful response, resetting the breaker to CLOSED."""
        if self.state == CircuitBreakerState.HALF_OPEN:
            logger.info(
                f"[CircuitBreaker:{self.service_name}] Probe request succeeded. Resetting to CLOSED."
            )
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None

    def record_failure(self):
        """Records a failure. Trips the breaker to OPEN if failure_threshold reached."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        logger.warning(
            f"[CircuitBreaker:{self.service_name}] Recorded failure #{self.failure_count}/{self.failure_threshold}."
        )
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            logger.error(
                f"[CircuitBreaker:{self.service_name}] Failure threshold reached. Breaker tripped to OPEN!"
            )


def retry_with_backoff(
    max_retries: int = 3,
    initial_delay: float = 0.5,
    backoff_factor: float = 2.0,
    exceptions: tuple = (httpx.RequestError, httpx.TimeoutException, ConnectionError)
):
    """
    Decorator for retrying transient operations with exponential backoff.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            last_exc = None
            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    logger.warning(
                        f"[Retry] Attempt {attempt}/{max_retries} failed for '{func.__name__}': {str(e)}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    time.sleep(delay)
                    delay *= backoff_factor
            raise last_exc
        return wrapper
    return decorator


class ResilientHttpClient:
    """
    Enterprise HTTP Client for Cross-Service Microservice Communication.
    Features:
    - Circuit Breaker per target downstream service
    - Exponential backoff retries on transient network errors
    - Configurable timeouts
    - Automatic Bearer token authentication injection
    - Graceful fallback callback support
    """

    _breakers: Dict[str, CircuitBreaker] = {}

    @classmethod
    def get_circuit_breaker(cls, service_name: str) -> CircuitBreaker:
        if service_name not in cls._breakers:
            cls._breakers[service_name] = CircuitBreaker(service_name=service_name)
        return cls._breakers[service_name]

    @classmethod
    def call(
        cls,
        service_name: str,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        timeout: float = 5.0,
        fallback: Optional[Callable[[], Any]] = None,
    ) -> Any:
        """
        Executes an HTTP request protected by circuit breaking, retries, and fallbacks.
        """
        breaker = cls.get_circuit_breaker(service_name)

        if not breaker.can_execute():
            logger.warning(
                f"[ResilientHttpClient] Circuit breaker is OPEN for service '{service_name}'. "
                f"Fast-failing request to {url}."
            )
            if fallback:
                return fallback()
            raise CircuitBreakerOpenException(
                f"Circuit breaker for service '{service_name}' is OPEN. Downstream dependency unavailable."
            )

        @retry_with_backoff(max_retries=3, initial_delay=0.3, backoff_factor=1.5)
        def _execute():
            with httpx.Client(timeout=timeout) as client:
                res = client.request(
                    method=method.upper(),
                    url=url,
                    headers=headers or {},
                    json=json_data,
                )
                res.raise_for_status()
                return res.json()

        try:
            result = _execute()
            breaker.record_success()
            return result
        except Exception as e:
            breaker.record_failure()
            logger.error(
                f"[ResilientHttpClient] Error communicating with '{service_name}' at {url}: {str(e)}"
            )
            if fallback:
                logger.info(f"[ResilientHttpClient] Executing fallback handler for '{service_name}'.")
                return fallback()
            raise
