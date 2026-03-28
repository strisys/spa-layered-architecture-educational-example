import { TodoContainer } from "./features/todo/TodoContainer";

export function App(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Todo App</h1>
      <TodoContainer />
    </div>
  );
}
