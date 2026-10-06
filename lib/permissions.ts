/**
 * Canonical permission model — the single source of truth for this application.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Previously permission strings were hardcoded in at least six different places
 * (admin layout, instructor layout, accountant layout, the roles matrix, the
 * pages themselves, and the Laravel database). Two of those places disagreed
 * (`payments.view` vs `fees.view`, `users.view` vs `students.view`), which is
 * why granting a permission sometimes did nothing and denying one did not
 * actually deny anything.
 *
 * RULE: a permission code is a `"<module>.<action>"` string. That exact string is
 * what is stored in the database, returned by the API, and checked by the UI.
 * Nothing may invent a code at a call site.
 *
 * SECURITY NOTE
 * -------------
 * The codes in this file drive the USER INTERFACE only (navigation, buttons,
 * page visibility). They are NOT security. A user can always craft a request by
 * hand, so the Laravel backend must independently verify
 * authenticated -> role -> permission for every protected endpoint. See
 * `docs/BACKEND-RBAC-CONTRACT.md`.
 */

/** Wildcard grant. Assigned deliberately to a "super admin" role. */
export const SUPER_ADMIN_CODE = '*';

/** The four action-less "portal entry" codes. */
export const ADMIN_ACCESS = 'admin.access' as const;
export const INSTRUCTOR_ACCESS = 'instructor.access' as const;
export const ACCOUNTANT_ACCESS = 'accountant.access' as const;

/**
 * Canonical module -> allowed actions.
 * Adding a module here automatically adds it to the roles matrix, so the matrix
 * can never drift away from the codes the application actually checks.
 */
const MODULE_SPEC = {
  admin: { label: 'Administration', actions: ['access'] },
  instructor: { label: 'Instructor Portal', actions: ['access'] },
  accountant: { label: 'Accountant Portal', actions: ['access'] },
  dashboard: { label: 'Dashboard', actions: ['view'] },
  students: { label: 'Students', actions: ['view', 'create', 'update', 'delete', 'export'] },
  staff: {
    label: 'Staff',
    actions: ['view', 'create', 'update', 'delete', 'assign', 'reset-password'],
  },
  roles: {
    label: 'Roles & Permissions',
    actions: ['view', 'create', 'update', 'delete', 'assign'],
  },
  programs: { label: 'Programs', actions: ['view', 'create', 'update', 'delete'] },
  courses: {
    label: 'Courses',
    actions: ['view', 'create', 'update', 'delete', 'assign', 'export'],
  },
  departments: { label: 'Departments', actions: ['view', 'create', 'update', 'delete'] },
  credits: { label: 'Credits', actions: ['view', 'create', 'update', 'delete'] },
  instructors: { label: 'Instructors', actions: ['view', 'assign'] },
  fees: {
    label: 'Fees & Payments',
    actions: ['view', 'create', 'update', 'delete', 'verify', 'export'],
  },
  registrations: {
    label: 'Registrations',
    actions: ['view', 'create', 'update', 'delete', 'approve', 'reject'],
  },
  results: {
    label: 'Results',
    actions: ['view', 'create', 'update', 'delete', 'approve', 'reject', 'publish'],
  },
  reports: { label: 'Reports', actions: ['view', 'export'] },
  settings: { label: 'Settings', actions: ['view', 'update'] },
} as const;

export type PermissionModule = keyof typeof MODULE_SPEC;
export type PermissionAction = 'access' | 'view' | 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'publish' | 'verify' | 'assign' | 'export' | 'reset-password';

export type PermissionCode = `${PermissionModule}.${PermissionAction}`;

/** Build a permission code from its parts. Prefer this over string literals. */
export function code(module: PermissionModule, action: PermissionAction): PermissionCode {
  return `${module}.${action}` as PermissionCode;
}

/** Human label for a module key. */
export const MODULE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_SPEC).map(([key, spec]) => [key, spec.label])
);

/** Column order for the roles matrix, plus label text. */
export const ACTION_ORDER: PermissionAction[] = [
  'access',
  'view',
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'publish',
  'verify',
  'assign',
  'export',
  'reset-password',
];

export const ACTION_LABELS: Record<string, string> = {
  access: 'Access',
  view: 'View',
  create: 'Add',
  update: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  reject: 'Reject',
  publish: 'Publish',
  verify: 'Verify',
  assign: 'Assign',
  export: 'Export',
  'reset-password': 'Reset Password',
};

