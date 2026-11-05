# Backend RBAC Contract

This document is the specification the Laravel backend must satisfy. The
frontend is **not** the security boundary — it only controls what a user sees.
Every rule below has to be enforced server-side, because hiding a sidebar link
or a button does nothing to stop a hand-crafted request.

---

## 1. The single model

```
User ──belongsToMany──▶ Role ──belongsToMany──▶ Permission
                                                 (code: "module.action")
```

- `User.role` (`admin`, `instructor`, `accountant`, `student`) is a **portal
  selector only**. It selects which dashboard a user lands on. It grants
  nothing. Do not branch authorization on it.
- `User.roles` — the assigned roles.
- `User.permissions` — the resolved union of every assigned role's permissions.
- The super-admin role holds the single code `"*"` and bypasses all checks.
  There is no second bypass keyed on `User.role`.

### Canonical permission codes

Defined once in `lib/permissions.ts` (frontend). Mirror them in a seeder so the
two lists cannot drift:

| Module | Actions |
|---|---|
| `admin` | `access` |
| `instructor` | `access` |
| `accountant` | `access` |
| `dashboard` | `view` |
| `students` | `view` `create` `update` `delete` `export` |
| `staff` | `view` `create` `update` `delete` `assign` `reset-password` |
| `roles` | `view` `create` `update` `delete` `assign` |
| `programs` | `view` `create` `update` `delete` |
| `courses` | `view` `create` `update` `delete` `assign` `export` |
| `departments` | `view` `create` `update` `delete` |
| `credits` | `view` `create` `update` `delete` |
| `instructors` | `view` `assign` |
| `fees` | `view` `create` `update` `delete` `verify` `export` |
| `registrations` | `view` `create` `update` `delete` `approve` `reject` |
| `results` | `view` `create` `update` `delete` `approve` `reject` `publish` |
| `reports` | `view` `export` |
| `settings` | `view` `update` |

`fees` and `payments` were merged into a single `fees` module — fee structure
and payment transactions are one functional area. If your database still has
`payments.*` rows, migrate them; the frontend maps them automatically in the
meantime. `users.*` was likewise merged into `students.*`.

---

## 2. Required request pipeline

```
HTTP request
   │
   ├─ 1. Authenticated?          no ─▶ 401 { message: "Unauthenticated." }
   ├─ 2. Resolve roles → codes   (cached per request)
   ├─ 3. Required permission?    no ─▶ 403 { message: "This action is unauthorized." }
   └─ 4. Allow
```

Suggested Laravel pieces:

```php
// app/Http/Middleware/EnsurePermission.php
public function handle(Request $request, Closure $next, string $permission)
{
    $user = $request->user();

    if (! $user) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    if ($user->hasPermission('*')) {
        return $next($request);
    }

    if (! $user->hasPermission($permission)) {
        return response()->json([
            'message' => 'This action is unauthorized.',
            'required_permission' => $permission,
        ], 403);
    }

    return $next($request);
}
```

```php
// app/Models/User.php
public function hasPermission(string $code): bool
{
    if ($this->isSuperAdmin()) {
        return true;
    }

    return once(fn () => $this->permissionCodes())
        ->contains($code);
}

public function permissionCodes(): Collection
{
    return $this->roles()
        ->with('permissions')
        ->get()
        ->pluck('permissions')
        ->flatten()
        ->pluck('code')
        ->unique()
        ->values();
}

public function isSuperAdmin(): bool
{
    return $this->permissionCodes()->contains('*');
}
```

Apply it in `routes/api.php` with `->middleware('permission:roles.view')`.

---

## 3. Endpoint → permission map

