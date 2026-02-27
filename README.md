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

## Useful Scripts
```bash
npm run dev
npm run lint
npm run build
```

## Related Docs
- `docs/README.md`
- `docs/frontend-setup.md`
- `docs/WORKSTATION_SETUP_CHECKLIST.md`

