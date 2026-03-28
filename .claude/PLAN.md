# Todo App — 3-Package Monorepo

## Approach

- Monorepo with `packages/model`, `packages/services`, `packages/ui`
- Each package is a standalone npm package with its own `package.json` and `tsconfig.json`
- `services` references `model` via `"file:../model"`; `ui` references both via `file:` links
- Tech from reference: Vite 7, React 18, TypeScript, Tailwind CSS v4, Zustand, Zod, Vitest

## Structure

- **model**: `Todo` class with `TodoState` object (Zod-validated via `TodoStateSchema`). `Partial<TodoState>` passed via constructor (optional). `TodoStatus` const enum. Members: getters/setters for `title` and `status`, read-only getters for `id`, `createdAt`, `state`. Methods: `toggle()`, `toString()`, `toJson()`. Statics: `defaultState()` (returns defaults without `id`), `parse()` (applies defaults + Zod validation). Uses `uuid` package for cross-environment ID generation.
- **services**: `TodoRepository` (hard-coded data + CRUD + toggle, combined from original service/repository)
- **ui**: Vite 7 + React 18 + TypeScript
  - Styling: Tailwind CSS v4 (`@tailwindcss/vite` plugin), Headless UI, Heroicons, `clsx` + `tailwind-merge` + `cva`
  - State: Zustand store wrapping `TodoRepository` for reactive state
  - References `@todo/model` and `@todo/services` via `file:` links
  - Components:
    - `App` — main layout
    - `TodoList` — renders the list of todos
    - `TodoItem` — single todo with toggle/delete
    - `AddTodo` — input form to add new todos

## Steps

- [X] Create root `package.json` (workspaces) + root `tsconfig.json`
- [X] Create `packages/model` (types, schema, package.json, tsconfig)
- [X] Create `packages/services` (repository, service, package.json, tsconfig)
- [X] Create `packages/ui` (Vite app with React components, store, package.json, tsconfig, vite config)

## Verify

- [X] `npm install` from root
- [X] `npm run dev` from ui package