export interface MatrixModule {
  module: PermissionModule;
  label: string;
  actions: PermissionAction[];
  codes: string[];
}

/** The canonical permission matrix rendered by /admin/roles. */
export const CANONICAL_MATRIX: MatrixModule[] = (Object.keys(MODULE_SPEC) as PermissionModule[])
  .map((module) => {
    const spec = MODULE_SPEC[module];
    return {
      module,
      label: spec.label,
      actions: [...spec.actions].sort(
        (a, b) => ACTION_ORDER.indexOf(a as PermissionAction) - ACTION_ORDER.indexOf(b as PermissionAction)
      ) as PermissionAction[],
      codes: spec.actions.map((action) => code(module, action as PermissionAction)),
    };
  })
  .filter((entry) => entry.module !== 'instructor' && entry.module !== 'accountant')
  .sort((a, b) => a.label.localeCompare(b.label));

/** Every canonical code across every module, including the portal entry codes. */
export const ALL_CANONICAL_CODES: string[] = (Object.keys(MODULE_SPEC) as PermissionModule[]).flatMap(
  (module) => MODULE_SPEC[module].actions.map((action) => code(module, action as PermissionAction))
);

const CANONICAL_CODE_SET = new Set(ALL_CANONICAL_CODES);

/**
 * Codes that existed in the database but were folded into a canonical module.
 * Kept so an existing production database keeps working after this refactor.
 *
 *   payments.* -> fees.*      (fee structure and payment transactions are one area)
 *   users.*    -> students.*  (the "Users" matrix row was always the students area)
 *
 * The backend should migrate these rows and then this map can be deleted.
 */
const LEGACY_MODULE_ALIASES: Record<string, PermissionModule> = {
  payments: 'fees',
  users: 'students',
};

