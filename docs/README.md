# TClass Docs Index

## Start Here
- `../README.md` - frontend overview
- `./frontend-setup.md` - frontend local setup
- `./WORKSTATION_SETUP_CHECKLIST.md` - full workstation checklist
- `./AI_PROMPT.md` - AI handoff/context prompt
- `./REVIEW_2026-03-09.md` - latest engineering review snapshot

## Repositories
- Frontend: `tclass-v1-frontend`
- Backend: `tclass-v1-backend`

## Current Architecture Highlights
- Curriculum is versioned in backend (`curriculum_versions`, `curriculum_subjects`).
- Active curriculum syncs into `courses`.
- Admin Class Scheduling loads by `Period + Course + Year` from curriculum-synced courses.
- `class_offerings` stores actual section/teacher/room/day/time assignments.
- Student enrollment and schedule read offerings after assignment.

## URLs (Default)
- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`
- API: `http://127.0.0.1:8000/api`
