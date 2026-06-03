import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Link className="font-semibold text-lg" to="/">
        Grammar Correction Tool
      </Link>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
