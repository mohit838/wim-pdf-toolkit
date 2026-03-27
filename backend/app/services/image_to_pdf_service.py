from pathlib import Path

from PIL import Image


def images_to_pdf(image_paths: list[Path], output_path: Path) -> Path:
    """Convert one or more images into a single PDF document."""
    if not image_paths:
        raise ValueError("No images provided.")

    images: list[Image.Image] = []
    try:
        for img_path in image_paths:
            img = Image.open(img_path)
            if img.mode in ("RGBA", "P"):
                converted = img.convert("RGB")
                img.close()
                img = converted
            images.append(img)

        first, *rest = images
        first.save(output_path, "PDF", save_all=True, append_images=rest if rest else [])
    finally:
        for img in images:
            img.close()

    return output_path
