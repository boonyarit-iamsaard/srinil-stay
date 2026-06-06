import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Link className="font-semibold text-lg" href="/">
        Srinil Stay
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
