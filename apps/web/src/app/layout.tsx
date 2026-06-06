import "./globals.css";

import { Toaster } from "@srinil-stay/ui/components/sonner";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Srinil Stay",
  description: "Srinil Stay is a web application for booking your stay.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="flex min-h-svh flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