/** Legacy code -> canonical code, for every action in the legacy module. */
export const LEGACY_CODE_MAP: Record<string, string> = Object.entries(LEGACY_MODULE_ALIASES).reduce(
  (acc, [legacyModule, canonicalModule]) => {
    MODULE_SPEC[canonicalModule].actions.forEach((action) => {
      acc[`${legacyModule}.${action}`] = code(canonicalModule, action as PermissionAction);
    });
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Legacy codes whose *action* was renamed as well as their module, so the
 * generated map above cannot produce them. Hand-maintained, and applied on top.
 *
 * The old `users` area covered staff and students as one thing. After the split
 * into `staff` and `students`, password reset stayed on `staff`, so
 * `users.reset-password` has to be rewritten to a different module rather than
 * merely re-homed. Without this it survives normalization verbatim, fails the
 * canonical check, and shows up in the matrix as dead weight.
 */
export const LEGACY_ACTION_ALIASES: Record<string, string> = {
  'users.reset-password': code('staff', 'reset-password'),
};

Object.assign(LEGACY_CODE_MAP, LEGACY_ACTION_ALIASES);

/** Legacy code -> its canonical replacement, for "did you mean" hints in the UI. */
export const LEGACY_CODE_REPLACEMENTS: Record<string, string> = { ...LEGACY_ACTION_ALIASES };

/**
 * The backend may return permission codes as plain strings
 * (`"users.view"`) or as objects (`{ code, module, action }`).
 * Normalize both shapes into a de-duplicated array of canonical string codes.
 * Unknown codes are preserved verbatim so nothing is silently dropped, but they
 * are not canonical and the roles matrix will surface them as unmapped.
 */
export function normalizePermissionCodes(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const out = new Set<string>();

  for (const entry of input) {
    let raw: string | undefined;

    if (typeof entry === 'string') {
      raw = entry;
    } else if (entry && typeof entry === 'object') {
      const record = entry as { code?: unknown; module?: unknown; action?: unknown };
      if (typeof record.code === 'string' && record.code) {
        raw = record.code;
      } else if (typeof record.module === 'string' && typeof record.action === 'string') {
        raw = `${record.module}.${record.action}`;
      }
    }

    if (!raw) continue;

    const trimmed = raw.trim();
    if (!trimmed) continue;

    out.add(LEGACY_CODE_MAP[trimmed] ?? trimmed);
  }

  return Array.from(out);
}

/** True when the code is one this application knows how to check. */
export function isCanonicalCode(value: string): boolean {
  return value === SUPER_ADMIN_CODE || CANONICAL_CODE_SET.has(value);
}

/** Split `"users.view"` into `{ module: 'users', action: 'view' }`. */
export function parseCode(value: string): { module: string; action: string } | null {
  const index = value.indexOf('.');
  if (index <= 0 || index === value.length - 1) return null;
  return { module: value.slice(0, index), action: value.slice(index + 1) };
}

/**
 * Entry codes for each portal. A user may enter a portal if they hold the
 * dedicated `*.access` code OR any permission that makes the portal useful.
 * These lists are data-driven from the portal navigation so there is no second,
 * independent access mechanism.
 */
export const ADMIN_ENTRY_CODES: string[] = [
  ADMIN_ACCESS,
  'dashboard.view',
  'students.view',
  'staff.view',
  'programs.view',
  'courses.view',
  'departments.view',
  'credits.view',
  'instructors.view',
  'fees.view',
  'registrations.view',
  'results.view',
  'reports.view',
  'settings.view',
  'roles.view',
];

export const INSTRUCTOR_ENTRY_CODES: string[] = [
  INSTRUCTOR_ACCESS,
  'dashboard.view',
  'courses.view',
  'results.view',
];

export const ACCOUNTANT_ENTRY_CODES: string[] = [
  ACCOUNTANT_ACCESS,
  'dashboard.view',
  'fees.view',
  'reports.view',
];

/**
 * Permissions a user must hold to keep administering their own access.
 * The roles page refuses to save a matrix that would strip these from the
 * signed-in user, which prevents an admin from locking everyone out.
 */
export const SELF_PROTECT_CODES: string[] = ['roles.view', 'roles.update'];

/**
 * Which permission unlocks which admin URL.
 *
 * This is enforced in `app/admin/layout.tsx`, not in each page, on purpose:
 * a page-level guard is easy to forget on a detail route such as
 * `/admin/registrations/[id]`, and a forgotten guard is an open door. Matching
 * is longest-prefix-first, so `/admin/registrations/new` wins over
 * `/admin/registrations`.
 *
 * Removing an entry from this map makes the URL require nothing beyond admin
 * entry — keep it in sync when adding a page.
 */
export const ADMIN_ROUTE_PERMISSIONS: { prefix: string; module: PermissionModule; action: PermissionAction }[] = [
  { prefix: '/admin/roles', module: 'roles', action: 'view' },
  { prefix: '/admin/users/staff', module: 'staff', action: 'view' },
  { prefix: '/admin/users/students', module: 'students', action: 'view' },
  { prefix: '/admin/users/add', module: 'students', action: 'create' },
  { prefix: '/admin/users/edit', module: 'students', action: 'update' },
  { prefix: '/admin/users', module: 'students', action: 'view' },
  { prefix: '/admin/programs', module: 'programs', action: 'view' },
  { prefix: '/admin/courses', module: 'courses', action: 'view' },
  { prefix: '/admin/registrations/new', module: 'registrations', action: 'create' },
  { prefix: '/admin/registrations', module: 'registrations', action: 'view' },
  { prefix: '/admin/results', module: 'results', action: 'view' },
  { prefix: '/admin/payments', module: 'fees', action: 'view' },
  { prefix: '/admin/reports', module: 'reports', action: 'view' },
  { prefix: '/admin/settings', module: 'settings', action: 'view' },
  { prefix: '/admin', module: 'dashboard', action: 'view' },
];

/** The permission an admin URL requires, or null when the URL needs no extra grant. */
export function permissionForAdminRoute(
  pathname: string
): { module: PermissionModule; action: PermissionAction } | null {
  const path = pathname.replace(/\/+$/, '') || '/admin';

  let best: { prefix: string; module: PermissionModule; action: PermissionAction } | null = null;

  for (const entry of ADMIN_ROUTE_PERMISSIONS) {
    const matches = path === entry.prefix || path.startsWith(`${entry.prefix}/`);
    if (!matches) continue;
    if (!best || entry.prefix.length > best.prefix.length) best = entry;
  }

  // `/admin` itself is the dashboard.
  if (!best && path === '/admin') {
    return { module: 'dashboard', action: 'view' };
  }

  // `/admin/profile` and any other future utility page: admin entry is enough.
  if (best?.prefix === '/admin' && path !== '/admin') return null;

  return best;
}
