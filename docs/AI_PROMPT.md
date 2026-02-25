# TClass AI Prompt (Current Project Context)

Use this file when starting a new AI session for this project.

This version is updated for the current codebase:
- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- Backend: Laravel 12 + PHP 8.2 + MySQL + Sanctum

## Quick Copy/Paste Context

```text
I am working on the TClass system with two repos:

FRONTEND
- Repo: tclass-v1-frontend
- Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- API base env: NEXT_PUBLIC_API_BASE_URL (usually http://127.0.0.1:8000/api)
- Auth cookies: tclass_token, tclass_role
- Roles: student, faculty, admin

BACKEND
- Repo: tclass-v1-backend
- Stack: Laravel 12, PHP 8.2+, MySQL/MariaDB
- Auth: Laravel Sanctum token auth (Bearer token used by frontend)
- API root: http://127.0.0.1:8000/api

Important frontend files:
- lib/api-client.ts (apiFetch wrapper; returns parsed JSON payload, not Response)
- lib/auth.ts (role helpers, protected path checks)
- app/login/page.tsx (login flow)
- app/vocational/page.tsx (vocational form)
- app/diploma/page.tsx (diploma form)
- components/ui/* (shared UI)

Important backend files:
- routes/api.php (API routes)
- app/Http/Controllers/Api/AuthController.php
- app/Http/Controllers/Api/AdmissionController.php
- app/Http/Controllers/Api/ContactController.php
- app/Http/Controllers/Api/StudentEnrollmentController.php
- app/Http/Controllers/Api/AdminEnrollmentController.php

Current API endpoints used by frontend include:
- POST /auth/login
- POST /contact/submit
- POST /admission/submit
- GET/POST/PATCH /student/*
- GET/POST/PATCH /admin/*

Constraints when editing:
- Keep dark mode support
- Keep mobile responsiveness
- Reuse existing UI components/patterns
- Do not add new libraries unless necessary
- Match existing TypeScript/Tailwind style
```

## Prompt Templates

### 1. Fix UI issue

```text
Fix the UI issue in [file/path]:
- Keep dark mode support
- Keep mobile responsiveness
- Reuse existing components from components/ui
- Do not change backend API contracts
- Run lint on touched files
```

### 2. Add frontend API integration

```text
Add frontend integration for backend endpoint [METHOD /path]:
- Use lib/api-client.ts (apiFetch) unless multipart upload is required
- Add TypeScript types for payload/response
- Handle loading/error states and toast messages
- Keep existing role/access patterns
```

### 3. Full-stack change

```text
Implement [feature] across frontend and backend:
- Frontend repo path: [your frontend path]
- Backend repo path: [your backend path]
- Keep existing auth roles (student/faculty/admin)
- Update docs if setup or env vars change
- Verify with lint/tests if available
```

## Current Architecture Notes

### Frontend
- `apiFetch()` in `lib/api-client.ts` reads `NEXT_PUBLIC_API_BASE_URL`, adds `Authorization: Bearer <token>` from `tclass_token`, parses JSON, and throws with backend message on non-2xx.
- Login (`app/login/page.tsx`) posts directly to `/auth/login` and writes:
  - `tclass_token`
  - `tclass_role`
- Student/admin pages call `apiFetch()` for protected endpoints.
- Admission/vocational forms use multipart `FormData` via `lib/admission-submit.ts`.

### Backend
- `routes/api.php` defines public endpoints for auth login, admission submit, and contact submit.
- Protected student/admin endpoints are under `auth:sanctum`.
- Role checks are enforced in controllers using `portal_user_roles`.
- Admission approval creates student users and sends email credentials.

## Safe Defaults For AI

Do:
- Use existing `Button`, `Card`, `Input`, `Label`, `Dialog` components.
- Preserve route structure and role naming.
- Keep file uploads under current backend field names.
- Keep backend validation messages compatible with frontend toasts.

Do not:
- Rename API routes casually.
- Change cookie names (`tclass_token`, `tclass_role`) without updating auth flow.
- Replace the fetch wrapper pattern without a reason.
- Commit secrets from `.env` files.

## Useful Local Commands

Frontend:

```powershell
npm install
npm run dev
npx tsc --noEmit
npm run lint
```

Backend:

```powershell
composer install
php artisan migrate
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

## Recommended Next Doc

For new device setup + install checklist + VS Code extensions + reusable project handoff summary:
- `docs/WORKSTATION_SETUP_CHECKLIST.md`
