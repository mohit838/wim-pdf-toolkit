from pathlib import Path
from pypdf import PdfReader, PdfWriter


def merge_pdfs(input_paths: list[Path], output_path: Path) -> Path:
    writer = PdfWriter()

    for pdf_path in input_paths:
        reader = PdfReader(str(pdf_path))
        for page in reader.pages:
            writer.add_page(page)

    with output_path.open("wb") as output_file:
        writer.write(output_file)

    return output_path