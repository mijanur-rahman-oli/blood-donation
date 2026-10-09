import Link from "next/link";

/* ----------------------------------------------------------------------
   FinalCta
   ----------------------------------------------------------------------
   Closing call-to-action on the home page. Server-rendered, no state.
   ---------------------------------------------------------------------- */

export function FinalCta() {
  return (
    <section className="container-app pb-20">
      <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-lg md:px-12 md:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_60%)]"
        />
        <h2 className="relative text-3xl font-bold tracking-tight md:text-4xl">
          Ready to save a life today?
        </h2>
        <p className="relative mx-auto mt-2 max-w-xl text-sm opacity-90 md:text-base">
          Join thousands of verified donors and requesters across Bangladesh.
          Sign up in under a minute.
        </p>
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register?role=DONOR"
            className="inline-flex h-11 items-center justify-center rounded-md bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-background/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-primary"
          >
            Become a Donor
          </Link>
          <Link
            href="/register?role=REQUESTER"
            className="inline-flex h-11 items-center justify-center rounded-md border border-primary-foreground/30 bg-transparent px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-primary"
          >
            Request Blood
          </Link>
        </div>
      </div>
    </section>
  );
}
