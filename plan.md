# Plan: Incorporate TanStack Router

## Context

The app (`packages/ui`) is currently a single-view SPA: `main.tsx → App.tsx → TodoContainer`. There is no router — just one hardcoded screen. The goal is to bring TanStack Router in as the navigation layer so the codebase can demonstrate URL-driven views, route params, typed search params, loaders, and nested layouts — matching the "educational example" purpose of the repo.

The existing MVVM pattern (`TodoViewModel` + Zustand glue) stays intact. Router and VM will live side-by-side: the router owns *navigation and URL state*, the VM owns *transient UI state and repository delegation*.

## Decisions (locked in with Stephen)

- **File-based routing** via `@tanstack/router-plugin/vite` (auto-generates `routeTree.gen.ts`).
- **Richer demo**: three routes — list (`/` with filter search params), detail (`/todos/$uuid`), and an `/about` page.
- **Loaders** hydrate data. `TodoViewModel.init()` moves from `queueMicrotask` in the Zustand store to the `/` route's loader. Detail route loader pre-fetches a single todo by uuid.
- **Devtools**: yes, dev-only mount in `__root`.
- **Zustand stays for phase 1.** Tabled for phase 2: evaluate replacing Zustand with `useSyncExternalStore` (React 18 built-in) to drop the dependency while preserving MVVM.

## Dependency changes

Add to `packages/ui/package.json`:

```
"dependencies": {
  "@tanstack/react-router": "^1.x"
},
"devDependencies": {
  "@tanstack/react-router-devtools": "^1.x",
  "@tanstack/router-plugin": "^1.x"
}
```

Use the latest stable `@tanstack/react-router` at install time.

No zod dependency needed: the `/` route's search param has only three values, so `validateSearch` is hand-rolled (see below). If richer search schemas are added later, zod can be introduced at that point as a one-line change — and it is already present transitively via `@todo/model`.

## Vite config

**Modify** `packages/ui/vite.config.ts` — add the router plugin **before** the React plugin:

```ts
import { tanstackRouter } from '@tanstack/router-plugin/vite';
// ...
plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()]
```

(The older `TanStackRouterVite` export is now deprecated — use `tanstackRouter`.)

## Route tree (file-based)

New directory `packages/ui/src/routes/`:

```
src/routes/
  __root.tsx            // layout: header/nav, <Outlet/>, devtools in dev
  index.tsx             // '/'                  — todo list, filter via ?status=
  todos.$uuid.tsx       // '/todos/:uuid'       — detail view (read-only in phase 1)
  about.tsx             // '/about'             — static page demonstrating <Link>
```

Generated file (committed per TanStack convention): `packages/ui/src/routeTree.gen.ts`.

### `__root.tsx`

- `createRootRoute({ component: RootLayout })`
- Renders a small top nav (`<Link to="/">`, `<Link to="/about">`) + `<Outlet />`
- Mounts `<TanStackRouterDevtools />` when `import.meta.env.DEV`

### `index.tsx` — list route

- Search validator (hand-rolled, no zod):
  ```ts
  type Status = 'all' | 'active' | 'completed';

  validateSearch: (search: Record<string, unknown>): { status: Status } => {
    const s = search.status;
    return { status: s === 'active' || s === 'completed' ? s : 'all' };
  }
  ```
- `loader: () => useTodoViewModel.getState().vm.init()` — triggers VM hydration; returns nothing (VM owns state).
- `component: TodoListPage` — thin wrapper around the existing `TodoContainer`. Reads `Route.useSearch()` to get `status`, filters `vm.todos` at render time. Filter UI is three links/buttons that update the search param via `<Link search={{ status: 'active' }} />`.
- Optional `pendingComponent` for a skeleton while loader runs.

### `todos.$uuid.tsx` — detail route

- `loader: ({ params }) => RepositoryRegistry.current().todos.getByUuid(params.uuid)`
- `component: TodoDetailPage` — displays `title`, `status`, `createdAt`, `uuid`; has a "Back to list" `<Link to="/">`. Read-only in phase 1.
- `notFoundComponent` for a missing uuid.

### `about.tsx`

- Plain static content explaining what TanStack Router features the demo exercises. No loader.

## Entry-point changes

**Modify** `packages/ui/src/main.tsx`:

```tsx
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

**Delete or repurpose** `packages/ui/src/App.tsx` — the outer layout moves into `__root.tsx`. Safest: delete `App.tsx` since nothing else imports it after the main.tsx change.

## ViewModel / store changes

**Modify** `packages/ui/src/features/todo/store/useTodoViewModel.ts` — remove the self-initializing microtask; the loader now drives init:

```ts
// before
const vm = new TodoViewModel(notify);
queueMicrotask(() => vm.init());

