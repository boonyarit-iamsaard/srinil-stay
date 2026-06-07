import { env } from "@srinil-stay/env/back-office";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@srinil-stay/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import { AcceptInvitationForm } from "@/features/invitations/components/accept-invitation-form";

type LoaderData =
  | { status: "ok"; token: string; name: string; email: string }
  | { status: "invalid" };

const invitationResponseSchema = z.object({
  name: z.string(),
  email: z.email(),
});

export const Route = createFileRoute("/_auth/invitations/accept")({
  validateSearch: z.object({ token: z.string().catch("") }),
  loaderDeps: ({ search: { token } }) => ({ token }),
  loader: async ({ deps: { token } }): Promise<LoaderData> => {
    if (!token) {
      return { status: "invalid" };
    }

    const response = await fetch(`${env.VITE_SERVER_URL}/invitations/${token}`);
    if (!response.ok) {
      return { status: "invalid" };
    }

    const parsed = invitationResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      return { status: "invalid" };
    }

    return {
      status: "ok",
      token,
      name: parsed.data.name,
      email: parsed.data.email,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();

  if (data.status === "invalid") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invitation unavailable</CardTitle>
          <CardDescription>
            This invitation link is invalid or has expired. Ask a team member to
            send a new one, or{" "}
            <Link className="underline" to="/login">
              sign in
            </Link>{" "}
            if you already have an account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <AcceptInvitationForm
      email={data.email}
      name={data.name}
      token={data.token}
    />
  );
}
