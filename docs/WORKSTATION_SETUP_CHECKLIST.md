# TClass Workstation Setup Checklist

## Required Installs
- Git
- Node.js 18+
- npm 9+
- XAMPP (PHP/MySQL)
- Composer
- VS Code

## Repo Layout (Recommended)
```text
C:\Projects\tclass-v1-frontend
C:\xampp\htdocs\tclass-v1-backend
```

## Backend First
```powershell
cd C:\xampp\htdocs\tclass-v1-backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed --force
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

## Frontend
```powershell
cd C:\Projects\tclass-v1-frontend
npm install
copy .env.example .env.local
npm run dev
```

`.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## Critical Feature Checks
- Admin Curriculum
  - upload/save curriculum
  - set active
  - view subject rows
- Admin Class Scheduling
  - filter by period/course/year/section
  - schedule rows save correctly
  - advance period button works
  - past records view is read-only
- Student
  - enrollment flow
  - enrolled subjects
  - class schedule

## Notes
- Period switching can be done from UI (`Advance Period`) or backend command (`php artisan enrollment:rollover`).
- Keep `.env` and `.env.local` out of git and preserve them when moving devices.
