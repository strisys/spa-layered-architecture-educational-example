import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

function RootLayout(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
          Todo App
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link
            to="/todos"
            className="text-blue-600 hover:underline"
            activeProps={{ className: "font-semibold text-blue-800" }}
          >
            Todos
          </Link>
          <Link
            to="/about"
            className="text-blue-600 hover:underline"
            activeProps={{ className: "font-semibold text-blue-800" }}
          >
            About
          </Link>
        </nav>
      </header>

      <Outlet />

      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
