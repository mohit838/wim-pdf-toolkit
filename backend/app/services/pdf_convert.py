import os
import zipfile
from pathlib import Path
import fitz  # PyMuPDF

def pdf_to_jpg(input_path: Path, output_zip_path: Path) -> None:
    doc = fitz.open(str(input_path))
    output_dir = output_zip_path.parent
    temp_img_dir = output_dir / "temp_images"
    temp_img_dir.mkdir(parents=True, exist_ok=True)
    
    image_paths = []
    
    try:
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            img_path = temp_img_dir / f"page_{page_num + 1}.jpg"
            pix.save(str(img_path))
            image_paths.append(img_path)
            
        with zipfile.ZipFile(str(output_zip_path), 'w') as zipf:
            for img_path in image_paths:
                zipf.write(img_path, arcname=img_path.name)
    finally:
        doc.close()
        for img_path in image_paths:
            try:
                img_path.unlink()
            except OSError:
                pass
        try:
            temp_img_dir.rmdir()
        except OSError:
            pass
