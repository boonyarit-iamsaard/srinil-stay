import Link from "next/link";

import { ModeToggle } from "./mode-toggle";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link className="font-semibold text-lg" href="/">
          Srinil Stay
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
}
