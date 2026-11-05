# College LMS — System Overview

This document gives an analyst a complete picture of what the system is, how it functions, and how its parts fit together. It covers the **Zanzibar Metropolitan College (ZMC) College LMS** as implemented in this repository (frontend `lms_front/` + backend `collage_backend/`).

---

## 1. Purpose

A **Student Management System** for a college (ZMC). Two core modules drive the system:

1. **Student Registration with Payments** — multi-step student registration, document upload, fee payment (M-Pesa, card, bank transfer, cash), admin approval.
2. **Academic Results Management** — exam-result entry by instructors, automatic grading, GPA/CGPA, submit → publish/reject workflow, and admin monitoring.

Plus supporting modules: programs/departments/courses, staff management, fees, reports, roles & permissions, settings.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5.7, Tailwind CSS 4, shadcn/ui + Radix |
| Backend | Laravel 10.50 (PHP 8.1+), REST API under `/api`, Sanctum token auth |
| Database | MySQL (`lms` on 127.0.0.1:3306) |
| State (FE) | React Context (Auth, LMS, Notifications, Theme) + Laravel REST |
| Auth | Sanctum bearer tokens; RBAC (roles + permissions) layered on top of a `users.role` portal selector |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend (Next.js)  http://localhost:3000                    │
│  (auth) login/signup  (student)  instructor  accountant  admin│
└──────────────────────────────┬───────────────────────────────┘
                               │  HTTP JSON  /api  (bearer token)
┌──────────────────────────────▼───────────────────────────────┐
│ Backend (Laravel)  http://127.0.0.1:8000/api                │
│  Auth · Programs · Registrations · Payments · ExamResults    │
│  Courses · Staff · Fees · Credits · Dashboard · Roles       │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│ MySQL: lms  (users, roles, permissions, role_user,          │
│  role_permissions, programs, departments, registrations,    │
│  academic_qualifications, documents, payments, courses,      │
│  course_offerings, instructor_assignments, exam_results)     │
└──────────────────────────────────────────────────────────────┘
```

- FE calls `apiFetch` / `apiRequest` against `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api`).
- FE list methods accumulate paginated backend responses (default 100/page, cap 500) so existing array consumers keep working.
- Backend list endpoints use Laravel `paginate()` and return `{ data, meta, links }` (`current_page`, `last_page`, `total`, `per_page`).

---

## 4. Roles & Access Control

### Portal selector (`users.role`): `student | instructor | admin | accountant`

Layered on top: **dynamic RBAC** — `roles` (string PK: `ADMIN`, `HOD`, `EXAM_OFFICER`, `ACCOUNTANT`), `permissions` (code = `module.action`, 43 across 11 modules), pivots `role_permissions`, `role_user`.

- `User::permissionCodes()` / `PermissionService::codesFor()` return `['*']` for admins (superusers).
- `can()` / `canAction(module, action)` treat `*` as allow-all.
- Route middleware: `permission:module,action` (e.g. `permission:programs.create`).
- Admin panel access: any staff user holding at least one admin-panel permission may access `/admin`.
- Frontend nav (`app/admin/layout.tsx`) is permission-driven; backend manifest `config/admin_permissions.php` is the single source of truth.

### Roles
- **Student** — registration, payment, results view, profile.
- **Instructor (EXAM_OFFICER)** — enter/edit exam results, submit for approval, view assigned students.
- **Accountant (ACCOUNTANT)** — payments, student fees, reports.
- **Admin (ADMIN)** — full access; superuser.

---

## 5. Core Workflows

### A. Student Registration → Payment → Approval
1. Student fills multi-step form (personal, academic qualifications, program/intake/study mode, guardian, documents).
2. `POST /registrations` creates registration (`status: draft`→`submitted`) + qualifications + documents.
3. Payment created against registration (`/payments`) with a unique control number; supports M-Pesa, card, bank transfer, cash.
4. Cash payments require admin verification (`POST /payments/{id}/verify-cash`).
5. Admin reviews registration: `approve` or `reject` (with reason) → status transitions.
6. Registration context on the FE tracks status (`submitted`, `payment_completed`, `approved`, `rejected`).

### B. Exam Results Approval
Status machine: `draft → submitted → published`, plus `rejected`.

1. Instructor creates result (`POST /exam-results`) with CAT1/CAT2/assignment/final scores → auto-computes total + grade + GPA.
2. Instructor `submit`s → `submitted`.
3. Admin `publish`es (visible to student) or `reject`s with reason.
4. Students see only `published` results; GPA/CGPA computed; continuation status (Good Standing ≥2.0, Probation 1.5–1.99, Discontinued <1.5 for two semesters).

### C. Staff & Roles
- Admin manages staff (`/staff`) and assigns dynamic roles (`/roles/users/{id}/assign`).
- Roles define permission sets; users combine permissions across roles.

---

## 6. Data Model (key tables)

- `users` (portal role + auth), `roles`, `permissions`, `role_permissions`, `role_user`
- `departments`, `programs` (linked by department code)
- `registrations`, `academic_qualifications`, `documents`
- `payments` (fee_type, method, control_number, status)
- `courses`, `course_offerings`, `instructor_assignments`
- `exam_results` (scores, grade, gpa, status, recorded_by)
- `fees`, `credits`, `settings`

Performance indexes (added): `exam_results(status)`, `(student_id,status)`; `registrations(status)`; `payments(status)`, `(registration_id,status)`; `instructor_assignments(instructor_id,status)`.

---

## 7. Frontend Portal Map

| Route prefix | Role | Key pages |
|---|---|---|
| `(auth)` | all | login, signup, forgot-password |
| `(student)` | student | dashboard, registration, registration/[id]/payment, results, academics, finance, profile, settings |
| `instructor` | instructor | dashboard, results, results/[id], students, courses, profile |
| `accountant` | accountant | dashboard, payments, student-fees, reports, settings |
| `admin` | admin | dashboard, registrations, results, users (staff/students), courses, programs, payments, reports, roles, settings |

---

## 8. Key Backend Controllers

`AuthController`, `RegistrationController` (index/show/store/approve/reject), `PaymentController` (index/store/show/verifyCash/getByRegistration), `ExamResultController` (CRUD + submit/publish/reject), `ProgramController` (programs + departments), `FeeController`, `CourseController` (courses + instructor assignments), `StaffController`, `DashboardController` (stats, accountant-stats), `RoleController` (roles/permissions/users/assign), `CreditController`.

---

## 9. Performance & Scalability State

- Pagination on hot list endpoints (staff, registrations, payments, exam-results): default 100/page, cap 500.
- Reference-data caching (programs, departments, fees) with versioned invalidation on writes.
- `QUEUE_CONNECTION=database` (jobs/failed_jobs tables); jobs are not yet dispatched anywhere, so queue is inert.
- Remaining ceiling: `php artisan serve` is single-threaded → use PHP-FPM/Nginx or Laravel Octane for production concurrency.

---

## 10. Running Locally

Backend:
```
cd collage_backend
php artisan serve --host=127.0.0.1 --port=8000   # ensure MySQL (XAMPP) running on 3306
```
Frontend:
```
cd lms_front
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev   # http://localhost:3000
```

Demo credentials: `*@college.edu` / `password123` (admin, instructor, accountant, student). Real DB contains real users too (e.g. `naifin@zanmetro.ac.tz`).

---

*Generated from the repository state (post-RBAC + post-performance work).*
path">
E:\Dev\Zee\lms_front\docs\OVERVIEW.md