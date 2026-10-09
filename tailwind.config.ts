import type { Config } from "tailwindcss";

/**
 * Tailwind v4 prefers CSS-based theming via `@theme` in `globals.css`.
 * This config file is kept to (a) declare the shadcn content sources and
 * (b) register the project-specific status color tokens (success, warning,
 * info) so utility classes like `bg-success`, `text-warning`, etc. resolve
 * correctly across the design system.
 *
 * Color tokens come from PROJECT.md -> "UI/UX Design System > Color Palette".
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/store/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand: blood-red primary.
        primary: {
          DEFAULT: "#dc2626", // red-600
          hover: "#b91c1c", // red-700
          foreground: "#ffffff",
        },

        // Status palette used by StatusBadge, timeline nodes, and toasts.
        success: "#16a34a", // COMPLETED
        warning: "#ea580c", // PENDING
        destructive: {
          DEFAULT: "#dc2626", // CANCELLED / REJECTED
          foreground: "#ffffff",
        },
        info: "#2563eb", // ASSIGNED

        // Semantic shadcn tokens (kept aligned with CSS variables in globals.css).
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
        },
        screens: {
          "2xl": "1280px",
        },
      },
    },
  },
  plugins: [],
};

export default config;
