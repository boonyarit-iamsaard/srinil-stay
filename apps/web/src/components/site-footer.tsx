export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Srinil Stay. All rights reserved.
      </div>
    </footer>
  );
}
