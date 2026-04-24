import { Link, createFileRoute } from "@tanstack/react-router";

function Section(props: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-900">{props.title}</h2>
      <div className="text-sm text-gray-700">{props.children}</div>
    </section>
  );
}

function AboutPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-700">
        This demo exercises a handful of TanStack Router features against an
        MVVM + repository-layered todo app.
      </p>

      <Section title="File-based routes">
        <p>
          Routes live in <code className="font-mono text-xs">src/routes/</code>.
          The Vite plugin generates{" "}
          <code className="font-mono text-xs">routeTree.gen.ts</code> at build
          and dev time, so <code className="font-mono text-xs">createFileRoute</code>{" "}
          calls are fully typed against the file tree.
        </p>
      </Section>

      <Section title="Loaders">
        <p>
          The list route calls <code className="font-mono text-xs">TodoViewModel.init()</code>{" "}
          from a loader instead of a microtask, so the component renders with data
          already hydrated. The detail route loader pre-fetches a single todo by uuid.
        </p>
      </Section>

      <Section title="Typed search params">
        <p>
          The list route narrows{" "}
          <code className="font-mono text-xs">?status=</code> to{" "}
          <code className="font-mono text-xs">all | active | completed</code> via{" "}
          <code className="font-mono text-xs">validateSearch</code>, so filter
          links are type-checked end to end.
        </p>
      </Section>

      <Link to="/" className="text-sm text-blue-600 hover:underline">
        &larr; Back to list
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/about")({
  component: AboutPage,
});
