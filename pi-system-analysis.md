# Client Codebase Analysis

A walkthrough of how the client codebase works.

## Workspace layout

It's an npm-workspaces monorepo with four packages forming a strict dependency chain:

```
shared  →  model  →  services  →  ui
```

- **`@todo/shared`** – framework-free utilities (`delay`, `generateUuid`).
- **`@todo/model`** – domain entities + validation, no I/O, no React.
- **`@todo/services`** – repositories (data access). Depends on model + shared.
- **`@todo/ui`** – React/Vite app. Depends on all the above.

This is the classic layered architecture: each layer can only see the ones below it.

---

## Layer 1 — Model (`packages/model`)

### `EntityBase<TState>`
A generic base class for domain entities. Key ideas:

- **State bag (`_state: TState`)** – plain data; `state` getter returns a copy so consumers can't mutate internal state directly.
- **Persistence status** – `IsNew | InSync | IsDeleted`. Setting it to `InSync` resets the dirty `_version` to 0 and detaches the change observer.
- **Dirty tracking** – every mutating setter calls `notify()`, which bumps `_version` and fires the registered `_onChange` callback.
- **Validation** – subclasses implement `brokenRules`. `validateSchema(zodSchema)` runs Zod's `safeParse` and converts issues into `BrokenRule` objects. `isValid` is just `brokenRules.length === 0`.
- **Observer hook** – `observeChange(cb)` lets external code (the ViewModel) subscribe to "this entity changed".

### `Todo extends EntityBase<ITodoState>`
- Two Zod schemas: `TodoStateSchema` (shape) and `TodoValidationSchema` (shape + business rules like "title required").
- Setters for `title`/`status` mutate `_state` and call `notify()`.
- `toggle()` flips Active ↔ Completed.
- `clone()` produces a copy preserving `persistenceStatus` — this is what makes the "edit cancel" flow work without losing the original.
- Static factories: `newState()` (with uuid + defaults) and `parse()` (schema-validated).

---

## Layer 2 — Services (`packages/services`)

### `TodoRepository`
An in-memory fake "database" that simulates async I/O with a 100 ms `delay`.

- Seeds 10 default todos and marks them `InSync`.
- CRUD: `getAll`, `getByUuid`, `create` (unshift + flip to `InSync`), `remove`, `update`.
- `persist(todo)` is the smart save: trims title, then routes to `create` if `IsNew`, otherwise `update`. This is the entry point used by the ViewModel.

### `RepositoryRegistry`
A singleton service locator: `RepositoryRegistry.current().todos`. There's a TODO to swap in fakes when `isTesting` is true — the seam for dependency injection in tests.

---

## Layer 3 — UI (`packages/ui`)

### Bootstrap
- **`main.tsx`** – mounts `<RouterProvider>` with a TanStack Router router built from the generated `routeTree.gen.ts`.
- **Routes** are file-based under `src/routes/`:
  - `__root.tsx` – layout shell (header + nav + `<Outlet/>` + dev tools).
  - `index.tsx` – home page with CTA links.
  - `about.tsx` – static documentation.
  - `todos/index.tsx` – list page (with typed search params).
  - `todos/$uuid.tsx` – detail page.

### MVVM glue

**`TodoViewModel`** (`features/todo/store/TodoViewModel.ts`) is a plain class — **not** a React thing. It holds:
- `_todos`, `_editingTodo`, `_error`, `_isLoading`.
- A `notify` callback injected via the constructor (this is what bridges to React).

Public commands the View calls:
- `init()` – load all todos.
- `create()` – build a new in-memory `Todo`, prepend it, mark it as the one being edited, attach `observeChange(notify)` so its title typing re-renders.
- `remove(uuid)` / `toggle(uuid)` – with optimistic flip + rollback on error in `toggle`.
- `startEditing(todo)` – stores a **clone** as `_editingTodo` so the original list item is untouched until save.
- `submitEditing()` – validates, calls `repository.persist`, then `refresh()` to re-pull the list.
- `cancelEditing()` – drop the clone and refresh from the repo.

The `repository` getter has a side effect: it clears `_error` every time. So issuing any new command resets the error banner.

**`useTodoViewModel`** (`store/useTodoViewModel.ts`) wraps the VM in a Zustand store:

```ts
const vm = new TodoViewModel(notify);
// notify simply does set((s) => ({ version: s.version + 1 }))
return { vm, version: 0 };
```

Critical insight: **the ViewModel itself is mutable**, but Zustand needs an identity change to trigger a re-render. So `notify` just bumps a `version` counter — that's the "any time the VM mutates, tell React something changed" signal. Components then select whichever properties they care about (`vm.todos`, `vm.error`, etc.) and Zustand re-runs the selector, picking up the latest values from the (mutated) VM.

`useShallow` is used in `TodoList` to avoid re-renders when the selected slice's references haven't changed.

### Components (the View)

- **`TodoContainer`** – top-level layout. Subscribes only to `vm.error` so unrelated changes don't re-render the banner.
- **`AddTodo`** – just calls `vm.create()`.
- **`TodoList`** – subscribes to `{vm, todos, isLoading, editingVersion}`; applies the status filter; renders `<TodoItem>` per todo or empty/loading states. The `editingVersion` field in the selector forces re-renders while typing in the editor (since editing the cloned todo's title bumps its version through `notify`).
- **`TodoItem`** – delegates to the VM (`toggle`, `startEditing`, `remove`). When `vm.isEditing(todo)` is true, it swaps the text for an `<EditInput>` whose `onChange` mutates `vm.editingTodo!.title` directly. Enter submits, Escape/blur behavior is wired up.

### Routing features being demonstrated

- **`todos/index.tsx`**:
  - `validateSearch` narrows `?status=` to `"all" | "active" | "completed"`.
  - `loader` calls `useTodoViewModel.getState().vm.init()` so data is already loaded before the component mounts.
  - `useSearch()` reads the typed filter; `<FilterBar>` builds typed `<Link search={{status}}>` buttons.

- **`todos/$uuid.tsx`**:
  - `loader` fetches the todo by uuid via the repository directly (bypassing the VM since this is a read-only detail view) and throws `notFound()` if missing.
  - `Route.useLoaderData()` returns the typed `Todo`.
  - `notFoundComponent` renders a friendly fallback.

---

## Data flow summary (e.g., editing a todo)

1. User clicks pencil → `TodoItem` calls `vm.startEditing(todo)`.
2. VM stores `todo.clone()` in `_editingTodo`, attaches `observeChange(notify)`, calls `notify()`.
3. `notify` bumps `version` in Zustand → all subscribed components re-evaluate selectors.
4. `TodoList`'s selector now sees `editingVersion` change → re-renders → `TodoItem` sees `vm.isEditing(todo)` is true → renders `<EditInput>`.
5. User types → `vm.editingTodo!.title = ...` → setter calls `notify()` on the entity → which calls the VM's `notify` → version bumps → React re-renders the input with the new value.
6. User hits Enter → `vm.submitEditing()` → validates → `repository.persist()` → `refresh()` re-pulls the list → `_editingTodo = null` → notify → list re-renders without the editor.

The whole point of the architecture is that `TodoViewModel` is a unit-testable class with no React imports, and `Todo` is a unit-testable entity with no I/O — React/Zustand are just the rendering bridge at the top.
