import { createFileRoute } from "@tanstack/react-router";

import { CreateInvitationForm } from "@/features/invitations/components/create-invitation-form";

export const Route = createFileRoute("/_protected/invitations/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-4">
      <div className="mx-auto max-w-md">
        <CreateInvitationForm />
      </div>
    </div>
  );
}
