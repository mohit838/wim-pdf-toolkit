from datetime import datetime, timedelta, timezone
import shutil

from app.core.config import JOBS_DIR, JOB_TTL_MINUTES


def cleanup_expired_jobs() -> None:
    if not JOBS_DIR.exists():
        return

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=JOB_TTL_MINUTES)

    for job_dir in JOBS_DIR.iterdir():
        if not job_dir.is_dir():
            continue

        modified_time = datetime.fromtimestamp(job_dir.stat().st_mtime, tz=timezone.utc)

        if modified_time < cutoff:
            shutil.rmtree(job_dir, ignore_errors=True)