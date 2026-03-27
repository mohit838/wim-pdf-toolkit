from pathlib import Path

import fitz

ALLOWED_PAGE_NUMBER_POSITIONS = {
    "bottom-center",
    "bottom-right",
    "bottom-left",
    "top-center",
    "top-right",
    "top-left",
}


def add_page_numbers(
    input_path: Path,
    output_path: Path,
    *,
    start_number: int = 1,
    font_size: int = 11,
    position: str = "bottom-center",
) -> Path:
    """Add visible page numbers to each PDF page."""
    if start_number < 1:
        raise ValueError("start_number must be at least 1.")
    if font_size < 8 or font_size > 48:
        raise ValueError("font_size must be between 8 and 48.")
    if position not in ALLOWED_PAGE_NUMBER_POSITIONS:
        raise ValueError(
            f"Unsupported position '{position}'. Supported: {', '.join(sorted(ALLOWED_PAGE_NUMBER_POSITIONS))}"
        )

    doc = fitz.open(str(input_path))
    try:
        for index, page in enumerate(doc, start=0):
            label = str(start_number + index)
            rect = page.rect
            margin = 24
            box_height = max(20, font_size * 1.8)

            is_top = position.startswith("top")
            is_bottom = position.startswith("bottom")

            if is_top:
                y0 = margin
                y1 = margin + box_height
            elif is_bottom:
                y0 = rect.height - margin - box_height
                y1 = rect.height - margin
            else:
                y0 = rect.height - margin - box_height
                y1 = rect.height - margin

            if position.endswith("left"):
                x0 = margin
                x1 = min(rect.width - margin, margin + 180)
                align = fitz.TEXT_ALIGN_LEFT
            elif position.endswith("right"):
                x0 = max(margin, rect.width - margin - 180)
                x1 = rect.width - margin
                align = fitz.TEXT_ALIGN_RIGHT
            else:
                x0 = margin
                x1 = rect.width - margin
                align = fitz.TEXT_ALIGN_CENTER

            page.insert_textbox(
                fitz.Rect(x0, y0, x1, y1),
                label,
                fontsize=font_size,
                fontname="helv",
                color=(0, 0, 0),
                align=align,
                overlay=True,
            )

        doc.save(str(output_path), garbage=3, deflate=True, clean=True)
    finally:
        doc.close()

    return output_path
