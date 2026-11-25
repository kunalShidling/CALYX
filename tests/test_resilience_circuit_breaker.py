# ==============================================================================
# CALYX UNIT TEST: RESILIENCE & CIRCUIT BREAKER VALIDATION
# ==============================================================================
import time
import pytest
from common.resilience import (
    CircuitBreaker,
    CircuitBreakerState,
    CircuitBreakerOpenException,
    retry_with_backoff,
    ResilientHttpClient,
)


def test_circuit_breaker_transitions():
    """Validates CLOSED -> OPEN -> HALF_OPEN state transitions."""
    breaker = CircuitBreaker(service_name="test-service", failure_threshold=2, recovery_timeout=0.2)
    assert breaker.state == CircuitBreakerState.CLOSED
    assert breaker.can_execute() is True

    # Record 1st failure
    breaker.record_failure()
    assert breaker.state == CircuitBreakerState.CLOSED

    # Record 2nd failure -> Trips to OPEN
    breaker.record_failure()
    assert breaker.state == CircuitBreakerState.OPEN
    assert breaker.can_execute() is False

    # Wait for recovery timeout
    time.sleep(0.25)
    assert breaker.can_execute() is True
    assert breaker.state == CircuitBreakerState.HALF_OPEN

    # Record success -> Resets to CLOSED
    breaker.record_success()
    assert breaker.state == CircuitBreakerState.CLOSED
    assert breaker.failure_count == 0


def test_retry_with_backoff():
    """Validates automatic retry on transient exceptions."""
    attempts = 0

    @retry_with_backoff(max_retries=3, initial_delay=0.05, backoff_factor=1.5, exceptions=(ValueError,))
    def flaky_service_call():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise ValueError("Transient network glitch")
        return "SUCCESS"

    result = flaky_service_call()
    assert result == "SUCCESS"
    assert attempts == 3


def test_resilient_http_client_fallback():
    """Validates graceful degradation fallback when circuit is OPEN."""
    breaker = ResilientHttpClient.get_circuit_breaker("failing-service")
    breaker.record_failure()
    breaker.record_failure()
    breaker.record_failure()  # Trips breaker to OPEN

    # Call with fallback
    fallback_data = {"status": "DEGRADED", "cached_results": [1, 2, 3]}
    res = ResilientHttpClient.call(
        service_name="failing-service",
        method="GET",
        url="http://non-existent-service:9999/api",
        fallback=lambda: fallback_data,
    )
    assert res == fallback_data
