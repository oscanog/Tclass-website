# Frontend Setup Guide

## Prerequisites
- Node.js 18+
- npm 9+
- Running Laravel backend (`127.0.0.1:8000`)

## Install + Run
```bash
npm install
npm run dev
```

## Environment
Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## Verification Checklist
- `/admin/curriculum` opens and can list curriculum versions.
- `/admin/class-scheduling`:
  - period/course/year filters work
  - subjects appear after selecting course + year
  - section filter reflects on rows
  - `Advance Period` works
  - `View Past Records` is read-only
- `/student/enrollment` and `/student/class-schedule` load dynamic data.

## Commands
```bash
npm run lint
npm run build
```

## Troubleshooting
- If API calls fail: verify backend server and `.env.local` URL.
- If stale UI: restart dev server and clear `.next`.
