from pathlib import Path

from pypdf import PdfReader


def pdf_to_text(input_path: Path, output_path: Path) -> Path:
    """Extract text from PDF pages into a UTF-8 .txt file."""
    reader = PdfReader(str(input_path), strict=False)
    chunks: list[str] = []

    for index, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        chunks.append(f"--- Page {index} ---")
        chunks.append(text)
        chunks.append("")

    output_path.write_text("\n".join(chunks).strip() + "\n", encoding="utf-8")
    return output_path
