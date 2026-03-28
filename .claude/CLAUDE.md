# Coding Standards

## Domain Model Pattern
- Each domain object (e.g. `Todo`) is a class that holds a private state object (e.g. `ITodoState`)
- State is a plain type validated by a Zod schema (e.g. `TodoStateSchema`)
- State is passed to the constructor as a `Partial<State>`, merged over `newState()` defaults
- A static `emptyState()` returns defaults without `uuid`
- A static `newState()` calls `emptyState()` and adds a generated `uuid` → full state
- A static `parse()` validates a full state object via Zod (used for hydration from a datasource)
- Getters expose individual state properties; a `state` getter returns a shallow copy
- Setters for mutable properties; read-only getters for identity/timestamp fields
- Include `toString()` and `toJson()` methods

## MVVM Pattern (UI)
- One ViewModel class per feature (e.g. `TodoViewModel`) — a plain class, not React-specific
- ViewModel holds all UI state (form inputs, editing flags) and delegates data operations to the repository
- ViewModel accepts a `notify` callback via constructor to trigger reactivity
- Zustand store holds the ViewModel instance and a `version` counter
  - `notify` increments `version` to signal state changes
  - Components subscribe to the whole store (no selector) so the `version` bump triggers re-renders
- One hook per ViewModel (e.g. `useTodoViewModel()`) — destructure `vm` from the store
- ViewModel files re-export their domain objects (e.g. `export { Todo } from "@todo/model"`) so components can import both from one place
- Components are thin views: bind ViewModel properties to JSX and call ViewModel methods
- Extract conditional rendering into small component functions rather than inline ternaries/conditionals in JSX ([example](#conditional-rendering))
- Do not destructure props in function parameters; destructure at the top of the function body instead if needed

## Testing
- Use Vitest for all tests
- Tests go in a `test/` folder at the package root (not alongside source)
- `test/` folder structure mirrors `src/` (same subdirectories and file names)
- Test files named `<ClassName>.test.ts`

## Types
- Favor interfaces over type aliases (prefix with `I`, e.g. `ITodoState`)
- Use `export type` / `import type` for type-only exports/imports
- Always use explicit return types on functions and methods

## Formatting
- Separate logical blocks (e.g. `if` blocks, return statements) with a blank line
- Always use curly braces with `if` statements — no single-line bodies
- Keep import statements on a single line
- In UI files, order imports: domain/ViewModel first, then third-party/framework

## Scope
- Always use explicit access modifiers (`public`, `private`, `protected`) on class members

## Class Member Ordering
- Fields (private, then public)
- Constructor
- Instance methods (getters, then regular methods)
- Static members last

---

# Examples

## Conditional Rendering

Prefer a component function over an inline ternary:

```tsx
// good
function StatusIcon(props: IStatusIconProps): React.JSX.Element {
  if (props.isCompleted) {
    return <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />;
  }

  return <CheckCircleIcon className="h-6 w-6" />;
}

// avoid
{isCompleted ? (
  <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />
) : (
  <CheckCircleIcon className="h-6 w-6" />
)}
```
