# API Reference

This repo now has two API surfaces:

- the private Python PDF API behind the public frontend
- the CMS API for runtime config and admin actions

## 1. PDF API

Base URL:

- direct local backend: `http://localhost:8000`
- public frontend proxy: `http://localhost:3000/api`

All PDF tool endpoints accept `multipart/form-data`. Processed files are stored temporarily and served via the download endpoint.

---

## Health Check

```
GET /api/health
```

**Response:**

```json
{ "success": true, "message": "API is healthy" }
```

---

## Merge PDF

Combine 2+ PDF files into a single document.

```
POST /api/pdf/merge
```

| Parameter | Type     | Required | Description          |
| --------- | -------- | -------- | -------------------- |
| `files`   | `File[]` | ✅       | At least 2 PDF files |

**Response:**

```json
{
  "success": true,
  "message": "PDFs merged successfully.",
  "job_id": "a1b2c3...",
  "filename": "merged.pdf",
  "download_url": "/api/pdf/download/a1b2c3.../merged.pdf"
}
```

---

## Rotate PDF

Rotate all or specific pages by 90°, 180°, or 270°.

```
POST /api/pdf/rotate
```

| Parameter  | Type     | Required | Description                                   |
| ---------- | -------- | -------- | --------------------------------------------- |
| `file`     | `File`   | ✅       | Single PDF file                               |
| `rotation` | `int`    | ✅       | `90`, `180`, or `270`                         |
| `pages`    | `string` | ❌       | Comma-separated 1-indexed pages (empty = all) |

**Example:**

```bash
curl -F "file=@doc.pdf" -F "rotation=90" -F "pages=1,3" http://localhost:8000/api/pdf/rotate
```

---

## Split PDF

Split a PDF into multiple files by page ranges.

```
POST /api/pdf/split
```

| Parameter | Type     | Required | Description                                    |
| --------- | -------- | -------- | ---------------------------------------------- |
| `file`    | `File`   | ✅       | Single PDF file                                |
| `ranges`  | `string` | ✅       | JSON array of `[start, end]` pairs (1-indexed) |

**Example:**

```bash
curl -F "file=@doc.pdf" -F 'ranges=[[1,3],[4,6]]' http://localhost:8000/api/pdf/split
```

**Response** returns multiple download links:

```json
{
  "success": true,
  "message": "PDF split into 2 file(s).",
  "job_id": "x1y2z3...",
  "files": [
    {
      "filename": "split_part_1.pdf",
      "download_url": "/api/pdf/download/x1y2z3.../split_part_1.pdf"
    },
    {
      "filename": "split_part_2.pdf",
      "download_url": "/api/pdf/download/x1y2z3.../split_part_2.pdf"
    }
  ]
}
```

---

## Extract Pages

Extract specific pages into a new PDF.

```
POST /api/pdf/extract
```

| Parameter | Type     | Required | Description                            |
| --------- | -------- | -------- | -------------------------------------- |
| `file`    | `File`   | ✅       | Single PDF file                        |
| `pages`   | `string` | ✅       | Comma-separated 1-indexed page numbers |

**Example:**

```bash
curl -F "file=@doc.pdf" -F "pages=1,3,5,8" http://localhost:8000/api/pdf/extract
```

---

## Image to PDF

Convert images to a single PDF document.

```
POST /api/pdf/image-to-pdf
```

| Parameter | Type     | Required | Description             |
| --------- | -------- | -------- | ----------------------- |
| `files`   | `File[]` | ✅       | One or more image files |

**Supported formats:** JPG, JPEG, PNG, GIF, BMP, TIFF, WebP

---

## Watermark PDF

Apply a repeating diagonal text watermark to every page.

```
POST /api/pdf/watermark
```

| Parameter   | Type     | Required | Default | Description                          |
| ----------- | -------- | -------- | ------- | ------------------------------------ |
| `file`      | `File`   | ✅       | —       | Single PDF file                      |
| `text`      | `string` | ✅       | —       | Watermark text (e.g. "CONFIDENTIAL") |
| `font_size` | `int`    | ❌       | `48`    | Font size in points                  |
| `opacity`   | `float`  | ❌       | `0.15`  | Opacity (0.01 – 0.5)                 |
| `rotation`  | `int`    | ❌       | `45`    | Text angle in degrees                |

---

## Rearrange Pages

Reorder PDF pages in a custom sequence.

```
POST /api/pdf/rearrange
```

| Parameter | Type     | Required | Description                                             |
| --------- | -------- | -------- | ------------------------------------------------------- |
| `file`    | `File`   | ✅       | Single PDF file                                         |
| `order`   | `string` | ✅       | Comma-separated 1-indexed page numbers in desired order |

**Example:** Reverse a 3-page PDF:

```bash
curl -F "file=@doc.pdf" -F "order=3,2,1" http://localhost:8000/api/pdf/rearrange
```

---

## PDF to DOCX

Convert PDF to editable DOCX with best-effort layout preservation.

```
POST /api/pdf/pdf-to-docx
```

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `file`    | `File` | ✅       | Single PDF file |

**Response includes** `accuracy_estimate` for user expectation.

---

## DOCX to PDF

```
POST /api/pdf/docx-to-pdf
```

