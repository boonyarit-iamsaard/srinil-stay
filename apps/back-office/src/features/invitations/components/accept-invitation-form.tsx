import { env } from "@srinil-stay/env/back-office";
import { Button } from "@srinil-stay/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@srinil-stay/ui/components/card";
import { Input } from "@srinil-stay/ui/components/input";
import { Label } from "@srinil-stay/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

interface AcceptInvitationFormProps {
  email: string;
  name: string;
  token: string;
}

export function AcceptInvitationForm({
  token,
  name,
  email,
}: Readonly<AcceptInvitationFormProps>) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      password: "",
    },
    onSubmit: async ({ value }) => {
      const response = await fetch(
        `${env.VITE_SERVER_URL}/invitations/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: value.password }),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("This invitation was already accepted. Please sign in.");
          navigate({ to: "/login" });
          return;
        }
        toast.error("This invitation link is no longer valid.");
        return;
      }

      // Establish the session in the browser, then land on the dashboard.
      await authClient.signIn.email(
        { email, password: value.password },
        {
          onSuccess: () => {
            toast.success("Welcome to Srinil Stay");
            navigate({ to: "/dashboard" });
          },
          onError: () => {
            navigate({ to: "/login" });
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Accept your invitation</CardTitle>
        <CardDescription>
          Hi {name}, set a password to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input disabled id="email" type="email" value={email} />
          </div>

          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-destructive text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button
                className="w-full"
                disabled={!canSubmit || isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Activating..." : "Activate account"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
