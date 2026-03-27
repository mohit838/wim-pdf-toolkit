from pathlib import Path

from docx import Document
from docx.shared import Pt
from pypdf import PdfReader


def _sanitize_docx_text(text: str) -> str:
    """Drop invalid XML/UTF-8 characters that can appear in extracted PDF text."""
    cleaned: list[str] = []

    for char in text:
        codepoint = ord(char)

        if 0xD800 <= codepoint <= 0xDFFF:
            continue

        if codepoint in (0x9, 0xA, 0xD) or 0x20 <= codepoint <= 0xD7FF or 0xE000 <= codepoint <= 0xFFFD or 0x10000 <= codepoint <= 0x10FFFF:
            cleaned.append(char)

    return "".join(cleaned)


def _convert_with_pdf2docx(input_path: Path, output_path: Path) -> bool:
    """Best-effort layout-preserving conversion using pdf2docx."""
    try:
        from pdf2docx import Converter
    except Exception:
        return False

    converter = Converter(str(input_path))
    try:
        converter.convert(str(output_path), start=0, end=None)
    finally:
        converter.close()

    return output_path.exists() and output_path.stat().st_size > 0


def _convert_text_fallback(input_path: Path, output_path: Path) -> Path:
    """Fallback conversion: plain text extraction only."""
    reader = PdfReader(str(input_path))
    doc = Document()

    style = doc.styles["Normal"]
    font = style.font
    font.name = "Arial"
    font.size = Pt(11)

    for i, page in enumerate(reader.pages):
        text = _sanitize_docx_text(page.extract_text() or "")

        if i > 0:
            doc.add_page_break()

        lines = text.strip().split("\n")
        if not lines:
            continue
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            para = doc.add_paragraph(stripped)
            para.paragraph_format.space_after = Pt(2)

    doc.save(str(output_path))
    return output_path


def pdf_to_docx(input_path: Path, output_path: Path) -> Path:
    """Convert PDF to DOCX.

    Primary path uses pdf2docx for better layout fidelity (tables, paragraphs,
    and positioning). If unavailable, falls back to text-only extraction.
    """
    if _convert_with_pdf2docx(input_path, output_path):
        return output_path

    return _convert_text_fallback(input_path, output_path)
