import { createFileRoute } from "@tanstack/react-router";

import { UnitManagement } from "@/features/units/components/unit-management";

export const Route = createFileRoute("/_protected/units")({
  component: RouteComponent,
});

function RouteComponent() {
  return <UnitManagement />;
}
