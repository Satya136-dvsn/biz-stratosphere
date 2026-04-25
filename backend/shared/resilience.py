"""
Resilience Layer – Circuit Breaker + Retry with Exponential Backoff
Biz Stratosphere Phase 5

Usage:
    from shared.resilience import CircuitBreaker, retry_with_backoff

    breaker = CircuitBreaker(name="rag-service", failure_threshold=3, recovery_timeout=30)

    @breaker.call
    async def fetch_rag_context(query: str):
        ...

    result = await retry_with_backoff(fetch_rag_context, max_attempts=3, base_delay=0.5)
"""
from __future__ import annotations

import asyncio
import time
import logging
from enum import Enum
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Circuit Breaker
# ──────────────────────────────────────────────
class CircuitState(str, Enum):
    CLOSED = "CLOSED"        # Normal operation
    OPEN = "OPEN"            # Failing – reject all calls
    HALF_OPEN = "HALF_OPEN"  # Recovery probe allowed


class CircuitBreakerError(Exception):
    """Raised when the circuit is OPEN and a call is attempted."""
    def __init__(self, service_name: str):
        self.service_name = service_name
        super().__init__(f"Circuit breaker OPEN for service: {service_name}")


class CircuitBreaker:
    """
    Thread-safe (asyncio) circuit breaker.

    Args:
        name: Human-readable service name for logging.
        failure_threshold: How many consecutive failures open the circuit.
        recovery_timeout: Seconds before trying a probe request (HALF_OPEN).
        success_threshold: Successes in HALF_OPEN before re-closing circuit.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 3,
        recovery_timeout: float = 30.0,
        success_threshold: int = 2,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[float] = None
        self._lock = asyncio.Lock()

    @property
    def state(self) -> CircuitState:
        return self._state

    @property
    def is_open(self) -> bool:
        return self._state == CircuitState.OPEN

    async def _check_recovery(self) -> None:
        """Transition OPEN → HALF_OPEN if recovery timeout elapsed."""
        if self._state == CircuitState.OPEN and self._last_failure_time:
            elapsed = time.monotonic() - self._last_failure_time
            if elapsed >= self.recovery_timeout:
                async with self._lock:
                    if self._state == CircuitState.OPEN:
                        self._state = CircuitState.HALF_OPEN
                        self._success_count = 0
                        logger.info(f"[CircuitBreaker:{self.name}] → HALF_OPEN (probe allowed)")

    async def _on_success(self) -> None:
        async with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.success_threshold:
                    self._state = CircuitState.CLOSED
                    self._failure_count = 0
                    logger.info(f"[CircuitBreaker:{self.name}] → CLOSED (recovered)")
            elif self._state == CircuitState.CLOSED:
                self._failure_count = 0

    async def _on_failure(self) -> None:
        async with self._lock:
            self._failure_count += 1
            self._last_failure_time = time.monotonic()
            if self._state == CircuitState.HALF_OPEN:
                # probe failed – re-open immediately
                self._state = CircuitState.OPEN
                logger.warning(f"[CircuitBreaker:{self.name}] Probe failed → OPEN")
            elif self._failure_count >= self.failure_threshold:
                self._state = CircuitState.OPEN
                logger.error(
                    f"[CircuitBreaker:{self.name}] "
                    f"{self._failure_count} failures → OPEN"
                )

    async def call(self, func: Callable, *args: Any, fallback: Optional[Callable] = None, **kwargs: Any) -> Any:
        """Execute *func* through the circuit breaker."""
        await self._check_recovery()

        if self._state == CircuitState.OPEN:
            if fallback:
                logger.warning(f"[CircuitBreaker:{self.name}] OPEN - Executing fallback")
                if asyncio.iscoroutinefunction(fallback):
                    return await fallback(*args, **kwargs)
                return fallback(*args, **kwargs)
            raise CircuitBreakerError(self.name)

        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception:
            await self._on_failure()
            if fallback:
                logger.warning(f"[CircuitBreaker:{self.name}] Call failed - Executing fallback")
                if asyncio.iscoroutinefunction(fallback):
                    return await fallback(*args, **kwargs)
                return fallback(*args, **kwargs)
            raise

    def status(self) -> dict:
        return {
            "service": self.name,
            "state": self._state.value,
            "failure_count": self._failure_count,
            "last_failure_seconds_ago": (
                round(time.monotonic() - self._last_failure_time, 1)
                if self._last_failure_time else None
            ),
        }


# ──────────────────────────────────────────────
# Retry with Capped Exponential Backoff
# ──────────────────────────────────────────────
async def retry_with_backoff(
    func: Callable,
    *args: Any,
    max_attempts: int = 3,
    base_delay: float = 0.5,
    max_delay: float = 8.0,
    jitter: bool = True,
    retryable_exceptions: tuple = (Exception,),
    **kwargs: Any,
) -> Any:
    """
    Retries *func* up to *max_attempts* times with capped exponential backoff.

    Backoff formula:  delay = min(base_delay * 2^attempt, max_delay)
    Jitter adds ±25% randomisation to prevent thundering herd.
    """
    import random

    last_exc: Optional[Exception] = None
    for attempt in range(max_attempts):
        try:
            return await func(*args, **kwargs)
        except retryable_exceptions as exc:
            last_exc = exc
            if attempt < max_attempts - 1:
                delay = min(base_delay * (2 ** attempt), max_delay)
                if jitter:
                    delay *= random.uniform(0.75, 1.25)
                logger.warning(
                    f"Retry {attempt + 1}/{max_attempts} for "
                    f"{getattr(func, '__name__', repr(func))} "
                    f"in {delay:.2f}s – {exc}"
                )
                await asyncio.sleep(delay)
            else:
                logger.error(
                    f"All {max_attempts} attempts failed for "
                    f"{getattr(func, '__name__', repr(func))}: {exc}"
                )

    raise last_exc  # type: ignore[misc]


# ──────────────────────────────────────────────
# Registry of all circuit breakers (for observability)
# ──────────────────────────────────────────────
_registry: dict[str, CircuitBreaker] = {}


def register_breaker(breaker: CircuitBreaker) -> CircuitBreaker:
    _registry[breaker.name] = breaker
    return breaker


def get_all_breaker_status() -> list[dict]:
    return [b.status() for b in _registry.values()]


def make_breaker(
    name: str,
    failure_threshold: int = 3,
    recovery_timeout: float = 30.0,
) -> CircuitBreaker:
    """Factory that auto-registers new breakers in the global registry."""
    breaker = CircuitBreaker(
        name=name,
        failure_threshold=failure_threshold,
        recovery_timeout=recovery_timeout,
    )
    return register_breaker(breaker)
