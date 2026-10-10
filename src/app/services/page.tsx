import { APP_URL } from "@/lib/constants";


export const metadata = {
  title: "Services",
  description:
    "Everything the platform offers to donors, requesters, and the admins who keep it running.",
  alternates: { canonical: `${APP_URL}/services` },
};

interface Feature {
  title: string;
  body: string;
  icon: React.ReactNode;
}

const DONOR_FEATURES: Feature[] = [
  {
    title: "Compatible-request feed",
    body: "See only the requests you can fulfil — filtered by blood group, location, and eligibility window.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    title: "One-tap availability",
    body: "Toggle your availability from the donor dashboard. Pause anytime — we will not show you new requests.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  {
    title: "Lifetime history",
    body: "Every completed donation is logged with the date, location, and case ID — easy to share with a physician.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 12a9 9 0 1 0 9-9" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    title: "Profile & avatar",
    body: "Maintain a public donor profile with a photo (Cloudinary upload), age, weight, and last-donation date.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20.7a7 7 0 0 1 10 0" />
      </svg>
    ),
  },
  {
    title: "Eligibility checks",
    body: "We surface the 56-day male / 84-day female rule and your weight check before you accept a case.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

const REQUESTER_FEATURES: Feature[] = [
  {
    title: "3-step request wizard",
    body: "Patient → Location → Contact. Submit a fully-formed request in under 60 seconds, even on mobile.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Admin verification",
    body: "Every request is reviewed by an admin before matching — so donors know the case is real and the patient is ready.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Live match score",
    body: "See your compatibility percentage with each candidate donor based on blood group, distance, and availability.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    title: "SSLCommerz verification fee",
    body: "Optional BDT 200 emergency verification fee unlocks priority matching and faster donor contact.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 16h4" />
      </svg>
    ),
  },
  {
    title: "Status timeline",
    body: "Every request shows the full lifecycle — PENDING → VERIFIED → MATCHING → ASSIGNED → COMPLETED — with timestamps.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="container-app section-pad">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            What you get, on either side of a request
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A focused feature set for donors and a different, equally focused
            feature set for requesters. Plus a small admin toolkit to keep
            everything verified and fair.
          </p>
        </div>
      </section>

      <FeatureColumn
        title="For donors"
        description="Sign up, stay available, and donate when you can. We make the matching transparent and the paperwork invisible."
        features={DONOR_FEATURES}
        tone="primary"
      />

      <FeatureColumn
        title="For requesters"
        description="Post a request, get it verified, and let admins find the closest compatible donor. Track everything end-to-end."
        features={REQUESTER_FEATURES}
        tone="info"
      />
    </>
  );
}

function FeatureColumn({
  title,
  description,
  features,
  tone,
}: {
  title: string;
  description: string;
  features: Feature[];
  tone: "primary" | "info";
}) {
  const accent = tone === "primary" ? "bg-primary/10 text-primary" : "bg-info/10 text-info";
  return (
    <section className="container-app pb-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        <span
          aria-hidden
          className={`hidden h-10 w-10 items-center justify-center rounded-lg md:inline-flex ${accent}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2c-1 4-6 6-6 12a6 6 0 0 0 12 0c0-6-5-8-6-12Z" />
          </svg>
        </span>
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li
            key={feature.title}
            className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
              {feature.icon}
            </div>
            <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
