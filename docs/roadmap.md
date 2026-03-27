# Roadmap

## Completed ✅

- [x] **Merge PDF** — combine multiple PDFs into one
- [x] **Rotate PDF** — rotate pages by 90°/180°/270°
- [x] **Split PDF** — split by page ranges
- [x] **Extract Pages** — select and export specific pages
- [x] **Image to PDF** — convert images to PDF (JPG, PNG, GIF, BMP, TIFF, WebP)
- [x] **Watermark PDF** — apply diagonal text watermark with custom font size, opacity, angle
- [x] **Rearrange Pages** — drag-and-drop page reordering
- [x] **Compress / protect / unlock / DOCX/PDF/image conversions**
- [x] **PDF to text / metadata cleanup / page numbering / repair endpoints (backend)**
- [x] **Config-driven public UI** — site copy and SEO bootstrapped from JSON
- [x] **Public frontend runtime config fetch** — SEO, analytics tags, verification tags, ads, and `ads.txt` can change without rebuilding the frontend
- [x] **CMS foundation** — `cms-api/` and `cms-web/`
- [x] **Single root deploy layer** — shared env, compose files, and Jenkins pipeline for the four-app stack
- [x] **Root Makefile** — one-command local dev runner for PDF site and CMS services

---

## Planned 🚧

### CMS Hardening

- [x] **Move CMS persistence to PostgreSQL**
- [x] **Use Redis for sessions/cache/queues**
- [ ] **Role editor and module/action permission management UI**
- [ ] **2FA / stronger CMS auth flow**
- [ ] **Structured traffic reporting dashboards**
- [ ] **Guide/legal/content editing UI beyond raw JSON**

### Public Site Growth

- [ ] **Legal/trust pages fully managed from CMS**
- [ ] **Guide and FAQ content for AdSense readiness**
- [ ] **Slot-aware custom ad inventory management**
- [ ] **Consent-aware analytics/ad toggles**
- [ ] **Tool-page ad policy review and selective enablement**

### PDF Platform

- [ ] **Page preview thumbnails**
- [ ] **Batch ZIP download for split outputs**
- [ ] **Progress feedback for long-running operations**
- [ ] **Optional job history**
- [ ] **Internationalization**

### Ops

- [ ] **Real CMS worker jobs**
- [ ] **Production monitoring/metrics**
- [ ] **Automated CMS backup/export flow**
- [ ] **Concurrency benchmark + capacity envelope (100/500 active-user targets)**
