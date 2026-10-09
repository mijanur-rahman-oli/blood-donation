import Link from "next/link";

import { BloodCompatibilityChart } from "@/components/shared/BloodCompatibilityChart";
import { StatCard } from "@/components/shared/StatCard";
import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/lib/constants";

import { HowItWorks } from "./_home/HowItWorks";
import { Testimonials } from "./_home/Testimonials";
import { FinalCta } from "./_home/FinalCta";

/* ----------------------------------------------------------------------
   Home (/)
   ----------------------------------------------------------------------
   Server Component. Per PROJECT.md -> "Data Fetching Strategy" the
   home page should revalidate every 60 seconds, but the live stats
   endpoint (/admin/dashboard-stats) is admin-only. We therefore ship
   the stats section with illustrative numbers plus a clear comment
   pointing at the public probe that flips the section's "Live" badge
   when a future public endpoint is available.
   ---------------------------------------------------------------------- */



export const metadata = {
  title: "Every Drop Saves a Life",
  description: APP_DESCRIPTION,
  alternates: { canonical: APP_URL },
};

const ILLUSTRATIVE_STATS = [
  {
    label: "Total Donors",
    value: "1,200+",
    description: "Verified donors across 64 districts",
    tone: "primary" as const,
  },
  {
    label: "Active Requests",
    value: "340",
    description: "Open blood requests this week",
    tone: "info" as const,
  },
  {
    label: "Lives Saved",
    value: "8,900",
    description: "Successful matches since launch",
    tone: "success" as const,
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <LiveStatsSection />
      <HowItWorks />
      <section className="container-app section-pad">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
          <BloodCompatibilityChart />
        </div>
      </section>
      <Testimonials />
      <FinalCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]"
      />
      <div className="container-app relative grid gap-10 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col justify-center">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
            Verified · Real-time · Bangladesh
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Every Drop <span className="text-primary">Saves a Life</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {APP_DESCRIPTION} Find a compatible, available, medically-eligible
            donor in your area in under 60 seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register?role=DONOR"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Become a Donor
            </Link>
            <Link
              href="/register?role=REQUESTER"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Request Blood
            </Link>
            <Link
              href="/about"
              className="inline-flex h-11 items-center justify-center px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works →
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
            <div>
              <dt className="text-muted-foreground">Avg. response</dt>
              <dd className="mt-1 text-2xl font-bold text-foreground">12 min</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Verified donors</dt>
              <dd className="mt-1 text-2xl font-bold text-foreground">10k+</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Districts covered</dt>
              <dd className="mt-1 text-2xl font-bold text-foreground">64</dd>
            </div>
          </dl>
        </div>

        <div className="relative hidden md:block">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute right-0 top-6 w-72 rotate-3 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2c-1 4-6 6-6 12a6 6 0 0 0 12 0c0-6-5-8-6-12Z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">O+ Donor nearby</p>
            <p className="text-xs text-muted-foreground">2.1 km · available now</p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-3/4 rounded-full bg-primary" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Match confidence 92%</p>
      </div>

      <div className="absolute right-24 top-44 w-72 -rotate-2 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Request #4821 verified</p>
            <p className="text-xs text-muted-foreground">Admin approved · 1 donor assigned</p>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-80 w-72 rotate-2 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Avg. response</p>
            <p className="text-xs text-muted-foreground">12 minutes across districts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveStatsSection() {
  // Illustrative numbers — the live endpoint (/admin/dashboard-stats)
  // is admin-only. Replace with a real fetch once a public stats
  // endpoint is exposed. The probe-and-badge wiring is intentionally
  // not coupled to these numbers.
  return (
    <section className="container-app py-12 md:py-16" aria-label="Platform statistics">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            A platform that responds in minutes
          </h2>
          <p className="text-sm text-muted-foreground">
            Headline numbers from the platform. Will be wired to the live
            endpoint once a public stats route is available.
          </p>
        </div>
        <span
          aria-live="polite"
          className="inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning"
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warning" />
          Placeholder
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ILLUSTRATIVE_STATS.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            tone={stat.tone}
          />
        ))}
      </div>
    </section>
  );
}
