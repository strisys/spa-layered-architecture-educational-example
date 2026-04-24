import { Link, createFileRoute } from "@tanstack/react-router";

function CtaLink(props: { to: "/todos" | "/about"; label: string; primary?: boolean }): React.JSX.Element {
  const base = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium";
  const primary = "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
  const secondary = "border border-gray-300 text-gray-700 hover:bg-gray-50";

  return (
    <Link to={props.to} className={`${base} ${props.primary ? primary : secondary}`}>
      {props.label}
    </Link>
  );
}

function HomePage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-700">
        A small demo app showing MVVM + repository layering with TanStack Router
        on top. The list page exercises loaders and typed search params; the
        detail page exercises route params; the About page summarises what each
        route exercises.
      </p>

      <div className="flex gap-3">
        <CtaLink to="/todos" label="View Todos" primary />
        <CtaLink to="/about" label="About" />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
