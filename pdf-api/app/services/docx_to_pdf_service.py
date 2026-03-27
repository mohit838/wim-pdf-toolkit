import subprocess
from pathlib import Path


def docx_to_pdf(input_path: Path, output_dir: Path) -> Path:
    """Convert a DOCX file to PDF using LibreOffice headless mode."""
    try:
        subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                str(output_dir),
                str(input_path),
            ],
            check=True,
            capture_output=True,
            timeout=120,
        )
    except FileNotFoundError:
        raise RuntimeError("LibreOffice is not installed. Required for DOCX→PDF conversion.")
    except subprocess.TimeoutExpired:
        raise RuntimeError("Conversion timed out. The document may be too large.")
    except subprocess.CalledProcessError as e:
        stderr = (e.stderr or b"").decode("utf-8", errors="replace").strip()
        message = stderr or "LibreOffice conversion failed."
        raise RuntimeError(f"LibreOffice conversion failed: {message}")

    # LibreOffice names the output file with the same stem but .pdf extension
    expected_output = output_dir / (input_path.stem + ".pdf")
    if not expected_output.exists():
        raise RuntimeError("Conversion produced no output file.")

    return expected_output
