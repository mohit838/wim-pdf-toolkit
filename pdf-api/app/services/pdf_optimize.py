from pathlib import Path
import fitz  # PyMuPDF

def compress_pdf(input_path: Path, output_path: Path) -> None:
    doc = fitz.open(str(input_path))
    doc.save(
        str(output_path),
        garbage=4,          # highest level of garbage collection
        deflate=True,       # compress streams
        clean=True          # clean up streams
    )
    doc.close()
