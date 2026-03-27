from pathlib import Path
from pypdf import PdfReader, PdfWriter


def split_pdf(input_path: Path, output_dir: Path, ranges: list[tuple[int, int]]) -> list[Path]:
    """Split a PDF into multiple files based on page ranges (1-indexed, inclusive)."""
    reader = PdfReader(str(input_path))
    total_pages = len(reader.pages)
    output_paths: list[Path] = []

    for idx, (start, end) in enumerate(ranges, 1):
        if start < 1 or end > total_pages or start > end:
            raise ValueError(f"Invalid range ({start}-{end}). PDF has {total_pages} pages.")

        writer = PdfWriter()
        for page_num in range(start - 1, end):
            writer.add_page(reader.pages[page_num])

        out_path = output_dir / f"split_part_{idx}.pdf"
        with out_path.open("wb") as f:
            writer.write(f)
        output_paths.append(out_path)

    return output_paths
