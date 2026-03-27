from pathlib import Path
from uuid import uuid4

from app.core.config import JOBS_DIR


def create_job_dirs() -> dict[str, Path]:
    job_id = uuid4().hex
    job_root = JOBS_DIR / job_id
    uploads_dir = job_root / "uploads"
    output_dir = job_root / "output"

    uploads_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    return {
        "job_id": job_id,
        "job_root": job_root,
        "uploads_dir": uploads_dir,
        "output_dir": output_dir,
    }