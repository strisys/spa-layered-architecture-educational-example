import { Todo, TodoViewModel } from "./store/TodoViewModel";
import { CheckCircleIcon, CheckCircleSolidIcon, PencilIcon, TrashIcon } from "../../shared/components/tailwind";
import { clsx } from "clsx";

interface ITodoItemProps {
  todo: Todo;
  vm: TodoViewModel;
}

function EditInput(props: ITodoItemProps): React.JSX.Element {
  const { vm } = props;

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      vm.submitEditing();
    }

    if (e.key === "Escape") {
      vm.cancelEditing();
    }
  };

  return (
    <input
      type="text"
      value={vm.editingTodo!.title}
      onChange={(e) => { vm.editingTodo!.title = e.target.value; }}
      onBlur={() => vm.submitEditing()}
      onKeyDown={handleKeyDown}
      autoFocus
      className="flex-1 rounded border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}

function TodoTitle(props: ITodoItemProps): React.JSX.Element {
  const { todo, vm } = props;

  if (vm.isEditing(todo)) {
    return <EditInput todo={todo} vm={vm} />;
  }

  return (
    <span
      className={clsx(
        "flex-1 text-sm",
        todo.isCompleted && "text-gray-400 line-through",
      )}
    >
      {todo.title}
    </span>
  );
}

function ActionButtons(props: ITodoItemProps): React.JSX.Element {
  const { todo, vm } = props;

  return (
    <div className="flex shrink-0 gap-1">
      <button
        onClick={() => vm.startEditing(todo)}
        className="text-gray-400 hover:text-blue-500"
        aria-label="Edit todo"
      >
        <PencilIcon className="h-5 w-5" />
      </button>

      <button
        onClick={() => vm.remove(todo.uuid)}
        className="text-gray-400 hover:text-red-500"
        aria-label="Delete todo"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function ToggleButton(props: ITodoItemProps): React.JSX.Element {
  const { todo, vm } = props;
  const icon = todo.isCompleted
    ? <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />
    : <CheckCircleIcon className="h-6 w-6" />;

  return (
    <button
      onClick={() => vm.toggle(todo.uuid)}
      className="shrink-0 text-gray-400 hover:text-green-500"
      aria-label={todo.isCompleted ? "Mark as active" : "Mark as completed"}
    >
      {icon}
    </button>
  );
}

export function TodoItem(props: ITodoItemProps): React.JSX.Element {
  const { todo, vm } = props;

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <ToggleButton todo={todo} vm={vm} />
      <TodoTitle todo={todo} vm={vm} />
      <ActionButtons todo={todo} vm={vm} />
    </li>
  );
}
