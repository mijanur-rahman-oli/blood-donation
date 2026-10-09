/* ----------------------------------------------------------------------
   Testimonials
   ----------------------------------------------------------------------
   Static, server-rendered social proof section. 3 quotes from real-
   shaped personas (Donor, Requester, Hospital Coordinator). Avatars
   are decorative SVG monograms so the page works without remote images.
   ---------------------------------------------------------------------- */

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  tone: "primary" | "info" | "success";
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I was matched to a requester in Sylhet within 9 minutes. The whole flow — from accepting the assignment to the hospital handoff — was smoother than I expected.",
    name: "Karim H.",
    role: "Donor · O+",
    initials: "KH",
    tone: "primary",
  },
  {
    quote:
      "My father needed A− blood at 2 AM. I posted the request, paid the verification fee, and an admin had a verified donor at the hospital by sunrise.",
    name: "Nusrat J.",
    role: "Requester · Dhaka",
    initials: "NJ",
    tone: "info",
  },
  {
    quote:
      "We coordinate dozens of cases a month. The platform cut our phone-tree time to a fraction — and the audit log makes compliance reporting painless.",
    name: "Dr. Rahman",
    role: "Hospital Coordinator",
    initials: "DR",
    tone: "success",
  },
];

const TONE_CLASS = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
} as const;

export function Testimonials() {
  return (
    <section className="container-app section-pad" aria-label="Testimonials">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Trusted by donors, requesters, and hospitals
        </h2>
        <p className="mt-2 text-muted-foreground">
          A few words from the people who rely on the platform when it matters.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="flex h-full flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <blockquote className="text-sm leading-relaxed text-foreground">
              <span aria-hidden className="text-3xl text-primary">“</span>
              {t.quote}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span
                aria-hidden
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${TONE_CLASS[t.tone]}`}
              >
                {t.initials}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
