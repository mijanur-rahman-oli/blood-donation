# 🩸 Blood Donation & Emergency Platform - Frontend

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

A production-quality **Next.js 16 App Router** frontend for a Blood Donation & Emergency Platform that connects **Donors**, **Requesters**, and **Admins** through a live backend API. Built with strict Server/Client component separation, role-based access control, URL state synchronization, real SSLCommerz payments, Cloudinary uploads, and a modern responsive UI.

---

## 🔗 Live URLs

| Resource | URL |
|----------|-----|
| **Live Frontend** | https://blood-donation-eta-three.vercel.app/ |
| **Live Backend API** | https://blood-donation-server-weld-psi.vercel.app/api/v1 |
| **Backend Repository** | https://github.com/mijanur-rahman-oli/blood-donation-server |
| **Frontend Repository** | https://github.com/mijanur-rahman-oli/blood-donation |
| **API Documentation** | https://documenter.getpostman.com/view/53486112/2sBYAxPUvk |
| **Demo Video** | https://drive.google.com/file/d/1-V5cJ2lzM7WPQoIjCsQQxmfp4IaPWk3f/view |

---

## 🔑 Demo Credentials

You can test all three roles using the **one-click demo buttons** on the login page — no typing needed.

If you prefer to type them manually:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@blooddonation.com` | `Admin@12345` |
| **Requester** | `requester@example.com` | `Requester@12345` |
| **Donor** | `karim.donor@example.com` | `Donor@12345` |

---

## ✨ Features

### Public
- **Landing page** with hero, live stats, how-it-works, blood compatibility chart, testimonials
- **About / Services / Contact / FAQ** pages with SEO metadata
- Blood-group compatibility matrix (8×8 interactive grid)

### Authentication
- Login with **3 one-click demo buttons** for Admin, Donor, and Requester
- Google Sign-In integration
- Registration with role selector (Donor or Requester)
- httpOnly cookie sessions — no token exposure to client-side JavaScript
- Silent refresh-token rotation on 401
- Middleware-based route protection for `/admin`, `/dashboard`, `/donor`

### Requester (Patient / Hospital / Family)
- Dashboard with request stats
- **3-step blood request wizard** with per-step Zod validation
- Request detail page with vertical status timeline
- **SSLCommerz sandbox payment integration** for emergency verification fees
- Payment history with receipts
- Profile settings

### Donor
- Availability toggle (online/offline)
- Compatible blood requests feed (filtered by blood group compatibility)
- Assignment accept / reject / mark-donated workflow
- Donation history with stats
- Donor profile with Cloudinary avatar upload
- Eligibility status (90-day interval rule)

### Admin
- Analytics dashboard with **Recharts** line + pie charts and KPI cards
- User management — filter, search, change role, block/unblock
- Blood request verification + donor assignment via match dialog
- Audit log viewer with filters

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router, Turbopack) | SSR, routing, server components |
| **Language** | TypeScript (strict, no `any`) | Type safety |
| **Styling** | Tailwind CSS v4 + shadcn/ui + Radix | Accessible, modern UI |
| **Server State** | TanStack Query v5 | Caching, refetching, optimistic updates |
| **Client State** | Zustand | Auth session only |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **HTTP** | Fetch with server-side proxies | CORS-free API access |
| **Auth** | JWT via httpOnly cookies | Secure session |
| **Charts** | Recharts | Admin analytics |
| **Icons** | Lucide React | Consistent iconography |
| **Toasts** | Sonner | User feedback |
| **Images** | next/image + Cloudinary | Optimized delivery + uploads |
| **Payments** | SSLCommerz sandbox | Real redirect-based checkout |
| **Fonts** | next/font (Inter) | Zero layout shift |
| **Deployment** | Vercel | Edge network + preview deploys |

---

## 🏗️ Architecture Highlights

### Server Components by Default
Every page is a Server Component unless it needs interactivity. Only these are Client Components:
- Forms (login, register, blood-request wizard, profile)
- Interactive lists (admin tables with filters, donor assignment cards)
- Anything using `useSearchParams`, `usePathname`, `useRouter`
- Anything using TanStack Query or Zustand

### Route Groups
```
src/app/
├── (auth)/          → Login, Register (no Navbar/Footer)
├── (public)/        → Home, About, Services, Contact, FAQ (Navbar + Footer)
├── admin/           → Admin dashboard (admin sidebar only)
├── dashboard/       → Requester area (requester sidebar only)
├── donor/           → Donor area (donor sidebar only)
└── payment/         → Success/cancel landing pages
```

### API Proxy Pattern
The browser **never** talks to the external backend directly. Instead, all requests go through `src/app/api/*` route handlers on the Next.js server, which forward to the backend using the httpOnly cookie. This eliminates CORS issues and keeps tokens out of JavaScript.

```
Browser → /api/blood-requests → Next.js route handler → backend
                                    (with Bearer token from cookie)
```

### Role-Based Route Protection
`src/proxy.ts` (formerly `middleware.ts`) runs on the edge and:
1. Decodes the JWT from the `accessToken` cookie
2. Normalizes the role claim
3. Checks it against the required role for the route prefix
4. Redirects to `/login` or `/unauthorized` on mismatch

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm / pnpm / yarn

### Setup

```bash
# 1. Clone
git clone https://github.com/mijanur-rahman-oli/blood-donation.git
cd blood-donation

# 2. Install
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local and fill in the values (see next section)

# 4. Run dev
npm run dev
# → http://localhost:3000
```

### Build for production

```bash
npm run build
npm start
```

### Lint + type-check

```bash
npm run lint
npx tsc --noEmit
```

---

## 🧪 Environment Variables

Create `.env.local` in the project root with:

```env
# Backend API base URL (server-side proxy uses this)
NEXT_PUBLIC_API_URL=https://blood-donation-server-weld-psi.vercel.app/api/v1

# Public app URL (used in metadata, sitemap)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth Client ID (Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>

# Cloudinary (unsigned upload preset for donor avatars)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your-upload-preset>
```

A template is available at `.env.local.example` — never commit `.env.local`.

---

## 📁 Project Structure

```
blood-donation/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (Providers, Toaster)
│   │   ├── page.tsx                  # Home
│   │   ├── providers.tsx             # React Query + auth hydration
│   │   ├── (auth)/login/             # Login page + demo buttons
│   │   ├── (auth)/register/          # Register page
│   │   ├── admin/                    # Admin dashboard + sub-pages
│   │   ├── dashboard/                # Requester area + wizard
│   │   ├── donor/                    # Donor area + profile
│   │   ├── payment/success/          # SSLCommerz success landing
│   │   ├── payment/cancel/           # SSLCommerz cancel landing
│   │   ├── api/                      # Server-side proxies
│   │   └── not-found.tsx + error.tsx # Utilities
│   ├── components/
│   │   ├── ui/                       # shadcn primitives
│   │   └── shared/                   # Navbar, DataTable, etc.
│   ├── hooks/                        # useAuth, useRole, useDebounce, ...
│   ├── lib/
│   │   ├── api/                      # One module per backend resource
│   │   ├── axios.ts
│   │   ├── constants.ts
│   │   ├── zod-schemas.ts
│   │   └── utils.ts
│   ├── store/                        # Zustand auth store
│   ├── types/                        # Global TypeScript types
│   └── proxy.ts                      # Middleware (route protection)
├── public/
├── .env.local.example
├── components.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md                          # this file
└── PROJECT.md                         # full architecture doc
```

---

## 💳 Payment Flow (SSLCommerz Sandbox)

1. Requester opens a blood request → clicks **Pay Verification Fee**
2. Frontend calls `POST /api/payments/initiate` → returns `{ paymentId, gatewayPageURL }`
3. Browser redirects to `gatewayPageURL` (SSLCommerz sandbox)
4. User completes payment using test card:
   - Card: `4111111111111111`
   - Expiry: any future date (e.g. `12/25`)
   - CVV: `123`
   - OTP: `123456`
5. SSLCommerz POSTs back to backend `/payments/success`
6. Backend re-validates with SSLCommerz's server and marks the payment as **PAID**
7. Backend redirects browser to `http://localhost:3000/payment/success?tran_id=...`
8. Frontend fetches the payment and renders the receipt

**Test card details (SSLCommerz sandbox):**
```
Card Number : 4111111111111111
Expiry      : 12/25
CVV         : 123
OTP         : 123456
```

---

## 🌍 Deployment

Deployed on **Vercel** with automatic preview deploys per branch.

### Deploy yourself

```bash
npm i -g vercel
vercel
```

Set the following in Vercel → Project Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://blood-donation-server-weld-psi.vercel.app/api/v1
NEXT_PUBLIC_APP_URL=https://blood-donation-eta-three.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```

### Post-deploy checklist

- [ ] Backend `CORS_ORIGIN` includes the Vercel frontend URL
- [ ] Backend `SSLCOMMERZ_SUCCESS_URL` / `FAIL_URL` / `CANCEL_URL` / `IPN_URL` point to the backend (not frontend)
- [ ] Google Cloud Console → Authorized JavaScript origins include the Vercel URL
- [ ] All 3 demo logins work on the live site

See `docs/DEPLOYMENT.md` for the full step-by-step guide.

---

## 📚 Documentation

| Document | Contents |
|----------|----------|
| `PROJECT.md` | Full architecture, design system, page inventory, rubric alignment |
| `docs/DEPLOYMENT.md` | Step-by-step deployment guide |
| `docs/DEMO_SCRIPT.md` | 5–10 minute video walkthrough script |
| `docs/COMMITS.md` | Suggested commit message sequence |
| `docs/RUBRIC.md` | Rubric category → evidence mapping |

---

## 🎯 Rubric Alignment

| Category | Weight | How This Project Satisfies It |
|----------|:------:|------------------------------|
| UI/UX & Responsiveness | 20% | Tailwind + shadcn, mobile-first, dark mode ready, WCAG AA, 28+ pages |
| Next.js Architecture | 15% | Server Components default, loading/error/not-found per group, route groups, middleware |
| Auth & Authorization | 15% | JWT httpOnly cookies, `/api/auth` proxies, middleware role checks, RoleGuard, 3-role UI |
| API Integration & State | 15% | TanStack Query caching, Zustand, optimistic updates, 4-state lists |
| Form Handling & Validation | 10% | RHF + Zod on every form, 3-step wizard, inline errors |
| Performance & Optimization | 10% | next/image, next/font, code splitting, URL state sync |
| Code Quality & Reusability | 5% | Custom hooks, no `any`, typed APIs, shared components |
| Deployment | 5% | Vercel live URL + env vars + backend CORS configured |
| Commit History | 2% | 25+ meaningful commits |
| Video Explanation | 3% | 10-minute walkthrough |
| **Bonus** | — | Real SSLCommerz, Cloudinary uploads, Google OAuth, Recharts analytics |

---

## 🧪 Testing Checklist

Before considering the app complete, verify:

- [ ] Admin demo login → `/admin` loads with charts
- [ ] Donor demo login → `/donor` loads with availability toggle
- [ ] Requester demo login → `/dashboard` loads
- [ ] Wrong role accessing `/admin` → redirected to `/unauthorized`
- [ ] Create blood request via 3-step wizard → redirects to detail
- [ ] Pay verification fee → SSLCommerz sandbox → success page
- [ ] Filters + pagination update the URL, refresh preserves state
- [ ] Empty state shown for lists with no data
- [ ] Skeleton loaders on all data-fetching pages
- [ ] Toast on every mutation success/error
- [ ] Mobile layout: every page works at 375px width
- [ ] Lighthouse: Performance ≥ 85, A11y ≥ 90
- [ ] No console errors on any page
- [ ] No `any` in TypeScript

---

## 🆘 Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error on login | Add the frontend URL to the backend `CORS_ORIGIN` env var and redeploy the backend |
| 401 loop on refresh | Verify `accessToken` / `refreshToken` cookies are set with `SameSite=Lax`, `Secure` (prod) |
| Payment redirect 404 | Backend's `SSLCOMMERZ_SUCCESS_URL` env var must point to the **backend**, not the frontend |
| `/payment/success` shows "Payment ID missing" | Frontend reads `?tran_id=` from the backend redirect |
| Hydration mismatch on inputs | Browser extensions (LastPass, 1Password) inject `fdprocessedid` — mitigated with `suppressHydrationWarning` |
| Cloudinary upload fails | Confirm the upload preset is **unsigned** in the Cloudinary dashboard |
| Google Sign-In popup blocked | Add the frontend origin to Google Cloud Console → Authorized JavaScript origins |

---

## 📄 License

MIT — free to use for educational and portfolio purposes.

---

## 👤 Author

**Mijanur Rahman Oli**
- GitHub: [@mijanur-rahman-oli](https://github.com/mijanur-rahman-oli)
- Frontend Repo: [blood-donation](https://github.com/mijanur-rahman-oli/blood-donation)
- Backend Repo: [blood-donation-server](https://github.com/mijanur-rahman-oli/blood-donation-server)

---

**Last updated**: 2026-10-10