| Parameter | Type   | Required | Description      |
| --------- | ------ | -------- | ---------------- |
| `file`    | `File` | ✅       | Single DOCX file |

---

## PDF to JPG

```
POST /api/pdf/to-jpg
```

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `file`    | `File` | ✅       | Single PDF file |

Returns a ZIP file containing one JPG per page.

---

## PDF to Text

```
POST /api/pdf/to-text
```

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `file`    | `File` | ✅       | Single PDF file |

Returns a UTF-8 `.txt` file with per-page sections.

---

## Remove Metadata

```
POST /api/pdf/remove-metadata
```

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `file`    | `File` | ✅       | Single PDF file |

Creates a clean PDF copy with metadata removed.

---

## Add Page Numbers

```
POST /api/pdf/add-page-numbers
```

| Parameter      | Type     | Required | Default         | Description                                                                                   |
| -------------- | -------- | -------- | --------------- | --------------------------------------------------------------------------------------------- |
| `file`         | `File`   | ✅       | —               | Single PDF file                                                                               |
| `start_number` | `int`    | ❌       | `1`             | Starting page number                                                                          |
| `font_size`    | `int`    | ❌       | `11`            | Page number font size                                                                         |
| `position`     | `string` | ❌       | `bottom-center` | One of: `bottom-center`, `bottom-right`, `bottom-left`, `top-center`, `top-right`, `top-left` |

---

## Repair PDF

```
POST /api/pdf/repair
```

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `file`    | `File` | ✅       | Single PDF file |

Attempts structural rewrite/repair for problematic PDFs.

---

## Page Count (Helper)

Returns the total number of pages in a PDF. Used by the frontend for split/extract/rearrange UIs.

```
POST /api/pdf/page-count
```

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `file`    | `File` | ✅       | Single PDF file |

**Response:**

```json
{ "success": true, "page_count": 12 }
```

---

## Download

Retrieve a processed file by job ID and filename.

```
GET /api/pdf/download/{job_id}/{filename}
```

> **Note:** Files expire after **15 minutes** and are cleaned up automatically.

---

## Error Handling

All errors return standard HTTP status codes with a JSON body:

```json
{ "detail": "Please upload at least 2 PDF files." }
```

| Code  | Meaning                        |
| ----- | ------------------------------ |
| `400` | Bad request (validation error) |
| `404` | File not found or expired      |
| `500` | Internal server error          |

---

## Validation & Capacity Guards

To protect CPU-intensive operations, the API applies request limits and returns `400` with clear messages when exceeded.

Current guardrails include:

- merge: max `20` files, max `1200` total pages
- rotate: max `500` pages
- split: max `500` pages, max `100` ranges
- extract: max `500` pages / selected page entries
- rearrange: max `500` pages, full unique page order required
- compress: max `600` pages
- PDF to JPG: max `200` pages
- PDF to DOCX: max `250` pages
- PDF to text: max `1000` pages
- remove metadata: max `1200` pages
- add page numbers: max `800` pages
- repair PDF: max `1200` pages

These limits can be adjusted later based on server sizing and benchmark results.

---

## Accuracy Notes (Approximate Conversions)

Some transformations are not mathematically lossless. For those, the API returns an explicit estimate.

- `POST /api/pdf/pdf-to-docx` includes `accuracy_estimate` in response.
  - Typical range: `70%` to `95%`
  - Higher for digital PDFs, lower for scanned or complex layout files

---

## 2. CMS Published Runtime API

Base URL:

- local: `http://localhost:4100/published/v1`
- production: `https://cms-api.example.com/published/v1`

### Runtime Site Config

```
GET /published/v1/site-runtime-config
```

Returns the published runtime document used by the public frontend for:

- SEO defaults and page metadata
- analytics and verification integrations
- ad placement configuration
- `ads.txt` content

### ads.txt

```
GET /published/v1/ads.txt
```

Returns the published ads.txt lines as plain text.

### Ad Resolution

```
GET /published/v1/ads/resolve?slotId=home_top&scope=home&categories=homepage
```

Returns the first eligible published ad placement for the requested slot/scope/categories combination.

---

## 3. CMS Admin API

Base URL:

- local: `http://localhost:4100/admin/v1`
- production: `https://cms-api.example.com/admin/v1`

### Auth

```
POST /admin/v1/auth/login
GET  /admin/v1/auth/session
POST /admin/v1/auth/logout
```

### Draft Runtime Config

```
GET /admin/v1/runtime-config/draft
PUT /admin/v1/runtime-config/draft
```

### Publish Runtime Config

```
POST /admin/v1/runtime-config/publish
```

Publishing creates a new release and triggers frontend revalidation so SEO/tag/ad updates go live without rebuilding the public frontend.

### Publish Readiness

```
GET /admin/v1/publish/readiness
```

Returns:

- `hasChanges`: whether draft differs from published content
- `canPublish`: whether publish is currently allowed
- `checks[]`: health checks (`database`, `redis`, `frontend_revalidate`) with pass/fail details

### Releases and Audit Logs

```
GET /admin/v1/releases
GET /admin/v1/audit-logs
```

## Current Note

CMS admin/runtime APIs are backed by PostgreSQL and Redis. For production operations, keep environment values secret-managed and use placeholder values only in documentation/examples.
