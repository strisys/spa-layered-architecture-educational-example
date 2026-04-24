import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { RepositoryRegistry } from "@todo/services";
import type { Todo } from "@todo/model";
import { clsx } from "clsx";

function StatusBadge(props: { todo: Todo }): React.JSX.Element {
  if (props.todo.isCompleted) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      Active
    </span>
  );
}

function FieldRow(props: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-gray-500">{props.label}</span>
      <span className="text-sm text-gray-900">{props.children}</span>
    </div>
  );
}

function TodoDetailPage(): React.JSX.Element {
  const todo = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        &larr; Back to list
      </Link>

      <article className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <FieldRow label="Title">
          <span className={clsx(todo.isCompleted && "text-gray-400 line-through")}>
            {todo.title}
          </span>
        </FieldRow>

        <FieldRow label="Status">
          <StatusBadge todo={todo} />
        </FieldRow>

        <FieldRow label="Created">
          {todo.createdAt.toLocaleString()}
        </FieldRow>

        <FieldRow label="UUID">
          <code className="font-mono text-xs text-gray-500">{todo.uuid}</code>
        </FieldRow>
      </article>
    </div>
  );
}

function NotFoundPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        &larr; Back to list
      </Link>

      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Todo not found.
      </div>
    </div>
  );
}

export const Route = createFileRoute("/todos/$uuid")({
  loader: async ({ params }): Promise<Todo> => {
    const todo = await RepositoryRegistry.current().todos.getByUuid(params.uuid);

    if (!todo) {
      throw notFound();
    }

    return todo;
  },
  component: TodoDetailPage,
  notFoundComponent: NotFoundPage,
});