| Method | Endpoint | Permission | HTTP method check |
|---|---|---|---|
| GET | `/api/roles` | `roles.view` | |
| GET | `/api/roles/permissions` | `roles.view` | |
| GET | `/api/roles/users` | `roles.view` | |
| POST | `/api/roles` | `roles.create` | |
| PUT | `/api/roles/{id}` | `roles.update` | |
| DELETE | `/api/roles/{id}` | `roles.delete` | + reject `is_system` |
| POST | `/api/roles/users/{id}/assign` | `roles.assign` | + cannot escalate past own level |
| GET | `/api/staff` | `staff.view` | |
| POST | `/api/staff` | `staff.create` | |
| PUT | `/api/staff/{id}` | `staff.update` | |
| DELETE | `/api/staff/{id}` | `staff.delete` | |
| GET | `/api/registrations` | `registrations.view` | |
| POST | `/api/registrations` | `registrations.create` | |
| PUT | `/api/registrations/{id}` | `registrations.update` | |
| DELETE | `/api/registrations/{id}` | `registrations.delete` | |
| POST | `/api/registrations/{id}/approve` | `registrations.approve` | |
| POST | `/api/registrations/{id}/reject` | `registrations.reject` | |
| GET | `/api/exam-results` | `results.view` | |
| POST | `/api/exam-results/{id}/publish` | `results.publish` | |
| POST | `/api/exam-results/{id}/reject` | `results.reject` | |
| GET | `/api/payments` | `fees.view` | |
| POST | `/api/payments` | `fees.create` | |
| POST | `/api/payments/{id}/verify-cash` | `fees.verify` | |
| PUT | `/api/fees/{id}` | `fees.update` | |
| DELETE | `/api/fees/{id}` | `fees.delete` | |
| GET | `/api/courses` | `courses.view` | |
| POST | `/api/courses` | `courses.create` | |
| PUT | `/api/courses/{id}` | `courses.update` | |
| DELETE | `/api/courses/{id}` | `courses.delete` | |
| POST | `/api/courses/{id}/assign-instructor` | `courses.assign` | |
| GET | `/api/reports/**` | `reports.view` | |
| GET | `/api/reports/**` (export) | `reports.export` | |
| GET/PUT | `/api/settings` | `settings.view` / `settings.update` | |
| GET | `/api/dashboard/stats` | `dashboard.view` | |
| GET | `/api/auth/profile` | authenticated only | |

---

## 4. `/api/auth/profile` response contract

This is the only source the client uses for authorization, so its shape matters
more than any other endpoint.

```json
{
  "user": {
    "id": 12,
    "first_name": "Amina",
    "last_name": "Hassan",
    "email": "amina@example.com",
    "role": "accountant",
    "registration_number": "ZMC/2026/0042",
    "created_at": "2026-01-15T09:00:00Z"
  },
  "roles": [
    { "id": 3, "name": "Registrar", "role_id": 3 }
  ],
  "permissions": [
    "admin.access",
    "dashboard.view",
    "students.view",
    "registrations.approve"
  ]
}
```

Rules:

- `permissions` is a **flat array of canonical code strings**. Returning objects
  works (the client normalizes), but strings are the contract.
- Include `"*"` for the super-admin role.
- **Do not send `can_access_admin_panel`.** It is gone. The client derives admin
  entry from `permissions` via `admin.access` plus the navigation codes, so a
  separate boolean can only ever disagree with the permission set — that
  disagreement was the original bug.
- `roles` entries must expose `role_id` (or `id`).

### 4a. Why `/api/auth/login` should not be the only source

The client now calls `/api/auth/profile` immediately after login and uses that
as the authoritative payload. If the login endpoint omits `permissions`, the
profile call fills them in. Keep both consistent.

---

## 5. Permission changes must reach live sessions

Assigning a role (`POST /api/roles/users/{id}/assign`) changes the database but
not any token already issued. Consequences:

- The affected user's permissions update on their next page load, because the
  client waits for `/auth/profile` before rendering anything protected.
- A tab left open picks up the change on the next `focus` or
  `visibilitychange`, because the client re-fetches `/auth/profile` then.
- There is a window between the assignment and the next profile fetch. If that
  is unacceptable for a given action, add one of:
  - a short-lived cache version in the token and reject stale versions, or
  - server-side session/token invalidation on role change, or
  - an SSE/WebSocket "permissions changed" event.

No real-time infrastructure is required for the current scale.

---

## 6. Anti-lockout rules

`/admin/roles` refuses to save a matrix that would strip the signed-in user's
own `roles.view` + `roles.update`. Enforce the equivalent server-side:

- Refuse to remove the last role that grants `roles.update` from the acting
  user, unless they hold `"*"`.
- Refuse to delete or rename a role with `is_system = true`.
- Refuse to remove a user from their own roles, or to grant a role whose
  permission set is a strict superset of the actor's own.

Without these, one mis-click permanently locks everyone out of the admin panel.

---

## 7. Verifying the implementation

```bash
# 1. Not authenticated -> 401, not 403, not 200-with-empty-body
curl -i http://localhost:8000/api/roles            # expect 401

# 2. Authenticated without roles.view -> 403
TOKEN=$(cat token-without-roles.txt)
curl -i -H "Authorization: Bearer $TOKEN" \
        http://localhost:8000/api/roles            # expect 403

# 3. Authenticated with roles.view -> 200
TOKEN=$(cat token-with-roles-view.txt)
curl -i -H "Authorization: Bearer $TOKEN" \
        http://localhost:8000/api/roles            # expect 200

# 4. With roles.view but not roles.delete -> 403 on delete
curl -i -X DELETE -H "Authorization: Bearer $TOKEN" \
        http://localhost:8000/api/roles/2          # expect 403
```

Also confirm the frontend never trusts a client-supplied permission list: edit
`localStorage.lms-auth` in devtools to add `"students.view"`, and the request
must still be refused by the server.
