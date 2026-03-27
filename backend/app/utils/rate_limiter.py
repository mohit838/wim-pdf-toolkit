from collections import defaultdict, deque
from threading import Lock
from time import time

try:
    import redis
except ImportError:  # pragma: no cover - runtime fallback for environments without redis installed yet
    redis = None


class InMemoryRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> tuple[bool, dict[str, str]]:
        now = time()

        with self._lock:
            self._evict_stale_keys(now)
            window = self._requests[key]

            while window and now - window[0] > self.window_seconds:
                window.popleft()

            if not window and key in self._requests:
                del self._requests[key]
                window = self._requests[key]

            remaining = max(self.max_requests - len(window), 0)
            reset_after = self.window_seconds
            if window:
                reset_after = max(int(self.window_seconds - (now - window[0])), 0)

            headers = {
                "X-RateLimit-Limit": str(self.max_requests),
                "X-RateLimit-Remaining": str(max(remaining - 1, 0)),
                "X-RateLimit-Reset": str(reset_after),
            }

            if len(window) >= self.max_requests:
                headers["Retry-After"] = str(reset_after or self.window_seconds)
                headers["X-RateLimit-Remaining"] = "0"
                return False, headers

            window.append(now)

        return True, headers

    def _evict_stale_keys(self, now: float) -> None:
        stale_keys = [
            key
            for key, window in self._requests.items()
            if not window or now - window[-1] > self.window_seconds
        ]
        for key in stale_keys:
            self._requests.pop(key, None)


class RedisRateLimiter:
    def __init__(self, redis_url: str, prefix: str, max_requests: int, window_seconds: int) -> None:
        if redis is None:
            raise RuntimeError("redis package is not installed")

        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.prefix = prefix
        self._client = redis.Redis.from_url(redis_url, decode_responses=True)

    def _key(self, subject: str) -> str:
        return f"{self.prefix}:ratelimit:{subject}"

    def check(self, key: str) -> tuple[bool, dict[str, str]]:
        redis_key = self._key(key)
        current = self._client.incr(redis_key)

        if current == 1:
            self._client.expire(redis_key, self.window_seconds)

        ttl = self._client.ttl(redis_key)
        ttl = ttl if ttl and ttl > 0 else self.window_seconds
        remaining = max(self.max_requests - current, 0)

        headers = {
            "X-RateLimit-Limit": str(self.max_requests),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(ttl),
        }

        if current > self.max_requests:
            headers["Retry-After"] = str(ttl)
            headers["X-RateLimit-Remaining"] = "0"
            return False, headers

        return True, headers


def build_rate_limiter(
    *,
    redis_url: str,
    prefix: str,
    max_requests: int,
    window_seconds: int,
):
    if redis_url and redis is not None:
        try:
            limiter = RedisRateLimiter(
                redis_url=redis_url,
                prefix=prefix,
                max_requests=max_requests,
                window_seconds=window_seconds,
            )
            limiter._client.ping()
            return limiter
        except Exception:
            pass

    return InMemoryRateLimiter(
        max_requests=max_requests,
        window_seconds=window_seconds,
    )
