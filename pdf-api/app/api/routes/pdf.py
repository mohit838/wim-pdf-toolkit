import json
import shutil
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pypdf import PdfReader

from app.core.config import JOBS_DIR
from app.services.merge_service import merge_pdfs
from app.services.rotate_service import rotate_pdf
from app.services.split_service import split_pdf
from app.services.extract_service import extract_pages
from app.services.image_to_pdf_service import images_to_pdf
from app.services.watermark_service import watermark_pdf
from app.services.rearrange_service import rearrange_pages
from app.services.pdf_security import protect_pdf, unlock_pdf
from app.services.pdf_optimize import compress_pdf
from app.services.pdf_convert import pdf_to_jpg
from app.services.pdf_metadata_service import remove_pdf_metadata
from app.services.pdf_page_numbers_service import add_page_numbers
from app.services.pdf_repair_service import repair_pdf
from app.services.pdf_to_text_service import pdf_to_text
from app.utils.file_handler import (
    build_unique_upload_path,
    ensure_pdf_filename,
    save_upload_file,
    validate_docx_file,
    validate_image_file,
    validate_pdf_file,
)
from app.utils.job_manager import create_job_dirs

router = APIRouter(prefix="/api/pdf", tags=["PDF"])

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"}
MAX_MERGE_FILES = 20
MAX_MERGE_TOTAL_PAGES = 1200
MAX_ROTATE_PAGES = 500
MAX_SPLIT_PAGES = 500
MAX_SPLIT_RANGES = 100
MAX_EXTRACT_PAGES = 500
MAX_REARRANGE_PAGES = 500
MAX_COMPRESS_PAGES = 600
MAX_PDF_TO_JPG_PAGES = 200
MAX_PDF_TO_DOCX_PAGES = 250
MAX_PDF_TO_TEXT_PAGES = 1000
MAX_REMOVE_METADATA_PAGES = 1200
MAX_ADD_PAGE_NUMBERS_PAGES = 800
MAX_REPAIR_PAGES = 1200

PDF_TO_DOCX_ACCURACY_ESTIMATE = {
    "min_percent": 70,
    "max_percent": 95,
    "note": "Digital PDFs are usually higher; scanned/complex-layout files are lower without OCR tuning.",
}


def _parse_split_ranges(ranges: str) -> list[tuple[int, int]]:
    try:
        parsed_ranges = json.loads(ranges)
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid ranges format. Use JSON: [[1,3],[4,6]]") from exc

    if not isinstance(parsed_ranges, list) or not parsed_ranges:
        raise ValueError("Please provide at least one page range.")

    normalized_ranges: list[tuple[int, int]] = []
    for index, item in enumerate(parsed_ranges, start=1):
        if not isinstance(item, (list, tuple)) or len(item) != 2:
            raise ValueError(f"Range {index} must contain exactly two numbers.")

        start, end = item
        if not isinstance(start, int) or not isinstance(end, int):
            raise ValueError(f"Range {index} must contain integer page numbers.")

        normalized_ranges.append((start, end))

    return normalized_ranges


def _read_pdf_page_count(path: Path, *, allow_encrypted: bool = False) -> int:
    validate_pdf_file(path, allow_encrypted=allow_encrypted)
    reader = PdfReader(str(path))
    return len(reader.pages)


def _ensure_max_pages(tool_name: str, page_count: int, max_pages: int) -> None:
    if page_count > max_pages:
        raise ValueError(
            f"{tool_name} supports up to {max_pages} pages per request. "
            f"Your file has {page_count} pages."
        )


def _ensure_pages_in_bounds(pages: list[int], page_count: int, field_name: str) -> None:
    for page in pages:
        if page < 1 or page > page_count:
            raise ValueError(f"{field_name} contains page {page}, but valid pages are 1-{page_count}.")


# ─────────────────── MERGE ───────────────────
@router.post("/merge")
async def merge_pdf_endpoint(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least 2 PDF files.")
    if len(files) > MAX_MERGE_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Merge supports up to {MAX_MERGE_FILES} files per request.",
        )

    job = create_job_dirs()
    saved_paths: list[Path] = []
    total_pages = 0

    try:
        for index, upload_file in enumerate(files, start=1):
            safe_name = ensure_pdf_filename(upload_file.filename or "")
            save_path = build_unique_upload_path(job["uploads_dir"], safe_name, prefix=f"{index:03d}")
            await save_upload_file(upload_file, save_path)
            page_count = _read_pdf_page_count(save_path)
            total_pages += page_count
            saved_paths.append(save_path)

        _ensure_max_pages("Merge", total_pages, MAX_MERGE_TOTAL_PAGES)

        output_path = job["output_dir"] / "merged.pdf"
        merge_pdfs(saved_paths, output_path)

        return {
            "success": True,
            "message": "PDFs merged successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Merge failed: {str(exc)}") from exc


