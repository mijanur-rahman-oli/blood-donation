import Link from "next/link";

import { APP_NAME, APP_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------
   Footer
   ----------------------------------------------------------------------
   Static footer with brand, link columns, contact info, and copyright.
   Renders server-side (no client hooks), keeping the chrome cheap.
   ---------------------------------------------------------------------- */

const PRODUCT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
] as const;

const ACCOUNT_LINKS = [
  { href: "/login", label: "Log in" },
  { href: "/register", label: "Create account" },
] as const;

const LEGAL_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About us" },
] as const;

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "mt-auto border-t border-border bg-muted/30",
        className,
      )}
    >
      <div className="container-app py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-base font-semibold text-foreground"
            >
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 2c-1 4-6 6-6 12a6 6 0 0 0 12 0c0-6-5-8-6-12Z" />
                </svg>
              </span>
              {APP_NAME}
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Connecting donors, requesters, and admins on a fast, verified
              blood-donation platform.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Account</h4>
            <ul className="space-y-2 text-sm">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:support@${domainOf(APP_URL)}`}
                  className="transition-colors hover:text-foreground"
                >
                  support@{domainOf(APP_URL)}
                </a>
              </li>
              <li>
                <a
                  href="tel:+8801700000000"
                  className="transition-colors hover:text-foreground"
                >
                  +880 1700-000000
                </a>
              </li>
              <li>
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {year} {APP_NAME}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "blood-donation.app";
  }
}
