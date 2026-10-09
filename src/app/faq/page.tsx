"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

// Per-page metadata is exported from `src/app/faq/layout.tsx` (a sibling
// server component) because `page.tsx` is a client component and the App
// Router does not allow `metadata` to be exported from a client module.

/* ----------------------------------------------------------------------
   FAQ (/faq)
   ----------------------------------------------------------------------
   Client component (the accordion uses `useState`). 12 real FAQs
   covering donation eligibility, blood compatibility, the request
   process, payment, and privacy. The accordion is dependency-free —
   built with native <button> + Tailwind so it works without the
   shadcn Accordion primitive. When `npx shadcn@latest add accordion`
   is run, swap the inner markup without touching the data or
   category filter.
   ---------------------------------------------------------------------- */

interface FaqItem {
  category: "Eligibility" | "Compatibility" | "Request" | "Payment" | "Privacy";
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    category: "Eligibility",
    question: "Who can donate blood?",
    answer:
      "Anyone between 18 and 65, weighing at least 45 kg, in general good health, and not on contraindicated medication. The platform enforces the 56-day (men) and 84-day (women) gap between donations.",
  },
  {
    category: "Eligibility",
    question: "I take regular medication. Can I still donate?",
    answer:
      "Many common medications are compatible with donation. The final medical clearance is given by the on-site clinician at the hospital — we surface the medication field in your profile so the admin can pre-screen.",
  },
  {
    category: "Eligibility",
    question: "How long does a single donation take?",
    answer:
      "The actual draw takes 8–12 minutes. The full visit (registration, screening, donation, rest, snack) is usually 30–45 minutes.",
  },
  {
    category: "Compatibility",
    question: "Which blood types are compatible?",
    answer:
      "O− is the universal donor; AB+ is the universal recipient. The full ABO + Rh compatibility table is rendered on the home page (Blood Compatibility Chart). Negative recipients can only receive from negative donors.",
  },
  {
    category: "Compatibility",
    question: "I have a rare blood type. Will I ever be matched?",
    answer:
      "Yes. Rare types are rarer, but they are also in shorter supply — so when a request comes in, the matching engine ranks compatible rare donors first. The platform supports all 8 standard ABO + Rh groups.",
  },
  {
    category: "Request",
    question: "How do I post a blood request?",
    answer:
      "Sign in as a Requester and open the New Request wizard (Dashboard → Requests → New). Three short steps: patient details, location, and contact. The request is reviewed by an admin within minutes.",
  },
  {
    category: "Request",
    question: "What is the verification fee for?",
    answer:
      "The BDT 200 emergency verification fee funds the admin's manual review of your request, the eligibility check on candidate donors, and the audit trail that protects both sides. It is fully refundable if no donor is assigned.",
  },
  {
    category: "Request",
    question: "How long until a donor is assigned?",
    answer:
      "Most requests are assigned within 12 minutes of admin verification. The status timeline on the request detail page reflects every state change (PENDING → VERIFIED → MATCHING → ASSIGNED → COMPLETED).",
  },
  {
    category: "Payment",
    question: "Is there a fee to use the platform?",
    answer:
      "Signing up and posting a standard request is free. The verification fee is optional and only charged to unlock priority matching.",
  },
  {
    category: "Payment",
    question: "How does the SSLCommerz payment work?",
    answer:
      "When you click “Pay verification fee” you are redirected to the SSLCommerz sandbox gateway. On success you return to /payment/success with a receipt; on cancel or failure you return to /payment/cancel.",
  },
  {
    category: "Privacy",
    question: "Who can see my contact details?",
    answer:
      "Your phone number is only revealed to the admin handling your case and the donor assigned to you. It is never shown on a public profile.",
  },
  {
    category: "Privacy",
    question: "Is my medical data shared with anyone?",
    answer:
      "No. Your donor profile (blood group, weight, age) is visible to admins and requesters for matching only. Medical history you share in private messages is not stored on the platform.",
  },
];

const CATEGORIES: Array<FaqItem["category"] | "All"> = [
  "All",
  "Eligibility",
  "Compatibility",
  "Request",
  "Payment",
  "Privacy",
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<FaqItem["category"] | "All">("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const visible =
    activeCategory === "All" ? FAQS : FAQS.filter((f) => f.category === activeCategory);

  return (
    <section className="container-app section-pad">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-muted-foreground">
          Everything you need to know about donating, requesting, paying, and
          staying private on the platform.
        </p>
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setActiveCategory(cat);
              setOpenIndex(0);
            }}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-4 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              activeCategory === cat
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <ul className="mx-auto mt-8 max-w-3xl space-y-3">
        {visible.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <li
              key={item.question}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wide",
                      isOpen
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.category[0]}
                  </span>
                  <span className="text-sm font-semibold text-foreground md:text-base">
                    {item.question}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
              {isOpen ? (
                <div className="border-t border-border bg-muted/30 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-muted-foreground">
        Still have a question?{" "}
        <a
          href="/contact"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Send us a note
        </a>
        .
      </p>
    </section>
  );
}

