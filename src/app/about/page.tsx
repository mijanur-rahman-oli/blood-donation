import Image from "next/image";

import { APP_URL } from "@/lib/constants";

/* ----------------------------------------------------------------------
   About (/about)
   ----------------------------------------------------------------------
   Server-rendered. Mission statement, story timeline, values grid, and
   a 6-person team grid using `next/image` with explicit width/height
   (per PROJECT.md -> "Component Rules").
   ---------------------------------------------------------------------- */

export const metadata = {
  title: "About",
  description:
    "Our mission, our story, the team behind the platform, and the values that guide every decision we make.",
  alternates: { canonical: `${APP_URL}/about` },
};

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

const TEAM: TeamMember[] = [
  {
    name: "Sheikh Rahman",
    role: "Founder & CEO",
    bio: "Ex-product lead at a health-tech startup. Built the first version of the platform after a personal experience trying to find a donor at 3 AM.",
    avatar: "https://i.pravatar.cc/240?img=12",
  },
  {
    name: "Anika Tabassum",
    role: "Head of Operations",
    bio: "Hematologist by training. Ensures every case is medically reviewed and every donor meets the eligibility checklist.",
    avatar: "https://i.pravatar.cc/240?img=47",
  },
  {
    name: "Tanvir Ahmed",
    role: "Engineering Lead",
    bio: "Full-stack engineer focused on reliability, real-time matching, and the JWT-based auth flow you see today.",
    avatar: "https://i.pravatar.cc/240?img=33",
  },
  {
    name: "Mithila Khan",
    role: "Donor Experience",
    bio: "Runs donor outreach, on-boarding, and the verification workflow. She keeps the supply side healthy.",
    avatar: "https://i.pravatar.cc/240?img=44",
  },
  {
    name: "Sabbir Hossain",
    role: "Hospital Partnerships",
    bio: "Coordinates with hospitals and blood banks across 64 districts. Owns the audit log and the SLA behind every assignment.",
    avatar: "https://i.pravatar.cc/240?img=15",
  },
  {
    name: "Raisa Akter",
    role: "Compliance & Trust",
    bio: "Privacy, payments (SSLCommerz), and the legal surface of the platform. Makes sure we ship the right thing, the right way.",
    avatar: "https://i.pravatar.cc/240?img=49",
  },
];

const STORY = [
  {
    year: "2022",
    title: "A 3 AM phone call",
    body: "The idea started with a single WhatsApp group trying to find a donor in a hurry. The group worked — but it was chaos.",
  },
  {
    year: "2023",
    title: "First prototype",
    body: "We built a small matching tool for two districts in Sylhet. Within a month, 400 donors had registered.",
  },
  {
    year: "2024",
    title: "Nationwide launch",
    body: "We opened the platform to all 64 districts, added admin verification, and integrated SSLCommerz for verification fees.",
  },
  {
    year: "2025",
    title: "Today",
    body: "We are a small team shipping a platform used by patients, hospitals, and donors across Bangladesh.",
  },
];

const VALUES = [
  {
    title: "Verification first",
    body: "Every request is reviewed by a human admin. Every donor passes an eligibility check. No shortcuts.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Privacy by default",
    body: "Phone numbers and medical data are revealed only to the people who need them, only for the duration of the case.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "Real-time over perfect",
    body: "We optimise for the median donor being matched in 12 minutes, not for a perfect algorithm that ships next quarter.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: "Built for Bangladesh",
    body: "Bangla-first copy, BD phone validation, district-level coverage, and a payment gateway that works here.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 21h18" />
        <path d="M5 21V8l7-4 7 4v13" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Mission */}
      <section className="container-app section-pad">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Our mission
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Make finding a compatible donor feel effortless.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            We exist because patients and families should not have to rely on luck,
            phone trees, or social media posts to find blood in an emergency. We
            connect <span className="font-semibold text-foreground">donors</span>,{" "}
            <span className="font-semibold text-foreground">requesters</span>, and{" "}
            <span className="font-semibold text-foreground">admins</span> on a
            verified, real-time platform — so the right person is reachable in
            minutes, not hours.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="container-app pb-12">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          What we value
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <li
              key={v.title}
              className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {v.icon}
              </div>
              <h3 className="text-base font-semibold text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {v.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Story */}
      <section className="container-app pb-12">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Our story
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STORY.map((entry) => (
            <li
              key={entry.year}
              className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                {entry.year}
              </span>
              <h3 className="mt-2 text-base font-semibold text-foreground">
                {entry.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {entry.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Team */}
      <section className="container-app section-pad">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            The team
          </h2>
          <p className="mt-2 text-muted-foreground">
            Six people, one shared goal: make emergency blood access a solved
            problem in Bangladesh.
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member) => (
            <li
              key={member.name}
              className="flex h-full flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm"
            >
              <Image
                src={member.avatar}
                alt={`${member.name}, ${member.role}`}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border border-border object-cover"
              />
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {member.name}
              </h3>
              <p className="text-sm text-primary">{member.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {member.bio}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
