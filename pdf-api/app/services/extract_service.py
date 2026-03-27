from pathlib import Path
from pypdf import PdfReader, PdfWriter


def extract_pages(input_path: Path, output_path: Path, pages: list[int]) -> Path:
    """Extract specific pages (1-indexed) from a PDF into a new file."""
    reader = PdfReader(str(input_path))
    total_pages = len(reader.pages)
    writer = PdfWriter()

    for page_num in pages:
        if page_num < 1 or page_num > total_pages:
            raise ValueError(f"Page {page_num} out of range. PDF has {total_pages} pages.")
        writer.add_page(reader.pages[page_num - 1])

    with output_path.open("wb") as f:
        writer.write(f)

    return output_path
