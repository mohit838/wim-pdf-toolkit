from pathlib import Path
from pypdf import PdfReader, PdfWriter


def rearrange_pages(input_path: Path, output_path: Path, order: list[int]) -> Path:
    """Rearrange pages of a PDF. order is a list of 1-indexed page numbers in the desired sequence."""
    reader = PdfReader(str(input_path))
    total_pages = len(reader.pages)
    writer = PdfWriter()

    if len(order) != total_pages or sorted(order) != list(range(1, total_pages + 1)):
        raise ValueError(f"Page order must include every page exactly once. PDF has {total_pages} pages.")

    for page_num in order:
        if page_num < 1 or page_num > total_pages:
            raise ValueError(f"Page {page_num} out of range. PDF has {total_pages} pages.")
        writer.add_page(reader.pages[page_num - 1])

    with output_path.open("wb") as f:
        writer.write(f)

    return output_path
