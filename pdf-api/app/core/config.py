import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_root_env_file() -> None:
    env_path = REPO_ROOT / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue

        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]

        os.environ[key] = value


def _is_truthy(value: str | None, *, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _is_running_in_docker() -> bool:
    return os.getenv("DOCKER_CONTAINER") == "true"


_load_root_env_file()

APP_DEV = _is_truthy(os.getenv("APP_DEV"), default=True)
ENV_PREFIX = "DEV" if APP_DEV else "PROD"


def _get_scoped_env(name: str, *, default: str) -> str:
    if _is_running_in_docker():
        return (
            os.getenv(f"{ENV_PREFIX}_DOCKER_{name}")
            or os.getenv(f"{ENV_PREFIX}_{name}")
            or default
        )
    return os.getenv(f"{ENV_PREFIX}_{name}") or default


def _get_scoped_bool_env(name: str, *, default: bool) -> bool:
    return _is_truthy(os.getenv(f"{ENV_PREFIX}_{name}"), default=default)


BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
JOBS_DIR = STORAGE_DIR / "jobs"

MAX_FILE_SIZE_MB = int(_get_scoped_env("MAX_UPLOAD_MB", default="25"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

JOB_TTL_MINUTES = 15
ALLOWED_PDF_EXTENSIONS = {".pdf"}

RATE_LIMIT_WINDOW_SECONDS = int(_get_scoped_env("RATE_LIMIT_WINDOW_SECONDS", default="60"))
RATE_LIMIT_MAX_REQUESTS = int(_get_scoped_env("RATE_LIMIT_MAX_REQUESTS", default="60"))
REDIS_URL = _get_scoped_env("REDIS_URL", default="")
REDIS_PDF_PREFIX = _get_scoped_env("REDIS_PDF_PREFIX", default="pdf")
TRUST_PROXY_HEADERS = _get_scoped_bool_env("TRUST_PROXY", default=not APP_DEV)
INTERNAL_API_TOKEN = _get_scoped_env("INTERNAL_API_TOKEN", default="")
if not INTERNAL_API_TOKEN:
    raise RuntimeError(f"{ENV_PREFIX}_INTERNAL_API_TOKEN must be set.")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in _get_scoped_env(
        "ALLOWED_ORIGINS",
        default="http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
ALLOWED_HOSTS = [
    host.strip()
    for host in _get_scoped_env(
        "ALLOWED_HOSTS",
        default="localhost,127.0.0.1",
    ).split(",")
    if host.strip()
]

JOBS_DIR.mkdir(parents=True, exist_ok=True)
