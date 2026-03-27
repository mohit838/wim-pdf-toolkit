from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.health import router as health_router
from app.api.routes.pdf import router as pdf_router
from app.core.config import (
    ALLOWED_HOSTS,
    ALLOWED_ORIGINS,
    INTERNAL_API_TOKEN,
    REDIS_PDF_PREFIX,
    REDIS_URL,
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS,
    TRUST_PROXY_HEADERS,
)
from app.utils.cleanup import cleanup_expired_jobs
from app.utils.rate_limiter import build_rate_limiter

app = FastAPI(title="PDF Toolkit API", version="0.1.0")

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=ALLOWED_HOSTS,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rate_limiter = build_rate_limiter(
    redis_url=REDIS_URL,
    prefix=REDIS_PDF_PREFIX,
    max_requests=RATE_LIMIT_MAX_REQUESTS,
    window_seconds=RATE_LIMIT_WINDOW_SECONDS,
)

HEALTH_PATHS = {"/api/health", "/api/healthz"}


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if TRUST_PROXY_HEADERS and forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    cleanup_expired_jobs()

    if INTERNAL_API_TOKEN and request.url.path not in HEALTH_PATHS:
        if request.headers.get("x-internal-api-token") != INTERNAL_API_TOKEN:
            return JSONResponse(
                status_code=403,
                content={"detail": "Direct backend access is not allowed."},
            )

    if request.url.path not in HEALTH_PATHS:
        client_ip = _get_client_ip(request)
        allowed, rate_limit_headers = rate_limiter.check(client_ip)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers=rate_limit_headers,
            )
    else:
        rate_limit_headers = {}

    response = await call_next(request)
    for header_name, header_value in rate_limit_headers.items():
        response.headers[header_name] = header_value
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


app.include_router(health_router)
app.include_router(pdf_router)
