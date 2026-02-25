# TClass Workstation Setup Checklist

Use this when you clone the project on another device and want a complete local setup checklist plus a reusable project handoff summary.

This guide covers:
- What to install
- PHP extensions / tools
- Repo clone + setup
- Assets/files to preserve
- VS Code extensions (recommended)
- A copy/paste project handoff summary for a new machine

## 1. Install These First (Windows/XAMPP Setup)

Required:
- Git
- Node.js 18+ (LTS recommended)
- npm 9+ (comes with Node)
- XAMPP (PHP + MySQL)
- Composer
- VS Code (recommended)

Recommended versions for current project:
- Frontend runtime: Node.js 18+ (project currently uses Next.js 16 / React 19)
- Backend runtime: PHP 8.2+ (Laravel 12)
- Database: MySQL/MariaDB (XAMPP MySQL is fine)

## 2. PHP Extensions Required (Backend)

Enable these in `php.ini` (XAMPP PHP):
- `bcmath`
- `ctype`
- `curl`
- `dom`
- `fileinfo`
- `json`
- `mbstring`
- `openssl`
- `pdo`
- `pdo_mysql`
- `tokenizer`
- `xml`

Recommended:
- `zip`
- `intl`
- `gd`

Verify:

```powershell
php -m
composer check-platform-reqs
```

## 3. Recommended VS Code Extensions

Install these on the new device (recommended, not all are mandatory):
- `dbaeumer.vscode-eslint` (ESLint)
- `bradlc.vscode-tailwindcss` (Tailwind CSS IntelliSense)
- `esbenp.prettier-vscode` (optional formatter if you use Prettier)
- `EditorConfig.EditorConfig` (EditorConfig support)
- `eamodio.gitlens` (Git history/annotations)
- `ms-vscode.vscode-typescript-next` (optional TS nightly tools)
- `bmewburn.vscode-intelephense-client` (PHP IntelliSense)
- `xdebug.php-debug` (PHP debugging, optional)
- `mikestead.dotenv` (dotenv syntax highlighting)

If you work in both repos often, `Intelephense` and `ESLint` give the biggest productivity gain.

## 4. Suggested Folder Layout (Local Machine)

```text
C:\xampp\htdocs\
  tclass-v1-backend\

C:\Users\<YourUser>\Desktop\
  tclass-v1-frontend\
```

Or use a single root:

```text
C:\Projects\
  tclass-v1-frontend\
  tclass-v1-backend\
```

The exact paths do not matter as long as you tell the AI the correct paths.

## 5. Clone Repositories

Frontend:

```powershell
git clone https://github.com/primex-joseph/Tclass-website.git tclass-v1-frontend
```

Backend:

```powershell
git clone https://github.com/primex-joseph/Tclass-website-backend.git tclass-v1-backend
```

## 6. Backend Setup (Laravel 12)

### Option A (recommended on fresh PC): one-shot script

From backend repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\laravel-fresh-start.ps1 -DatabaseName tclass_db -DbUser root -DbPassword "" -RootDbUser root -RootDbPassword "" -Seed -CreateAdmin -Serve
```

What it does:
- `composer install`
- copies `.env` (if needed)
- sets DB values
- creates DB (if MySQL client is available)
- `php artisan key:generate`
- `php artisan storage:link`
- `php artisan migrate:fresh` (and seed if `-Seed`)
- optional admin creation
- starts server

### Option B: manual setup

```powershell
cd C:\path\to\tclass-v1-backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan db:seed --force
php artisan serve --host=127.0.0.1 --port=8000
```

Minimum backend `.env` values to check/update:

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tclass_db
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME="Tarlac Center for Learning and Skills Success"

CONTACT_RECEIVER_EMAIL=your_inbox@gmail.com
```

After editing `.env`:

```powershell
php artisan config:clear
php artisan cache:clear
```

## 7. Frontend Setup (Next.js 16)

From frontend repo root:

