from pathlib import Path

from pypdf import PdfReader, PdfWriter


def protect_pdf(input_path: Path, output_path: Path, password: str) -> None:
    if not password.strip():
        raise ValueError("Password is required.")

    reader = PdfReader(str(input_path))
    writer = PdfWriter()
    writer.append_pages_from_reader(reader)
    writer.encrypt(password)
    with output_path.open("wb") as file_obj:
        writer.write(file_obj)


def unlock_pdf(input_path: Path, output_path: Path, password: str) -> None:
    if not password.strip():
        raise ValueError("Password is required.")

    reader = PdfReader(str(input_path))
    if reader.is_encrypted:
        if not reader.decrypt(password):
            raise ValueError("Incorrect password or unable to decrypt.")

    writer = PdfWriter()
    writer.append_pages_from_reader(reader)
    with output_path.open("wb") as file_obj:
        writer.write(file_obj)
