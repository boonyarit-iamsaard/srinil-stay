export default function PublicFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} Grammar Correction Tool. All rights
        reserved.
      </div>
    </footer>
  );
}
