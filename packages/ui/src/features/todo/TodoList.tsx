import { useTodoViewModel } from "./store/useTodoViewModel";
import type { ITodoViewModelStore } from "./store/useTodoViewModel";
import { useShallow } from "zustand/react/shallow";
import { TodoItem } from "./TodoItem";

const selectSlice = (s: ITodoViewModelStore) => {
  return { vm: s.vm, todos: s.vm.todos, isLoading: s.vm.isLoading, editingVersion: s.vm.editingTodo?.version ?? null };
};

function LoadingIndicator(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <svg
        className="h-5 w-5 animate-spin text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm text-gray-500">Loading...</span>
    </div>
  );
}

function EmptyState(): React.JSX.Element {
  return (
    <p className="py-8 text-center text-sm text-gray-500">
      No todos yet. Add one above!
    </p>
  );
}

export function TodoList(): React.JSX.Element {
  const { vm, todos, isLoading } = useTodoViewModel(useShallow(selectSlice));

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (todos.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem key={todo.uuid} todo={todo} vm={vm} />
      ))}
    </ul>
  );
}
