from pathlib import Path
from pypdf import PdfReader, PdfWriter


def rotate_pdf(input_path: Path, output_path: Path, rotation: int, pages: list[int] | None = None) -> Path:
    """Rotate pages in a PDF. rotation must be 90, 180, or 270. pages is 0-indexed; None = all."""
    reader = PdfReader(str(input_path))
    total_pages = len(reader.pages)
    writer = PdfWriter()
    page_set: set[int] | None = None

    if pages is not None:
        invalid_pages = sorted({page for page in pages if page < 0 or page >= total_pages})
        if invalid_pages:
            raise ValueError(f"Page {invalid_pages[0] + 1} out of range. PDF has {total_pages} pages.")
        page_set = set(pages)

    for i, page in enumerate(reader.pages):
        if page_set is None or i in page_set:
            page.rotate(rotation)
        writer.add_page(page)

    with output_path.open("wb") as f:
        writer.write(f)

    return output_path
