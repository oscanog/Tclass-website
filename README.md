# TClass Frontend (Next.js 16)

Frontend portal for TClass with student, faculty, and admin modules.

## Stack
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- `apiFetch` wrapper for Laravel API

## Quick Start
```bash
npm install
npm run dev
```
Frontend: `http://localhost:3000`

## Environment
Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## Current UI Architecture
- Shared portal shell primitives:
  - `components/shared/portal-shell.tsx`
  - `components/shared/global-search-input.tsx`
- Role pages (student/faculty/admin) consume shared shell/search UI and inject role-specific nav/content logic.
- Dialog close behavior now supports opt-out via:
  - `components/ui/dialog.tsx` (`hideCloseButton`)

## Key Modules (Current)
- Student portal
  - Enrollment (curriculum + offering driven)
  - Enrolled Subjects (dynamic)
  - Enrollment History (dynamic)
  - Class Schedule (dynamic, offering-based)
- Admin portal
  - Enrollment approvals
  - Curriculum management (upload, activate, view subjects)
  - Class Scheduling (filter by period/course/year/section)
  - Period advance button (no terminal required)

## Class Scheduling Behavior
- Subject rows are loaded from curriculum-synced `courses` by selected:
  - Period + Course + Year
- Existing offerings are overlaid if they exist.
- If offering does not exist yet, row still appears and can be scheduled.
- Section in row is display-only and follows top section filter.
- Past periods are view-only via `View Past Records`.

## Health Check
- `npx tsc --noEmit` currently reports two known type errors:
  - `app/(faculty-admin)/admin/page.tsx`
  - `app/student/_components/student-sections.tsx`
- Both are caused by `new Blob([pdfBytes])` where `pdfBytes` typing resolves to `Uint8Array<ArrayBufferLike>`.

## Useful Scripts
```bash
npm run dev
npm run lint
npm run build
npx tsc --noEmit
```

## Related Docs
- `docs/README.md`
- `docs/frontend-setup.md`
- `docs/WORKSTATION_SETUP_CHECKLIST.md`
- `docs/REVIEW_2026-03-09.md`

