import type { ReactNode } from "react";

/* ----------------------------------------------------------------------
   HowItWorks
   ----------------------------------------------------------------------
   Server-rendered. 4-step explainer that walks visitors through the
   donor / requester flow. Each step pairs a numbered tile with a
   short headline + description. Icons are inline SVG (no external
   icon library) so the page works without additional dependencies.
   ---------------------------------------------------------------------- */

interface Step {
  title: string;
  description: string;
  icon: ReactNode;
}

const STEPS: Step[] = [
  {
    title: "Create your account",
    description:
      "Sign up as a Donor or a Requester in under 60 seconds. Email + phone is enough to get started.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
      </svg>
    ),
  },
  {
    title: "Request or match",
    description:
      "Requesters post a verified blood request. Donors are matched by blood group, location, and eligibility.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12a9 9 0 1 1-9-9" />
        <path d="M21 3v6h-6" />
        <path d="M16 16l-4-4-4 4" />
      </svg>
    ),
  },
  {
    title: "Admin verifies & assigns",
    description:
      "Admins review each request, find the best donor match, and assign the case in real time.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: "Donate & save a life",
    description:
      "The donor accepts, donates, and the case is marked complete. Both sides keep a lifetime history.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2c-1 4-6 6-6 12a6 6 0 0 0 12 0c0-6-5-8-6-12Z" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="container-app section-pad" aria-label="How it works">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          How it works
        </h2>
        <p className="mt-2 text-muted-foreground">
          From a request in the middle of the night to a confirmed donor at the
          hospital door — in four steps.
        </p>
      </div>

      <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <span
              aria-hidden
              className="absolute -top-3 left-6 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            >
              {index + 1}
            </span>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {step.icon}
            </div>
            <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