// after
const vm = new TodoViewModel(notify);
```

`TodoViewModel` itself does **not** change. `init()` remains idempotent-friendly (fresh `getAll()` on every call is fine for this demo).

The filter (`?status=`) intentionally lives in the URL, **not** in the VM — it's navigation state, not VM state. The list component reads it from `Route.useSearch()` and filters `vm.todos` inline.

## Critical files — summary

| Action | Path |
|---|---|
| Modify | `packages/ui/package.json` |
| Modify | `packages/ui/vite.config.ts` |
| Modify | `packages/ui/src/main.tsx` |
| Delete | `packages/ui/src/App.tsx` |
| Modify | `packages/ui/src/features/todo/store/useTodoViewModel.ts` |
| Create | `packages/ui/src/routes/__root.tsx` |
| Create | `packages/ui/src/routes/index.tsx` |
| Create | `packages/ui/src/routes/todos.$uuid.tsx` |
| Create | `packages/ui/src/routes/about.tsx` |
| Generated | `packages/ui/src/routeTree.gen.ts` (commit) |

Existing files to **reuse as-is**:
- `packages/ui/src/features/todo/TodoContainer.tsx`, `TodoList.tsx`, `TodoItem.tsx`, `AddTodo.tsx` — wrapped by the `/` route, inline edit behavior preserved.
- `packages/ui/src/features/todo/store/TodoViewModel.ts` — unchanged.
- `packages/services/src/shared/RepositoryRegistry.ts` + `TodoRepository.getByUuid()` — used by the detail route loader.

## Execution checklist (one step at a time)

- [x] **1.** Install TanStack Router dependencies (`@tanstack/react-router`, `@tanstack/react-router-devtools`, `@tanstack/router-plugin`) in `@todo/ui`.
- [x] **2.** Wire `tanstackRouter({ target: 'react', autoCodeSplitting: true })` plugin into `packages/ui/vite.config.ts` before `react()`.
- [x] **3.** Create `packages/ui/src/routes/__root.tsx` with nav links, `<Outlet />`, and dev-only devtools.
- [x] **4.** Create `packages/ui/src/routes/index.tsx` — loader calls `vm.init()`; component reads `status` search param and filters `vm.todos`.
- [x] **5.** Create `packages/ui/src/routes/todos.$uuid.tsx` — loader calls `getByUuid`; component is a read-only detail view with a back link.
- [x] **6.** Create `packages/ui/src/routes/about.tsx` — static page explaining what the demo exercises.
- [x] **7.** Update `packages/ui/src/main.tsx` to create the router and wrap the app in `<RouterProvider />`; add the module-augmentation `Register` block.
- [x] **8.** Remove `queueMicrotask(() => vm.init())` from `useTodoViewModel.ts` and delete `App.tsx`.
- [x] **9.** Refactor `TodoContainer` / `TodoList` so the list route can pass a filter (derive visible todos from `vm.todos` + filter); keep inline edit unchanged.
- [~] **10.** Verify end-to-end — install, `npm run dev -w @todo/ui`, smoke-test all routes in the browser, confirm devtools present in dev and absent in a production build; run `npm test -w @todo/ui`. *(Automated checks green: install, dev server clean, `routeTree.gen.ts` generated, production build succeeds with per-route code splitting, 33/33 tests pass. Browser smoke test pending manual verification.)*

## Phase 2 (tabled, not in this change)

- Replace Zustand with `useSyncExternalStore` (React 18 built-in). `TodoViewModel` exposes `subscribe(cb)` / `getSnapshot()`; hook becomes a thin wrapper. Drops the `zustand` dependency, preserves MVVM.
- Consider making the detail route editable via a dedicated `TodoDetailViewModel` (or extending `TodoViewModel`).

## Verification

1. `npm install` at repo root resolves the three new packages.
2. `npm run dev -w @todo/ui` starts Vite without errors; `routeTree.gen.ts` is generated on first run.
3. Browser at `http://localhost:5173/`:
   - List renders with all 10 seeded todos (no loading flicker — loader waits).
   - Clicking filter links updates URL to `/?status=active|completed|all` and list updates.
   - Create / toggle / inline edit / delete still work (VM behavior unchanged).
4. Navigate to `/todos/<valid-uuid>` — detail page shows that todo's fields.
5. Navigate to `/todos/not-a-real-uuid` — `notFoundComponent` renders.
6. Navigate to `/about` — static page renders; top-nav `<Link>` highlights the active route.
7. Router devtools panel is present in dev, absent in a `npm run build && npm run preview` production build.
8. Existing Vitest suites still pass: `npm test -w @todo/ui` (and sibling packages). No test changes required — VM and repository are unchanged.
