import { useTodoViewModel } from "./store/useTodoViewModel";
import { PlusIcon } from "../../shared/components/tailwind";

export function AddTodo(): React.JSX.Element {
  const vm = useTodoViewModel((s) => s.vm);

  return (
    <button
      onClick={() => vm.create()}
      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <PlusIcon className="h-4 w-4" />
      Add Todo
    </button>
  );
}
