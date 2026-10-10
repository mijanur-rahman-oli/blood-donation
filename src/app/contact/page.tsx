import type { Metadata } from "next";

import { ContactForm } from "./_contact/ContactForm";
import { APP_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about eligibility, partnerships, or the platform itself? Send us a note and we will get back to you within one business day.",
  alternates: { canonical: `${APP_URL}/contact` },
};

export default function ContactPage() {
  return (
    <section className="container-app section-pad">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Get in touch
        </h1>
        <p className="mt-3 text-muted-foreground">
          Questions about eligibility, partnerships, or the platform itself?
          Send us a note and we will get back to you within one business day.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-[1fr_2fr]">
        <aside className="space-y-4 rounded-xl border border-border bg-card p-6 text-sm shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Direct channels</h2>

          <ContactItem
            label="Address"
            value="House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh"
          />
          <ContactItem
            label="Phone"
            value="+880 1700-000000"
            href="tel:+8801700000000"
          />
          <ContactItem
            label="Email"
            value="support@blood-donation.app"
            href="mailto:support@blood-donation.app"
          />
          <ContactItem
            label="Hours"
            value="24/7 for urgent blood cases · 9:00–18:00 BST for everything else"
          />

          <p className="pt-2 text-xs text-muted-foreground">
            For urgent blood requests, please use the platform directly — this
            form is for non-emergency questions.
          </p>
        </aside>

        <ContactForm />
      </div>
    </section>
  );
}

function ContactItem({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <span>
      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="mt-0.5 block text-sm font-medium text-foreground">{value}</span>
    </span>
  );
  return (
    <div>
      {href ? (
        <a
          href={href}
          className="block rounded-md p-1 transition-colors hover:bg-muted"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}
