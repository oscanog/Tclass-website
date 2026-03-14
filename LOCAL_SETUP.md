# TClass Local Setup (Frontend + Backend)

This guide is for a fresh clone on a new machine.

## Prerequisites
- Git
- Node.js 18+ and npm 9+
- PHP 8.1+ (8.2 recommended)
- Composer
- MySQL/MariaDB (XAMPP is fine on Windows)

## Recommended folders
```text
C:\Projects\tclass-v1-frontend
C:\xampp\htdocs\tclass-v1-backend
```

## 1) Clone repositories
```bash
cd C:\Projects
git clone <FRONTEND_REPO_URL> tclass-v1-frontend
```

```bash
cd C:\xampp\htdocs
git clone <BACKEND_REPO_URL> tclass-v1-backend
```

## 2) Setup backend (Laravel)
```bash
cd C:\xampp\htdocs\tclass-v1-backend
composer install
copy .env.example .env
php artisan key:generate
```

Update backend `.env`:
```env
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tclass_db
DB_USERNAME=root
DB_PASSWORD=

FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
SESSION_DOMAIN=localhost
```

If frontend origin changes (for example another LAN IP), update `CORS_ALLOWED_ORIGINS` with a comma-separated list, then run:
```bash
php artisan optimize:clear
```
If MySQL is not running yet, use:
```bash
php artisan config:clear
```

Create DB, then run:
```bash
php artisan migrate
php artisan db:seed --force
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

Backend URL: `http://127.0.0.1:8000`

## 3) Setup frontend (Next.js)
```bash
cd C:\Projects\tclass-v1-frontend
npm install
copy .env.example .env.local
```

Set in `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

Run:
```bash
npm run dev
```

Frontend URL: `http://localhost:3000`

## 4) Verify
- Landing page loads
- Login works
- Admin pages load
- Student enrollment form loads
- API calls succeed from frontend

## Daily workflow
Terminal 1 (backend):
```bash
cd C:\xampp\htdocs\tclass-v1-backend
php artisan serve --host=127.0.0.1 --port=8000
```

Terminal 2 (frontend):
```bash
cd C:\Projects\tclass-v1-frontend
npm run dev
```

## Related docs
- [Setup Checklist](./SETUP_CHECKLIST.md)
- [Frontend Setup](./docs/frontend-setup.md)
- [Live Server Setup](./docs/LIVE_SERVER_SETUP.md)
