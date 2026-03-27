import zipfile
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError
from pypdf import PdfReader

from app.core.config import MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB

CHUNK_SIZE = 1024 * 1024


def build_unique_upload_path(directory: Path, filename: str, prefix: str | None = None) -> Path:
    safe_name = Path(filename).name
    stem = Path(safe_name).stem or "file"
    suffix = Path(safe_name).suffix

    candidate_name = f"{prefix}_{safe_name}" if prefix else safe_name
    candidate_path = directory / candidate_name
    counter = 1

    while candidate_path.exists():
        stem_with_counter = f"{stem}_{counter}"
        candidate_name = f"{prefix}_{stem_with_counter}{suffix}" if prefix else f"{stem_with_counter}{suffix}"
        candidate_path = directory / candidate_name
        counter += 1

    return candidate_path


def ensure_pdf_filename(filename: str) -> str:
    if not filename:
        raise ValueError("Filename is missing.")

    if not filename.lower().endswith(".pdf"):
        raise ValueError(f"Invalid file type for '{filename}'. Only PDF files are allowed.")

    return Path(filename).name


def validate_pdf_file(path: Path, *, allow_encrypted: bool = False) -> None:
    try:
        reader = PdfReader(str(path))
        if reader.is_encrypted:
            if not allow_encrypted:
                raise ValueError("Encrypted PDF files are not supported for this operation.")
            return

        _ = len(reader.pages)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Invalid or corrupted PDF file.") from exc


def validate_image_file(path: Path) -> None:
    try:
        with Image.open(path) as image:
            image.verify()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("Invalid or corrupted image file.") from exc


def validate_docx_file(path: Path) -> None:
    try:
        if not zipfile.is_zipfile(path):
            raise ValueError("Invalid or corrupted DOCX file.")

        with zipfile.ZipFile(path) as archive:
            members = set(archive.namelist())
    except zipfile.BadZipFile as exc:
        raise ValueError("Invalid or corrupted DOCX file.") from exc

    if not {"[Content_Types].xml", "word/document.xml"}.issubset(members):
        raise ValueError("Invalid or corrupted DOCX file.")


async def save_upload_file(upload_file: UploadFile, destination: Path) -> Path:
    total_bytes = 0

    try:
        with destination.open("wb") as buffer:
            while True:
                chunk = await upload_file.read(CHUNK_SIZE)
                if not chunk:
                    break

                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE_BYTES:
                    raise ValueError(f"File exceeds the {MAX_FILE_SIZE_MB} MB upload limit.")

                buffer.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await upload_file.close()

    return destination
