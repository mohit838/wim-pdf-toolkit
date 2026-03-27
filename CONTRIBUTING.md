# Contributing

Thanks for contributing to PDF Toolkit.

## Contact

For coordination, questions, or private reports, email `connect@mohitul-islam.com`.

## Before You Start

- Read the project overview in `README.md`.
- Keep changes focused. Avoid mixing feature work, refactors, and documentation cleanup in one PR.
- If you change API behavior, update the docs in `docs/` and any affected frontend copy in `frontend/src/`.

## Local Setup

### Backend

From the project root:

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --reload-dir backend --port 8000
```

Or from inside `backend/`:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

## Contribution Expectations

- Prefer small, reviewable pull requests.
- Preserve the existing project structure unless there is a strong reason to change it.
- Keep backend routes thin and put transformation logic in `backend/app/services/`.
- Reuse shared frontend components when possible instead of duplicating page-specific UI.
- Update `README.md`, `docs/api-notes.md`, and `docs/architecture.md` when behavior or setup changes.

## Testing and Verification

There is no formal automated test suite yet. Until one exists:

- Verify backend changes by exercising the affected endpoint locally.
- Verify frontend changes in the browser on both desktop and mobile widths.
- Confirm downloads work end-to-end for any file-processing flow you touch.

## Pull Requests

Include:

- a short summary of what changed
- why the change was needed
- any manual test steps used
- screenshots for UI changes when relevant

## Scope Notes

- `DOCX -> PDF` depends on LibreOffice in headless mode.
- `PDF -> DOCX` is text extraction based and does not preserve full layout fidelity.