```powershell
cd C:\path\to\tclass-v1-frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## 8. Verify Both Sides Are Running

Frontend:
- `http://localhost:3000`

Backend:
- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/api`

Quick checks:

```powershell
# Frontend
npx tsc --noEmit
npm run lint

# Backend
php artisan about
php artisan migrate:status
```

## 9. Dev Accounts (Seeded)

From backend `DatabaseSeeder`:
- Faculty: `facultydev@tclass.local` / `Faculty123!`
- Student: `studentdev@tclass.local` / `Student123!`

Admin account:
- Create with `scripts/create-admin-user.ps1` or use `-CreateAdmin` in fresh-start script.

## 10. Assets / Files You Must Not Forget (When Moving Devices)

These are the common things people miss after cloning.

### A. Environment files (not usually in git)
- Frontend: `.env.local`
- Backend: `.env`

Without these:
- frontend cannot hit backend API
- backend may fail DB/mail/upload paths

### B. Database data (not in git)
- MySQL database (`tclass_db`)
- Export/import if you need real test data
- Example: phpMyAdmin export or `mysqldump`

### C. Uploaded files (not always in git)
- Backend uploads are stored under `storage/app/public/...`
- Public URL access depends on `php artisan storage:link`
- If you need existing uploaded files, copy the backend `storage/app/public` folder from old device

### D. Frontend static assets (normally in git, but verify)
Check `tclass-v1-frontend/public/` contains required branding/media:
- `public/tclass.jpg`
- `public/tclass-logo.jpg`
- `public/tclass_logo.png`
- other images used by pages

### E. Secrets and credentials
- SMTP app password
- production/staging API URLs (if any)
- admin credentials (if not seeded)

Do not paste real secrets into docs or commit them to git.

## 11. Common Project Facts (Useful for AI)

Frontend:
- `lib/api-client.ts` uses `NEXT_PUBLIC_API_BASE_URL`
- `apiFetch()` returns parsed JSON payload (not `Response`)
- Auth cookies: `tclass_token`, `tclass_role`
- Login route: `app/login/page.tsx`
- Large forms: `app/vocational/page.tsx`, `app/diploma/page.tsx`

Backend:
- API routes: `routes/api.php`
- Public endpoints include:
  - `POST /api/auth/login`
  - `POST /api/admission/submit`
  - `POST /api/contact/submit`
- Protected endpoints include `student/*` and `admin/*`
- Role checks rely on `portal_user_roles`

## 12. Copy/Paste Project Handoff (New Device)

Use this after cloning and opening the repo(s). Replace the paths first.

```text
I cloned the TClass project on a new device.

Frontend repo path: C:\path\to\tclass-v1-frontend
Backend repo path: C:\path\to\tclass-v1-backend

Please start by checking setup readiness and tell me what is missing.

Project context:
- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- Backend: Laravel 12 + PHP 8.2 + MySQL + Sanctum
- Frontend env: NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
- Backend runs on: http://127.0.0.1:8000
- Frontend runs on: http://localhost:3000
- Auth cookies: tclass_token, tclass_role
- Roles: student, faculty, admin

Important API endpoints:
- POST /api/auth/login
- POST /api/contact/submit
- POST /api/admission/submit
- GET/POST/PATCH /api/student/*
- GET/POST/PATCH /api/admin/*

Please:
1. Verify dependencies and env files
2. Check frontend and backend startup commands
3. Report missing PHP extensions / Node deps / env vars
4. Then proceed with the task I give next
```

## 13. Optional: First Commands To Run After Cloning

Frontend:

```powershell
cd C:\path\to\tclass-v1-frontend
npm install
copy .env.example .env.local
npm run dev
```

Backend:

```powershell
cd C:\path\to\tclass-v1-backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

## 14. Security Note (Important)

Before sharing or pushing setup files:
- remove real passwords from `.env.example`
- never commit `.env` or `.env.local`
- rotate any credentials that were accidentally committed before

If backend `.env.example` contains real-looking SMTP credentials, replace them with placeholders immediately.
