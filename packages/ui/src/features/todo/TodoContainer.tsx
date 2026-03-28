import { useTodoViewModel } from "./store/useTodoViewModel";
import type { ITodoViewModelStore } from "./store/useTodoViewModel";
import { AddTodo } from "./AddTodo";
import { TodoList } from "./TodoList";

const selectSlice = (s: ITodoViewModelStore) => {
  return s.vm.error;
};

function ErrorBanner(props: { message: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {props.message}
    </div>
  );
}

export function TodoContainer(): React.JSX.Element {
  const error = useTodoViewModel(selectSlice);

  return (
    <div className="flex flex-col gap-6">
      {error && <ErrorBanner message={error} />}
      <AddTodo />
      <TodoList />
    </div>
  );
}
