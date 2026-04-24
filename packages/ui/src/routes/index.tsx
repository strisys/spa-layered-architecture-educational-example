import { Link, createFileRoute } from "@tanstack/react-router";
import { clsx } from "clsx";
import { useTodoViewModel } from "../features/todo/store/useTodoViewModel";
import { TodoContainer } from "../features/todo/TodoContainer";
import type { TodoStatusFilter } from "../features/todo/TodoList";

interface ITodoListSearch {
  status: TodoStatusFilter;
}

function validateSearch(search: Record<string, unknown>): ITodoListSearch {
  const status = search.status;

  if (status === "active" || status === "completed") {
    return { status };
  }

  return { status: "all" };
}

const FILTERS: ReadonlyArray<{ value: TodoStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

function FilterBar(props: { current: TodoStatusFilter }): React.JSX.Element {
  return (
    <div className="flex gap-2 text-xs">
      {FILTERS.map((f) => (
        <Link
          key={f.value}
          to="/"
          search={{ status: f.value }}
          className={clsx(
            "rounded-full border px-3 py-1",
            f.value === props.current
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-gray-300 text-gray-600 hover:border-gray-400",
          )}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}

function TodoListPage(): React.JSX.Element {
  const { status } = Route.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <FilterBar current={status} />
      <TodoContainer filter={status} />
    </div>
  );
}

export const Route = createFileRoute("/")({
  validateSearch,
  loader: (): Promise<void> => useTodoViewModel.getState().vm.init(),
  component: TodoListPage,
});
