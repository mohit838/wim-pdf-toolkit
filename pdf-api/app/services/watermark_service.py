from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, DecodedStreamObject, DictionaryObject, FloatObject, NameObject

DEFAULT_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]

BENGALI_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/lohit-bengali/Lohit-Bengali.ttf",
    "/usr/share/fonts/truetype/fonts-beng-extra/Mukti.ttf",
]


def watermark_pdf(
    input_path: Path,
    output_path: Path,
    text: str,
    font_size: int = 48,
    opacity: float = 0.15,
    rotation: int = 45,
) -> Path:
    """Apply a repeating diagonal text watermark to every page of a PDF."""
    text = text.strip()
    if not text:
        raise ValueError("Watermark text is required.")
    if font_size < 1:
        raise ValueError("Font size must be at least 1.")
    if opacity < 0 or opacity > 1:
        raise ValueError("Opacity must be between 0 and 1.")

    reader = PdfReader(str(input_path))
    writer = PdfWriter()
    can_use_builtin_pdf_text = _can_use_builtin_pdf_text(text)

    for page in reader.pages:
        if getattr(page, "rotation", 0):
            page.transfer_rotation_to_content()
        writer.add_page(page)

    if can_use_builtin_pdf_text:
        normalized_opacity = max(0.0, min(opacity, 1.0))

        for page in writer.pages:
            resources = _ensure_page_resources(page)
            font_name = _ensure_font_resource(writer, resources)
            gs_name = _ensure_graphics_state_resource(writer, resources, normalized_opacity)

            width = float(page.mediabox.width)
            height = float(page.mediabox.height)
            watermark_stream = _build_watermark_stream(
                text=text,
                width=width,
                height=height,
                font_size=font_size,
                rotation=rotation,
                font_name=font_name,
                graphics_state_name=gs_name,
            )
            _append_content_stream(writer, page, watermark_stream)
    else:
        overlay_cache: dict[tuple[int, int], bytes] = {}

        for page in writer.pages:
            width = max(int(round(float(page.mediabox.width))), 1)
            height = max(int(round(float(page.mediabox.height))), 1)
            overlay_key = (width, height)
            overlay_pdf = overlay_cache.get(overlay_key)

            if overlay_pdf is None:
                overlay_pdf = _render_overlay_pdf(
                    width=width,
                    height=height,
                    text=text,
                    font_size=font_size,
                    opacity=opacity,
                    rotation=rotation,
                )
                overlay_cache[overlay_key] = overlay_pdf

            overlay_page = PdfReader(BytesIO(overlay_pdf)).pages[0]
            page.merge_page(overlay_page, over=True)

    with output_path.open("wb") as file_obj:
        writer.write(file_obj)

    return output_path


def _render_overlay_pdf(
    *,
    width: int,
    height: int,
    text: str,
    font_size: int,
    opacity: float,
    rotation: int,
) -> bytes:
    overlay = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    tile = _build_watermark_tile(
        text=text,
        font_size=font_size,
        opacity=opacity,
        rotation=rotation,
    )

    step_x = max(tile.width - font_size * 2, 180)
    step_y = max(tile.height - font_size * 2, 140)

    for y in range(-tile.height, height + tile.height, step_y):
        for x in range(-tile.width, width + tile.width, step_x):
            overlay.paste(tile, (x, y), tile)

    buffer = BytesIO()
    overlay.save(buffer, "PDF", resolution=72.0)
    return buffer.getvalue()


def _build_watermark_tile(*, text: str, font_size: int, opacity: float, rotation: int) -> Image.Image:
    font = _load_font(text, font_size)
    bbox = font.getbbox(text)
    left = int(round(bbox[0]))
    top = int(round(bbox[1]))
    right = int(round(bbox[2]))
    bottom = int(round(bbox[3]))
    text_width = max(right - left, font_size)
    text_height = max(bottom - top, font_size)
    padding = max(font_size * 2, 48)
    tile_width = text_width + padding * 2
    tile_height = text_height + padding * 2

    tile = Image.new("RGBA", (tile_width, tile_height), (255, 255, 255, 0))
    draw = ImageDraw.Draw(tile)
    draw.text(
        (padding - left, padding - top),
        text,
        font=font,
        fill=(0, 0, 0, max(1, int(round(opacity * 255)))),
    )

    return tile.rotate(rotation, expand=True, resample=Image.Resampling.BICUBIC)


