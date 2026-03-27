from pathlib import Path

from pypdf import PdfReader, PdfWriter


def remove_pdf_metadata(input_path: Path, output_path: Path) -> Path:
    """Create a metadata-cleaned PDF copy while preserving page content."""
    reader = PdfReader(str(input_path), strict=False)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    writer.add_metadata({})

    with output_path.open("wb") as file_obj:
        writer.write(file_obj)

    return output_path
