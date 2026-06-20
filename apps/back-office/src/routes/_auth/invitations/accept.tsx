import { INVITATION_STATUS } from "@srinil-stay/domain/invitation";
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
  | { status: "pending"; token: string; name: string; email: string }
  | { status: "missing" | "expired" | "accepted" };

const invitationResponseSchema = z.object({
  status: z.literal(INVITATION_STATUS.PENDING),
  name: z.string(),
  email: z.email(),
});

const unavailableInvitationResponseSchema = z.object({
  status: z.enum([
    INVITATION_STATUS.MISSING,
    INVITATION_STATUS.EXPIRED,
    INVITATION_STATUS.ACCEPTED,
  ]),
});

export const Route = createFileRoute("/_auth/invitations/accept")({
  validateSearch: z.object({ token: z.string().catch("") }),
  loaderDeps: ({ search: { token } }) => ({ token }),
  loader: async ({ deps: { token } }): Promise<LoaderData> => {
    if (!token) {
      return { status: INVITATION_STATUS.MISSING };
    }

    const response = await fetch(`${env.VITE_SERVER_URL}/invitations/${token}`);
    if (!response.ok) {
      const parsed = unavailableInvitationResponseSchema.safeParse(
        await response.json().catch(() => null)
      );
      return parsed.success
        ? { status: parsed.data.status }
        : { status: INVITATION_STATUS.MISSING };
    }

    const parsed = invitationResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      return { status: INVITATION_STATUS.MISSING };
    }

    return {
      status: INVITATION_STATUS.PENDING,
      token,
      name: parsed.data.name,
      email: parsed.data.email,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();

  if (data.status !== INVITATION_STATUS.PENDING) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {data.status === INVITATION_STATUS.ACCEPTED
              ? "Invitation already accepted"
              : "Invitation unavailable"}
          </CardTitle>
          <CardDescription>
            {unavailableInvitationCopy(data.status)}
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

function unavailableInvitationCopy(status: "missing" | "expired" | "accepted") {
  if (status === INVITATION_STATUS.ACCEPTED) {
    return (
      <>
        This invitation was already accepted.{" "}
        <Link className="underline" to="/login">
          Sign in
        </Link>{" "}
        to continue.
      </>
    );
  }

  return (
    <>
      This invitation link is invalid or has expired. Ask a team member to send
      a new one, or{" "}
      <Link className="underline" to="/login">
        sign in
      </Link>{" "}
      if you already have an account.
    </>
  );
}
