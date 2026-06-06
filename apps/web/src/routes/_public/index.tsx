import { Button } from "@srinil-stay/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center">
      <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
        Your home away from home
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Discover comfortable, well-appointed rooms and book your perfect stay in
        seconds. Browse availability, reserve instantly, and feel right at home.
      </p>
      <div className="mt-10">
        <Button
          nativeButton={false}
          render={<Link to="/dashboard" />}
          size="lg"
        >
          Get started
        </Button>
      </div>
    </section>
  );
}
