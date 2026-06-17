"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!(isPending || session)) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return <Loader />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
