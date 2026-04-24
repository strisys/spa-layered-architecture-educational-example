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
  __root.tsx            // layout: header/nav (app title → '/'), <Outlet/>, devtools in dev
  index.tsx             // '/'                  — landing page with CTAs
  about.tsx             // '/about'             — static page demonstrating <Link>
  todos/
    index.tsx           // '/todos'             — todo list, filter via ?status=
    $uuid.tsx           // '/todos/:uuid'       — detail view (read-only in phase 1)
```

Generated file (committed per TanStack convention): `packages/ui/src/routeTree.gen.ts`.

### `__root.tsx`

- `createRootRoute({ component: RootLayout })`
- App title is a `<Link to="/">` (home). Nav renders `<Link to="/todos">` + `<Link to="/about">` + `<Outlet />`.
- Mounts `<TanStackRouterDevtools />` when `import.meta.env.DEV`.

### `index.tsx` — landing page

- No loader. Renders a short intro paragraph and two CTA buttons: `<Link to="/todos">` (primary) and `<Link to="/about">` (secondary).

### `todos.index.tsx` — list route

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
| Create | `packages/ui/src/routes/index.tsx` (landing page) |
| Create | `packages/ui/src/routes/about.tsx` |
| Create | `packages/ui/src/routes/todos/index.tsx` (list) |
| Create | `packages/ui/src/routes/todos/$uuid.tsx` (detail) |
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
- [x] **10.** Verify end-to-end — install, `npm run dev -w @todo/ui`, smoke-test all routes in the browser, confirm devtools present in dev and absent in a production build; run `npm test -w @todo/ui`. *(All green: install, dev server clean, `routeTree.gen.ts` auto-regenerates, production build succeeds with per-route code splitting, 33/33 tests pass. Browser smoke test confirmed: list route + all three filter chips + About + not-found + detail route + devtools all render correctly. Note: because the in-memory repository regenerates uuids on every page load, bookmarked detail URLs will 404 after a reload — SPA `<Link>` navigation preserves state and works as designed. Persistence is out of scope for this phase.)*

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

---

## Appendix A — Q&A (concepts review)

Ten-question walkthrough of the router setup. Kept here as a reference for future-me or anyone picking this up cold.

### 1. Route tree generation

**Q.** Where is `routeTree.gen.ts` generated from, and what happens if you edit it by hand?

**A.** The `tanstackRouter()` Vite plugin (in `vite.config.ts`) watches `src/routes/` and (re)generates `routeTree.gen.ts` whenever a route file is added, renamed, deleted, or its content changes. Hand-edits are overwritten on the next change. The file starts with `/* eslint-disable */` and `// @ts-nocheck` for this reason. It's committed to source control so `tsc` on a fresh checkout has something to resolve against before Vite has ever run.

### 2. Loader timing vs `queueMicrotask`

**Q.** When does the `/todos` loader (`vm.init()`) run, and what does that give us over the old `queueMicrotask(() => vm.init())` in the Zustand store?

**A.** The loader runs before the route's component renders, and the router blocks the render until the loader's promise resolves. Benefit: no loading flicker — data is hydrated on first paint. The old microtask fired once at module load and the component rendered immediately with an empty list + `isLoading = true`, then re-rendered when data arrived. Secondary benefit: the loader re-runs on every navigation to `/todos`, giving predictable refresh semantics.

### 3. `validateSearch` and typed `<Link>`

**Q.** Why did making `status` optional in `validateSearch`'s return type fix the `<Link>` errors?

**A.** TanStack uses the validator's return type as the search shape for that route. `<Link to="...">` then looks up the target route and makes its `search` prop required if any field in the schema is required (`MakeRequiredSearchParams` in the type). Marking `status` optional means no fields are required, so `search` on `<Link>` becomes optional and callers can omit it. The same type flows into `Route.useSearch()`, which is why we default with `const { status = "all" } = Route.useSearch()`.

### 4. Type-level route registry

**Q.** How does `<Link to="/todos/$uuid">` end up strongly typed against the set of valid paths?

**A.** Two mechanisms:

- **Declaration merging.** The library ships with `interface FileRoutesByPath {}` as a stub. `routeTree.gen.ts` augments it with one entry per route via `declare module '@tanstack/react-router' { interface FileRoutesByPath { ... } }`. TypeScript merges interfaces that share a name; `keyof FileRoutesByPath` becomes the union of registered paths as **string literals**, not `string`.
- **Generic inference on `<Link>`.** `Link` is roughly `function Link<P extends ValidPath>(props: LinkProps<P>)`. Writing `<Link to="/todos/$uuid">` narrows `P` to that literal, and `LinkProps<"/todos/$uuid">` resolves params/search/loader types via conditional types that look the path up in `FileRoutesByPath`.

Same mechanism powers `navigate()`, `useSearch()`, `useParams()`, `useLoaderData()`.

### 5. `throw notFound()` vs `return undefined`