# ─────────────────── ROTATE ───────────────────
@router.post("/rotate")
async def rotate_pdf_endpoint(
    file: UploadFile = File(...),
    rotation: int = Form(90),
    pages: str = Form(""),
):
    """Rotate pages. rotation: 90|180|270. pages: comma-separated 1-indexed or empty for all."""
    if rotation not in (90, 180, 270):
        raise HTTPException(status_code=400, detail="Rotation must be 90, 180, or 270.")

    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("Rotate", page_count, MAX_ROTATE_PAGES)

        page_list = None
        if pages.strip():
            selected_pages = [int(p.strip()) for p in pages.split(",") if p.strip()]
            _ensure_pages_in_bounds(selected_pages, page_count, "pages")
            page_list = [page - 1 for page in selected_pages]

        output_path = job["output_dir"] / "rotated.pdf"
        rotate_pdf(save_path, output_path, rotation, page_list)

        return {
            "success": True,
            "message": f"PDF rotated {rotation}° successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Rotate failed: {str(exc)}") from exc


# ─────────────────── SPLIT ───────────────────
@router.post("/split")
async def split_pdf_endpoint(
    file: UploadFile = File(...),
    ranges: str = Form(...),
):
    """Split PDF. ranges: JSON array of [start, end] pairs (1-indexed), e.g. '[[1,3],[4,6]]'."""
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("Split", page_count, MAX_SPLIT_PAGES)

        range_tuples = _parse_split_ranges(ranges)
        if len(range_tuples) > MAX_SPLIT_RANGES:
            raise ValueError(f"Split supports up to {MAX_SPLIT_RANGES} ranges per request.")
        for start, end in range_tuples:
            if start < 1 or end < 1:
                raise ValueError("Page ranges must start at page 1 or higher.")
            if start > end:
                raise ValueError(f"Invalid range [{start}, {end}]. Start must be <= end.")
            if end > page_count:
                raise ValueError(f"Range [{start}, {end}] exceeds total pages ({page_count}).")

        output_paths = split_pdf(save_path, job["output_dir"], range_tuples)

        downloads = [
            {
                "filename": p.name,
                "download_url": f"/api/pdf/download/{job['job_id']}/{p.name}",
            }
            for p in output_paths
        ]

        return {
            "success": True,
            "message": f"PDF split into {len(output_paths)} file(s).",
            "job_id": job["job_id"],
            "files": downloads,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Split failed: {str(exc)}") from exc


# ─────────────────── EXTRACT PAGES ───────────────────
@router.post("/extract")
async def extract_pages_endpoint(
    file: UploadFile = File(...),
    pages: str = Form(...),
):
    """Extract pages. pages: comma-separated 1-indexed page numbers, e.g. '1,3,5'."""
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("Extract", page_count, MAX_EXTRACT_PAGES)

        page_list = [int(p.strip()) for p in pages.split(",") if p.strip()]
        if not page_list:
            raise ValueError("No pages specified.")
        if len(page_list) > MAX_EXTRACT_PAGES:
            raise ValueError(f"Extract supports up to {MAX_EXTRACT_PAGES} selected pages per request.")
        _ensure_pages_in_bounds(page_list, page_count, "pages")

        output_path = job["output_dir"] / "extracted.pdf"
        extract_pages(save_path, output_path, page_list)

        return {
            "success": True,
            "message": f"Extracted {len(page_list)} page(s) successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Extract failed: {str(exc)}") from exc


# ─────────────────── IMAGE TO PDF ───────────────────
@router.post("/image-to-pdf")
async def image_to_pdf_endpoint(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one image.")

    job = create_job_dirs()
    saved_paths: list[Path] = []

    try:
        for index, upload_file in enumerate(files, start=1):
            fname = Path(upload_file.filename or "image.jpg").name
            ext = Path(fname).suffix.lower()
            if ext not in ALLOWED_IMAGE_EXTS:
                raise ValueError(f"Unsupported image type '{ext}'. Allowed: {', '.join(ALLOWED_IMAGE_EXTS)}")

            save_path = build_unique_upload_path(job["uploads_dir"], fname, prefix=f"{index:03d}")
            await save_upload_file(upload_file, save_path)
            validate_image_file(save_path)
            saved_paths.append(save_path)

        output_path = job["output_dir"] / "images.pdf"
        images_to_pdf(saved_paths, output_path)

        return {
            "success": True,
            "message": f"Converted {len(saved_paths)} image(s) to PDF.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image to PDF failed: {str(exc)}") from exc


# ─────────────────── WATERMARK ───────────────────
@router.post("/watermark")
async def watermark_pdf_endpoint(
    file: UploadFile = File(...),
    text: str = Form(...),
    font_size: int = Form(48),
    opacity: float = Form(0.15),
    rotation: int = Form(45),
):
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        validate_pdf_file(save_path)

        output_path = job["output_dir"] / "watermarked.pdf"
        watermark_pdf(save_path, output_path, text, font_size, opacity, rotation)

        return {
            "success": True,
            "message": "Watermark applied successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Watermark failed: {str(exc)}") from exc


# ─────────────────── REARRANGE ───────────────────
@router.post("/rearrange")
async def rearrange_pdf_endpoint(
    file: UploadFile = File(...),
    order: str = Form(...),
):
    """Rearrange pages. order: comma-separated 1-indexed page numbers in desired order, e.g. '3,1,2'."""
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("Rearrange", page_count, MAX_REARRANGE_PAGES)

        order_list = [int(p.strip()) for p in order.split(",") if p.strip()]
        if not order_list:
            raise ValueError("No page order specified.")
        _ensure_pages_in_bounds(order_list, page_count, "order")
        if len(order_list) != page_count:
            raise ValueError(
                f"Order must include each page exactly once. Expected {page_count} entries, got {len(order_list)}."
            )
        if len(set(order_list)) != len(order_list):
            raise ValueError("Order contains duplicate page numbers.")

        output_path = job["output_dir"] / "rearranged.pdf"
        rearrange_pages(save_path, output_path, order_list)

        return {
            "success": True,
            "message": f"Pages rearranged successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Rearrange failed: {str(exc)}") from exc


# ─────────────────── DOCX TO PDF ───────────────────
@router.post("/docx-to-pdf")
async def docx_to_pdf_endpoint(file: UploadFile = File(...)):
    """Convert a DOCX file to PDF."""
    job = create_job_dirs()
    try:
        fname = Path(file.filename or "document.docx").name
        if not fname.lower().endswith(".docx"):
            raise ValueError("Please upload a .docx file.")

        save_path = job["uploads_dir"] / fname
        await save_upload_file(file, save_path)
        validate_docx_file(save_path)

        from app.services.docx_to_pdf_service import docx_to_pdf
        output_path = docx_to_pdf(save_path, job["output_dir"])

        return {
            "success": True,
            "message": "DOCX converted to PDF successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"DOCX to PDF failed: {str(exc)}") from exc


# ─────────────────── PDF TO DOCX ───────────────────
@router.post("/pdf-to-docx")
async def pdf_to_docx_endpoint(file: UploadFile = File(...)):
    """Convert a PDF to DOCX using layout-preserving conversion when available."""
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("PDF to DOCX", page_count, MAX_PDF_TO_DOCX_PAGES)

        from app.services.pdf_to_docx_service import pdf_to_docx
        output_path = job["output_dir"] / (Path(safe_name).stem + ".docx")
        pdf_to_docx(save_path, output_path)

        return {
            "success": True,
            "message": "PDF converted to DOCX successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
            "accuracy_estimate": PDF_TO_DOCX_ACCURACY_ESTIMATE,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF to DOCX failed: {str(exc)}") from exc


# ─────────────────── PROTECT PDF ───────────────────
@router.post("/protect")
async def protect_pdf_endpoint(
    file: UploadFile = File(...),
    password: str = Form(...),
):
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("Compress", page_count, MAX_COMPRESS_PAGES)

        output_path = job["output_dir"] / "protected.pdf"
        protect_pdf(save_path, output_path, password)

        return {
            "success": True,
            "message": "PDF protected successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Protect failed: {str(exc)}") from exc


# ─────────────────── UNLOCK PDF ───────────────────
@router.post("/unlock")
async def unlock_pdf_endpoint(
    file: UploadFile = File(...),
    password: str = Form(...),
):
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        validate_pdf_file(save_path, allow_encrypted=True)

        output_path = job["output_dir"] / "unlocked.pdf"
        unlock_pdf(save_path, output_path, password)

        return {
            "success": True,
            "message": "PDF unlocked successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unlock failed: {str(exc)}") from exc


# ─────────────────── COMPRESS PDF ───────────────────
@router.post("/compress")
async def compress_pdf_endpoint(file: UploadFile = File(...)):
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("PDF to JPG", page_count, MAX_PDF_TO_JPG_PAGES)

        output_path = job["output_dir"] / "compressed.pdf"
        compress_pdf(save_path, output_path)

        return {
            "success": True,
            "message": "PDF compressed successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Compress failed: {str(exc)}") from exc


# ─────────────────── PDF TO JPG ───────────────────
@router.post("/to-jpg")
async def pdf_to_jpg_endpoint(file: UploadFile = File(...)):
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        validate_pdf_file(save_path)

        zip_name = Path(safe_name).stem + "_images.zip"
        output_path = job["output_dir"] / zip_name
        pdf_to_jpg(save_path, output_path)

        return {
            "success": True,
            "message": "PDF converted to JPGs successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF to JPG failed: {str(exc)}") from exc


# ─────────────────── PDF TO TEXT ───────────────────
@router.post("/to-text")
async def pdf_to_text_endpoint(file: UploadFile = File(...)):
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("PDF to Text", page_count, MAX_PDF_TO_TEXT_PAGES)

        output_path = job["output_dir"] / (Path(safe_name).stem + ".txt")
        pdf_to_text(save_path, output_path)

        return {
            "success": True,
            "message": "PDF converted to text successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF to text failed: {str(exc)}") from exc


# ─────────────────── REMOVE METADATA ───────────────────
@router.post("/remove-metadata")
async def remove_metadata_endpoint(file: UploadFile = File(...)):
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("Remove metadata", page_count, MAX_REMOVE_METADATA_PAGES)

        output_path = job["output_dir"] / "metadata-removed.pdf"
        remove_pdf_metadata(save_path, output_path)

        return {
            "success": True,
            "message": "PDF metadata removed successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Remove metadata failed: {str(exc)}") from exc


# ─────────────────── ADD PAGE NUMBERS ───────────────────
@router.post("/add-page-numbers")
async def add_page_numbers_endpoint(
    file: UploadFile = File(...),
    start_number: int = Form(1),
    font_size: int = Form(11),
    position: str = Form("bottom-center"),
):
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        page_count = _read_pdf_page_count(save_path)
        _ensure_max_pages("Add page numbers", page_count, MAX_ADD_PAGE_NUMBERS_PAGES)

        output_path = job["output_dir"] / "page-numbered.pdf"
        add_page_numbers(
            save_path,
            output_path,
            start_number=start_number,
            font_size=font_size,
            position=position.strip().lower(),
        )

        return {
            "success": True,
            "message": "Page numbers added successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Add page numbers failed: {str(exc)}") from exc


# ─────────────────── REPAIR PDF ───────────────────
@router.post("/repair")
async def repair_pdf_endpoint(file: UploadFile = File(...)):
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)

        try:
            page_count = _read_pdf_page_count(save_path, allow_encrypted=True)
            _ensure_max_pages("Repair PDF", page_count, MAX_REPAIR_PAGES)
        except ValueError:
            # Continue repair attempt for malformed files that fail strict validation.
            pass

        output_path = job["output_dir"] / "repaired.pdf"
        repair_pdf(save_path, output_path)

        return {
            "success": True,
            "message": "PDF repair completed successfully.",
            "job_id": job["job_id"],
            "filename": output_path.name,
            "download_url": f"/api/pdf/download/{job['job_id']}/{output_path.name}",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Repair failed: {str(exc)}") from exc


# ─────────────────── PAGE INFO (helper) ───────────────────
@router.post("/page-count")
async def page_count_endpoint(file: UploadFile = File(...)):
    """Return the number of pages in a PDF (used by frontend for split/extract/rearrange UIs)."""
    job = create_job_dirs()
    try:
        safe_name = ensure_pdf_filename(file.filename or "")
        save_path = job["uploads_dir"] / safe_name
        await save_upload_file(file, save_path)
        count = _read_pdf_page_count(save_path)

        return {"success": True, "page_count": count}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read PDF: {str(exc)}") from exc
    finally:
        shutil.rmtree(job["job_root"], ignore_errors=True)


# ─────────────────── DOWNLOAD ───────────────────
MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".zip": "application/zip",
    ".txt": "text/plain; charset=utf-8",
}


@router.get("/download/{job_id}/{filename}")
def download_file(job_id: str, filename: str):
    file_path = JOBS_DIR / job_id / "output" / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found or expired.")

    ext = Path(filename).suffix.lower()
    media_type = MEDIA_TYPES.get(ext, "application/octet-stream")

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
    )
