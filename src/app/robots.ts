import type { MetadataRoute } from "next";

/* ----------------------------------------------------------------------
   robots.ts
   ----------------------------------------------------------------------
   Disallow protected areas and the /api tree. Sitemap URL is taken from
   NEXT_PUBLIC_APP_URL with a localhost fallback for development.
   ---------------------------------------------------------------------- */

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/donor", "/api"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