**Q.** Why does the detail loader `throw notFound()` instead of returning a sentinel?

**A.** Throwing is how TanStack loaders signal non-happy paths. `throw notFound()` is caught by the router, which renders `notFoundComponent` instead of `component`. Returning `undefined` makes the loader *succeed* with `undefined`; the main component renders and `useLoaderData()` hands it `undefined`, crashing at runtime when `todo.title` is accessed. TypeScript doesn't catch it because the loader's declared return type is `Promise<Todo>` — returning `undefined` lies to the type system. Same pattern for auth: `throw redirect({ to: '/login' })`.

### 6. `activeProps` and `activeOptions.exact`

**Q.** Why did the "Todos" link need `activeOptions={{ exact: true }}` when it pointed to `/`, but drop it after moving to `/todos`?

**A.** Active matching is prefix/ancestor-based by default. `<Link to="/">` is a prefix of every URL in the app, so it would be styled "active" on every page. `exact: true` forces an exact path match. For `<Link to="/todos">`, the default prefix match is actually the desired behavior — the nav link stays highlighted on `/todos/$uuid` detail pages, signaling "still in the Todos section." Rule of thumb: use `exact: true` for short/root paths that would over-match; leave it off for section-level links where sub-route highlighting is desired.

### 7. The `Register` block in `main.tsx`

**Q.** What happens if you delete the `declare module '@tanstack/react-router' { interface Register { router: typeof router } }` block?

**A.** Pure type-level breakage. TypeScript strips `declare` statements at compile time — nothing changes at runtime. But the library uses `Register.router` to infer the app's full route graph into the type system. Delete it and `<Link to="...">` accepts any string, `params`/`search` become `any`, `useLoaderData()` returns `unknown`, etc. The runtime router is untouched; the type safety evaporates.

### 8. Dynamic params + nested routes

**Q.** How do you get `/todos/$uuid/edit` in our folder layout, and how is `useParams()` typed in the edit route?

**A.** Two equivalent ways:

```
Option A (dot-separated):              Option B (folder):
todos/                                 todos/
  index.tsx                              index.tsx
  $uuid.tsx                              $uuid/
  $uuid.edit.tsx                           index.tsx
                                           edit.tsx
```

Both generate the same routes. Option B scales better when `$uuid` gains more children. In the edit route's component, `Route.useParams()` returns `{ uuid: string }` — params are cumulative from ancestors, literal segments (`edit`) don't contribute, and the type is inferred from the path via the same registry trick as `<Link>`.

### 9. `autoCodeSplitting` in production builds

**Q.** What does `autoCodeSplitting: true` change in the `vite:build` output?

**A.** Each route's component and loader become separate chunks, loaded lazily on navigation instead of inlined into the main bundle. From our actual build:

```
dist/assets/index-CBil_jkc.js        297.83 kB   main bundle
dist/assets/index-Bq7AYZ9W.js          7.67 kB   landing route
dist/assets/about-DeDT3S3K.js          1.77 kB   about route
dist/assets/todos._uuid-CISIacwO.js    1.36 kB   detail component
dist/assets/todos._uuid-C5iNPx7a.js    0.38 kB   detail loader (split separately)
```

Loader is split from component so the router can fetch the data code and the UI code in parallel during navigation. Initial page load only downloads the main chunk plus the matched route's chunks.

### 10. Bare specifiers vs relative imports

**Q.** Why did moving `todos.index.tsx` → `todos/index.tsx` break its `../features/...` imports but not the detail route's imports?

**A.** The detail route imports are all **bare specifiers** (`@tanstack/react-router`, `@todo/services`, `@todo/model`, `clsx`). Those resolve via `node_modules` / workspace linkage — independent of the importing file's location. The list route reaches into UI-local code via **relative paths** (`../features/todo/...`); relative paths are resolved against the importing file's directory, so moving the file changes what `../` points to. Aliases in `tsconfig.json` (e.g. `"@/*": ["./src/*"]`) turn intra-package imports into bare-ish specifiers and survive file moves.

### 11. The bookmarked-URL "Todo not found" problem

**Q.** A user opens `/todos/abc-123` in a fresh tab and sees "Todo not found." What two layers are at play?

**A.** (Bonus.)

- **Demo-app layer.** `TodoRepository` builds its seed at module-load time — every fresh page load calls `new Todo()` ten times, generating ten brand-new uuids. A uuid from a previous session doesn't exist in the new session's registry. Persistence (localStorage, API) or hard-coded seed uuids would fix it.
- **Router layer.** Loaders re-run on every match — including hard reloads and direct URL entry, which reinstantiate the whole JS module graph. `<Link>` (SPA nav) keeps the module graph alive, so uuids line up; typed URLs and bookmarks don't. The router is behaving correctly; the data layer is just ephemeral.

Stable URLs require stable IDs plus persistence. The router guarantees URL → route → loader; what the loader returns is a data-layer concern.