def _load_font(text: str, font_size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for font_path in _font_candidates(text):
        try:
            return ImageFont.truetype(font_path, size=font_size)
        except OSError:
            continue
    return ImageFont.load_default()


def _font_candidates(text: str) -> list[str]:
    if any("\u0980" <= char <= "\u09FF" for char in text):
        return [*BENGALI_FONT_CANDIDATES, *DEFAULT_FONT_CANDIDATES]
    return DEFAULT_FONT_CANDIDATES


def _can_use_builtin_pdf_text(text: str) -> bool:
    try:
        text.encode("latin-1")
    except UnicodeEncodeError:
        return False
    return True


def _ensure_page_resources(page) -> DictionaryObject:
    resources = page.get("/Resources")
    if resources is None:
        resources = DictionaryObject()
        page[NameObject("/Resources")] = resources
    else:
        resources = resources.get_object()

    return resources


def _ensure_font_resource(writer: PdfWriter, resources: DictionaryObject) -> str:
    fonts = resources.get("/Font")
    if fonts is None:
        fonts = DictionaryObject()
        resources[NameObject("/Font")] = fonts
    else:
        fonts = fonts.get_object()

    font_key = NameObject("/FWM")
    if font_key not in fonts:
        font = DictionaryObject()
        font[NameObject("/Type")] = NameObject("/Font")
        font[NameObject("/Subtype")] = NameObject("/Type1")
        font[NameObject("/BaseFont")] = NameObject("/Helvetica")
        font[NameObject("/Encoding")] = NameObject("/WinAnsiEncoding")
        fonts[font_key] = writer._add_object(font)

    return font_key


def _ensure_graphics_state_resource(writer: PdfWriter, resources: DictionaryObject, opacity: float) -> str:
    ext_gstate = resources.get("/ExtGState")
    if ext_gstate is None:
        ext_gstate = DictionaryObject()
        resources[NameObject("/ExtGState")] = ext_gstate
    else:
        ext_gstate = ext_gstate.get_object()

    gstate_key = NameObject("/GSWM")
    if gstate_key not in ext_gstate:
        gstate = DictionaryObject()
        gstate[NameObject("/Type")] = NameObject("/ExtGState")
        gstate[NameObject("/ca")] = FloatObject(opacity)
        gstate[NameObject("/CA")] = FloatObject(opacity)
        ext_gstate[gstate_key] = writer._add_object(gstate)

    return gstate_key


def _append_content_stream(writer: PdfWriter, page, content: str) -> None:
    stream = DecodedStreamObject()
    stream.set_data(content.encode("latin-1"))
    stream_ref = writer._add_object(stream)

    contents = page.get("/Contents")
    if contents is None:
        page[NameObject("/Contents")] = stream_ref
        return

    if isinstance(contents, ArrayObject):
        contents.append(stream_ref)
        return

    page[NameObject("/Contents")] = ArrayObject([contents, stream_ref])


def _build_watermark_stream(
    *,
    text: str,
    width: float,
    height: float,
    font_size: int,
    rotation: int,
    font_name: str,
    graphics_state_name: str,
) -> str:
    import math

    escaped_text = _escape_pdf_string(text)
    radians = math.radians(rotation)
    cos_r = math.cos(radians)
    sin_r = math.sin(radians)

    step_x = max(font_size * 7, 220)
    step_y = max(font_size * 4, 160)

    lines: list[str] = [
        "q",
        f"{graphics_state_name} gs",
        "0 g",
        "BT",
        f"{font_name} {font_size} Tf",
    ]

    y = -step_y
    while y < height + step_y:
        x = -step_x
        while x < width + step_x:
            lines.append(f"{cos_r:.5f} {sin_r:.5f} {-sin_r:.5f} {cos_r:.5f} {x:.2f} {y:.2f} Tm")
            lines.append(f"({escaped_text}) Tj")
            x += step_x
        y += step_y

    lines.extend(["ET", "Q"])
    return "\n".join(lines)


def _escape_pdf_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
