from pathlib import Path

import fitz
from pypdf import PdfReader, PdfWriter


def repair_pdf(input_path: Path, output_path: Path) -> Path:
    """Attempt structural PDF repair and rewrite.

    Strategy:
    1) pypdf lenient read + rewrite
    2) PyMuPDF clean rewrite fallback
    """
    try:
        reader = PdfReader(str(input_path), strict=False)
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.add_metadata({})
        with output_path.open("wb") as file_obj:
            writer.write(file_obj)
        return output_path
    except Exception:
        pass

    try:
        doc = fitz.open(str(input_path))
        try:
            doc.save(str(output_path), garbage=4, deflate=True, clean=True)
        finally:
            doc.close()
        return output_path
    except Exception as error:
        raise ValueError("Could not repair this PDF. The file may be severely corrupted.") from error
