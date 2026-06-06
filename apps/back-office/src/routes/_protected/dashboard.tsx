import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  return (
    <div className="p-4">
      <h2 className="font-semibold text-lg">Dashboard</h2>
      <p className="text-muted-foreground">Welcome {session.data?.user.name}</p>
    </div>
  );
}
