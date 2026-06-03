import { Button } from "@grammar-correction-tool/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center">
      <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
        Write with confidence
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Catch grammar mistakes and polish your writing in seconds. Paste your
        text, get clear corrections, and sound your best every time.
      </p>
      <div className="mt-10">
        <Button render={<Link to="/dashboard" />} size="lg">
          Get started
        </Button>
      </div>
    </section>
  );
}
