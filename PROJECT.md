# 🩸 Blood Donation & Emergency Platform — Frontend

> **Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · Zustand · React Hook Form + Zod**

A production-quality frontend for a Blood Donation & Emergency Platform, connecting **Donors**, **Requesters**, and **Admins** with a live backend API. Built with strict App Router architecture, role-based access, URL state synchronization, real SSLCommerz payments, and modern responsive UI.

---

## 🔗 Live Links

| Resource | URL |
|----------|-----|
| **Frontend (Vercel)** | `https://<your-app>.vercel.app` |
| **Backend API** | `https://blood-donation-server-weld-psi.vercel.app/api/v1` |
| **Backend Docs** | See `BACKEND.md` |
| **Postman Collection** | `postman/Blood-Donation-Platform.postman_collection.json` |

---

## ⚠️ CRITICAL — WORKING DIRECTORY (READ FIRST)

**The project root is the CURRENT WORKING DIRECTORY.** That directory contains:

- `package.json`
- `next.config.mjs`
- `tailwind.config.ts`
- `tsconfig.json`
- `components.json`
- `src/` (with `app/`, `components/`, `lib/`, `hooks/`, `store/`, `types/`)
- `PROJECT.md` (this file)

### Rules (MANDATORY — enforce on every write)

1. **NEVER** create a folder named `blood-donation` inside the project.
2. **NEVER** create a folder named `blood-donation-client` inside the project.
3. **NEVER** prefix any file path with a project-name folder. The root is `.` — not `blood-donation/`, not `blood-donation-client/`.
4. When asked to create `src/components/shared/Footer.tsx`, write to `./src/components/shared/Footer.tsx` — **NOT** to `./blood-donation/src/components/shared/Footer.tsx`.
5. If a nested `blood-donation/` or `blood-donation-client/` folder already exists, **ignore it and use the outer files.** Do not touch the nested folder, do not move files into it, do not recreate it.
6. All paths in this document are **relative to the current working directory** (the folder containing `package.json`).
7. Every file output must include its full contents — no `// ...`, no truncation, no placeholders.

---

## 🎯 Project Overview

### The Problem
Patients and hospitals often need blood **urgently** and have no fast, reliable way to find **compatible, available, medically-eligible donors** nearby. Existing solutions are fragmented — phone trees, WhatsApp groups, Facebook posts — and rely on luck and manual coordination.

### The Solution
A three-role platform that:
1. Lets a **Requester** create a verified blood request in under 60 seconds.
2. Lets an **Admin** verify, match, and assign the right donor using a blood-compatibility + eligibility algorithm.
3. Lets a **Donor** accept, donate, and build a lifetime donation history — all with real-time status updates.
4. Handles **payments** (SSLCommerz) for optional emergency coordination/verification fees.

### Users & Roles (exactly 3)

| Role | Who | Can Do | Cannot Do |
|------|-----|--------|-----------|
| **DONOR** | Registered blood donor | Manage donor profile, view compatible requests, accept/reject/complete assignments, view donation history | Create blood requests, access admin panel, search all donors |
| **REQUESTER** | Patient / Hospital / Family | Create blood requests, edit own requests, view matches, pay verification fees, view own payment history | Manage donors, verify requests, access admin panel |
| **ADMIN** | Platform operator | Verify requests, assign donors, manage users (role/status), view audit logs, view dashboard analytics | Create own blood requests unless also a requester |

---

## 🏗️ Architecture

### Stack (Locked)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) + TypeScript (strict, no `any`) | SSR, routing, server components |
| **Styling** | Tailwind CSS + shadcn/ui + Radix primitives | Accessible, modern UI |
| **Server State** | TanStack Query v5 | Caching, refetching, optimistic updates |
| **Client State** | Zustand (auth only) | Session, role, current user |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **HTTP** | Axios + interceptors | Bearer tokens, refresh on 401 |
| **Auth** | JWT (access + refresh) via httpOnly cookies | Secure session |
| **Charts** | Recharts | Admin analytics |
| **Icons** | Lucide React | Consistent iconography |
| **Toasts** | Sonner | User feedback |
| **Images** | next/image + Cloudinary | Optimized delivery + uploads |
| **Payments** | SSLCommerz sandbox | Redirect-based checkout |
| **Fonts** | next/font (Inter) | No layout shift |

### Folder Structure

> **Root = current working directory (the folder containing `package.json`).**  
> All paths below are relative to that root. Do NOT create any `blood-donation/` or `blood-donation-client/` folder.

```
.  (project root)
├── src/
│   ├── app/
│   │   ├── layout.tsx                     Root layout (Providers, Toaster, Navbar)
│   │   ├── page.tsx                       Home (Server Component)
│   │   ├── globals.css
│   │   ├── providers.tsx
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   │
│   │   ├── (public)/
│   │   │   ├── about/page.tsx
│   │   │   ├── services/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── faq/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx             ⭐ One-click demo login
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── login/route.ts         Server proxy → sets httpOnly cookie
│   │   │       ├── logout/route.ts
│   │   │       ├── me/route.ts
│   │   │       ├── refresh/route.ts
│   │   │       ├── register/route.ts
│   │   │       └── google/route.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx                 RoleGuard(ADMIN)
│   │   │   ├── page.tsx                   Dashboard + charts
│   │   │   ├── users/page.tsx
│   │   │   ├── requests/page.tsx
│   │   │   ├── audit-logs/page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   │
│   │   ├── dashboard/                     REQUESTER area
│   │   │   ├── layout.tsx                 RoleGuard(REQUESTER)
│   │   │   ├── page.tsx
│   │   │   ├── requests/
│   │   │   │   ├── new/page.tsx           ⭐ 3-step wizard
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   │
│   │   ├── donor/                         DONOR area
│   │   │   ├── layout.tsx                 RoleGuard(DONOR)
│   │   │   ├── page.tsx                   Assignments + availability toggle
│   │   │   ├── requests/page.tsx          Compatible requests
│   │   │   ├── history/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   │
│   │   └── payment/
│   │       ├── success/page.tsx
│   │       └── cancel/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                            shadcn primitives
│   │   └── shared/
│   │       ├── Navbar.tsx                 Role-aware
│   │       ├── Footer.tsx
│   │       ├── RoleGuard.tsx
│   │       ├── DataTable.tsx              Generic, URL-synced
│   │       ├── StatCard.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── SearchInput.tsx            Debounced, URL-synced
│   │       ├── Pagination.tsx             URL-synced
│   │       ├── EmptyState.tsx
│   │       ├── FormField.tsx
│   │       └── BloodCompatibilityChart.tsx
│   │
│   ├── lib/
│   │   ├── axios.ts                       Interceptors + refresh
│   │   ├── queryClient.ts
│   │   ├── utils.ts                       cn()
│   │   ├── constants.ts
│   │   ├── zod-schemas.ts
│   │   └── api/
│   │       ├── _errors.ts
│   │       ├── auth.ts
│   │       ├── users.ts
│   │       ├── donors.ts
│   │       ├── bloodRequests.ts
│   │       ├── assignments.ts
│   │       ├── donations.ts
│   │       ├── payments.ts
│   │       └── admin.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRole.ts
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   └── useUpdateSearchParams.ts
│   │
│   ├── store/
│   │   └── authStore.ts                   Zustand
│   │
│   ├── types/
│   │   └── index.ts                       All API types
│   │
│   └── middleware.ts                      Route protection
│
├── public/
├── .env.local.example
├── .env.local                             (gitignored)
├── components.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── PROJECT.md                             ← this file
└── README.md
```

---

## 🔌 Backend Integration

### Base URL
```
https://blood-donation-server-weld-psi.vercel.app/api/v1
```

### Response Envelope (every response)
```typescript
// Success
{ success: true, message: string, data: T }

// Error
{ success: false, message: string, errors?: Array<{ path: string, message: string }> }

// List endpoints wrap data as:
data: {
  meta: { page: number, limit: number, total: number, totalPages: number },
  result: T[]
}
```

### Endpoint Map (all 41 endpoints covered)

#### Auth
| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/auth/register` | `{ name, email, password, role, phone }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/google` | `{ idToken, role }` | `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh-token` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/auth/logout` | `{ refreshToken }` | `null` |

#### Users
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/users/me` | — |
| PATCH | `/users/me` | `{ name?, phone? }` |

#### Donors
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/donors/profile` | `{ bloodGroup, location, weightKg, ageYears }` |
| GET | `/donors/profile` | Own profile |
| PATCH | `/donors/profile` | Partial update |
| PATCH | `/donors/availability` | `{ availability: boolean }` |
| GET | `/donors/requests` | Compatible blood-group requests |
| GET | `/donors/donation-history` | Own history |
| GET | `/donors/search` | `?bloodGroup=&availability=&location=&q=&page=&limit=` (Admin/Requester only) |

#### Blood Requests
| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/blood-requests` | Requester/Admin |
| GET | `/blood-requests` | Any (filtered by role) |
| GET | `/blood-requests/search` | Any |
| GET | `/blood-requests/:id` | Any |
| PATCH | `/blood-requests/:id` | Owner/Admin |
| DELETE | `/blood-requests/:id` | Owner/Admin (soft) |
| PATCH | `/blood-requests/:id/verify` | Admin |
| GET | `/blood-requests/:id/matches` | Admin/Requester |
| POST | `/blood-requests/:id/assign-donor` | Admin |

#### Assignments
| Method | Endpoint | Who |
|--------|----------|-----|
| GET | `/assignments/:id` | Any |
| PATCH | `/assignments/:id/accept` | Assigned Donor |
| PATCH | `/assignments/:id/reject` | Assigned Donor |
| PATCH | `/assignments/:id/complete` | Assigned Donor |

#### Donations
| Method | Endpoint | Who |
|--------|----------|-----|
| GET | `/donations` | Admin/Donor |
| GET | `/donations/:id` | Admin/Donor |

#### Payments
| Method | Endpoint | Who |
|--------|----------|-----|
| POST | `/payments/initiate` | Any auth'd user |
| GET | `/payments` | Own / Admin sees all |
| GET | `/payments/:id` | Owner/Admin |

#### Admin
| Method | Endpoint |
|--------|----------|
| GET | `/admin/users?role=&status=&q=&page=&limit=` |
| PATCH | `/admin/users/:id/role` |
| PATCH | `/admin/users/:id/status` |
| GET | `/admin/dashboard-stats` |
| GET | `/admin/audit-logs?action=&entityType=&page=&limit=` |
| GET | `/admin/blood-requests` |

### Enums

```typescript
type Role = 'DONOR' | 'REQUESTER' | 'ADMIN';
type BloodGroup = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' 
                | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type RequestStatus = 'PENDING' | 'VERIFIED' | 'MATCHING' | 'ASSIGNED' 
                   | 'COMPLETED' | 'CANCELLED';
type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
type UserStatus = 'ACTIVE' | 'BLOCKED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
type PaymentPurpose = 'EMERGENCY_VERIFICATION_FEE' | 'COORDINATION_FEE' | 'LOGISTICS_FEE';
```

---

## 🔐 Authentication & Authorization

### Login Flow
1. User submits credentials (or clicks a demo button).
2. Frontend POSTs to `/api/auth/login` (Next.js route handler).
3. Route handler POSTs to backend `/auth/login`.
4. On success, handler sets `accessToken` and `refreshToken` as **httpOnly, Secure, SameSite=Lax** cookies.
5. Handler returns `{ user }` to the client.
6. Zustand store hydrates from `/api/auth/me` route on app boot.

### Demo Accounts (used by one-click buttons)

| Role | Email | Password | Redirects To |
|------|-------|----------|--------------|
| **ADMIN** | `admin@blooddonation.com` | `Admin@12345` | `/admin` |
| **REQUESTER** | `requester@example.com` | `Requester@12345` | `/dashboard` |
| **DONOR** | `karim.donor@example.com` | `Donor@12345` | `/donor` |

### Middleware Protection

```
matcher: ['/admin/:path*', '/dashboard/:path*', '/donor/:path*']
```

- Decodes JWT from the `accessToken` cookie (via `jose`).
- No token → redirect to `/login?redirect=<original>`.
- Wrong role → redirect to `/unauthorized`.
- Expired access token → attempt silent refresh; if that fails, redirect to `/login`.

### Role-Based UI Rules

| Element | Donor | Requester | Admin |
|---------|:-----:|:---------:|:-----:|
| "Create Request" button | ❌ | ✅ | ✅ |
| "Verify Request" button | ❌ | ❌ | ✅ |
| "Assign Donor" button | ❌ | ❌ | ✅ |
| "Accept/Reject Assignment" | ✅ | ❌ | ❌ |
| "Pay Fee" button | ❌ | ✅ | ✅ |
| "Manage Users" link | ❌ | ❌ | ✅ |
| Admin sidebar | ❌ | ❌ | ✅ |
| Donor sidebar | ✅ | ❌ | ❌ |
| Requester sidebar | ❌ | ✅ | ❌ |

---

## 🎨 UI/UX Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#dc2626` (red-600) | Blood theme, CTAs |
| `--primary-hover` | `#b91c1c` (red-700) | Hover |
| `--background` | `#ffffff` / `#0a0a0a` | Page bg |
| `--foreground` | `#0a0a0a` / `#fafafa` | Text |
| `--muted` | `#f4f4f5` / `#27272a` | Subtle bg |
| `--border` | `#e4e4e7` / `#27272a` | Borders |
| `--success` | `#16a34a` | Completed status |
| `--warning` | `#ea580c` | Pending status |
| `--destructive` | `#dc2626` | Cancel/reject |
| `--info` | `#2563eb` | Assigned status |

### Typography Scale

- **Font**: Inter (via `next/font/google`)
- **Headings**: `text-4xl md:text-5xl font-bold tracking-tight`
- **Body**: `text-base leading-relaxed`
- **Small**: `text-sm text-muted-foreground`

### Spacing System

- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section padding: `py-16 md:py-24`
- Card padding: `p-6`

### Component Rules

1. **Every list page** must have 4 states: loading (skeleton), empty, error, success.
2. **Every form** uses RHF + Zod with `mode: 'onChange'`.
3. **Every table** on mobile becomes a stacked card list.
4. **Every interactive element** has a keyboard focus ring.
5. **Every color** meets WCAG AA contrast (4.5:1 minimum).
6. **Every image** uses `next/image` with width/height or fill.

---

## 📄 Pages (18+ Complete)

### Public (5)
| Route | Type | Features |
|-------|------|----------|
| `/` | Server | Hero, live stats, how-it-works, blood chart, CTA |
| `/about` | Server | Mission, story, team |
| `/services` | Server | Feature breakdown for donors + requesters |
| `/contact` | Client | Contact form (RHF+Zod) |
| `/faq` | Server | 12 FAQ accordion |

### Auth (2)
| Route | Features |
|-------|----------|
| `/login` | ⭐ Email/password form + **3 one-click demo buttons** + Google Sign-In + Register link |
| `/register` | RHF+Zod, role selector (DONOR / REQUESTER only) |

### Admin (4 + 2)
| Route | Features |
|-------|----------|
| `/admin` | 4 StatCards + Recharts line + pie + recent audit preview |
| `/admin/users` | DataTable + role/status filter + search + role-change dialog + block toggle |
| `/admin/requests` | All requests + filter + verify + find matches + assign donor |
| `/admin/audit-logs` | Filterable audit log table |
| `/admin/loading.tsx` | Skeleton |
| `/admin/error.tsx` | Error boundary |

### Requester (5 + 2)
| Route | Features |
|-------|----------|
| `/dashboard` | My requests + quick stats + New Request CTA |
| `/dashboard/requests/new` | ⭐ 3-step wizard (patient → location → contact) |
| `/dashboard/requests/[id]` | Detail + status timeline + Pay Fee button |
| `/dashboard/payments` | Payment history table |
| `/dashboard/profile` | PATCH /users/me form |
| `/dashboard/loading.tsx` | Skeleton |
| `/dashboard/error.tsx` | Error boundary |

### Donor (4 + 2)
| Route | Features |
|-------|----------|
| `/donor` | Assignments list with accept/reject/complete + availability toggle |
| `/donor/requests` | Compatible blood requests |
| `/donor/history` | Donation history table |
| `/donor/profile` | Create/edit donor profile + Cloudinary avatar |
| `/donor/loading.tsx` | Skeleton |
| `/donor/error.tsx` | Error boundary |

### Payment (2)
| Route | Features |
|-------|----------|
| `/payment/success` | Reads `?paymentId`, fetches, success animation + receipt |
| `/payment/cancel` | Retry CTA |

### Utility (2)
| Route | Features |
|-------|----------|
| `src/app/not-found.tsx` | Custom 404 with illustration |
| `src/app/error.tsx` | Global error boundary |

**Total: 28 pages** ✅ (exceeds 18 minimum)

---

## 🌐 URL State Synchronization

All filters, sorts, and pagination sync to the URL. Examples:

```
/admin/users?page=2&role=DONOR&status=ACTIVE&q=karim
/admin/requests?status=PENDING&priority=CRITICAL&sortBy=createdAt&sortOrder=desc
/donor/history?page=1&limit=10&sortBy=donationDate&sortOrder=desc
/blood-requests?bloodGroup=O_POSITIVE&location=sylhet&page=1
```

Use `useSearchParams()` + `useRouter().replace()` with `{ scroll: false }` — never `pushState` directly.

---

## 🔄 Data Fetching Strategy

| Scenario | Strategy |
|----------|----------|
| Public static content | Server Component, no cache |
| Home page stats | Server Component, `revalidate: 60` |
| User dashboard lists | Client Component + TanStack Query (`staleTime: 30s`) |
| Admin dashboard stats | TanStack Query (`staleTime: 2min`, backend caches 120s in Redis) |
| Donor search | TanStack Query (`staleTime: 60s`, URL-driven) |
| Single resource (detail) | TanStack Query (`staleTime: 5min`) |
| Mutations | `useMutation` + `queryClient.invalidateQueries()` on success |
| Optimistic updates | Assignment accept/reject, request cancel |

### Query Key Convention

```typescript
['auth', 'me']
['blood-requests', { page, status, priority, ...filters }]
['blood-requests', id]
['donors', 'profile']
['donors', 'search', filters]
['assignments', id]
['admin', 'users', { page, role, status, q }]
['admin', 'stats']
['admin', 'audit-logs', { page, action }]
['payments', { page }]
```

---

## 💳 Payment Flow (SSLCommerz)

```
Requester on /dashboard/requests/[id]
   │
   ▼
Click "Pay Verification Fee"
   │
   ▼
POST /payments/initiate
  { bloodRequestId, purpose: 'EMERGENCY_VERIFICATION_FEE',
    amount: 200, customerName, customerPhone }
   │
   ▼
Response: { paymentId, gatewayPageURL }
   │
   ▼
window.location.href = gatewayPageURL
   │
   ▼
User pays on SSLCommerz sandbox
   │
   ▼
SSLCommerz redirects to backend /payments/success
   │
   ▼
Backend re-validates with SSLCommerz, sets PAID, then redirects to
   │
   ▼
Frontend /payment/success?paymentId=xxx
   │
   ▼
Fetch GET /payments/:id → show receipt + success animation
```

**Required backend env (update + redeploy):**
```env
SSLCOMMERZ_SUCCESS_URL=https://<your-frontend>.vercel.app/payment/success
SSLCOMMERZ_CANCEL_URL=https://<your-frontend>.vercel.app/payment/cancel
SSLCOMMERZ_FAIL_URL=https://<your-frontend>.vercel.app/payment/cancel
```

---

## 🧪 Environment Variables

Create `.env.local` (never commit) with:

```env
NEXT_PUBLIC_API_URL=https://blood-donation-server-weld-psi.vercel.app/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (add http://localhost:3000 + Vercel URL as authorized origins)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>

# Cloudinary (create an unsigned upload preset)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your-unsigned-preset>
```

Also create `.env.local.example` with the same keys but empty values.

---

## 🚀 Getting Started

```bash
# 1. Install
npm install

# 2. Env
cp .env.local.example .env.local
# fill in your values

# 3. Dev
npm run dev
# → http://localhost:3000

# 4. Build
npm run build && npm start
```

---

## 🧪 Testing Checklist

Before deploying, verify:

- [ ] Admin demo login → `/admin` loads with charts
- [ ] Donor demo login → `/donor` loads with assignments
- [ ] Requester demo login → `/dashboard` loads with requests
- [ ] Wrong role accessing `/admin` → redirected
- [ ] Creating blood request wizard → completes, redirects to detail
- [ ] Pay verification fee → SSLCommerz sandbox → success page
- [ ] Filters + pagination update URL, refresh preserves state
- [ ] Empty state shown for lists with no data
- [ ] Skeleton loaders on all data-fetching pages
- [ ] Toast on every mutation success/error
- [ ] Mobile layout: every page works at 375px width
- [ ] Lighthouse: Performance ≥ 85, A11y ≥ 90
- [ ] No console errors on any page
- [ ] No `any` in TypeScript

---

## 📦 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars in Vercel dashboard:
#   NEXT_PUBLIC_API_URL
#   NEXT_PUBLIC_APP_URL
#   NEXT_PUBLIC_GOOGLE_CLIENT_ID
#   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
#   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

**After deploy:**
1. Add Vercel URL to backend `CORS_ORIGIN`
2. Add Vercel URL to SSLCommerz callback URLs
3. Add Vercel URL to Google OAuth authorized origins

---

## 🎬 Demo Video Script (5-10 min)

| Time | Section | Show |
|------|---------|------|
| 0:00 | Intro | Project name, problem, 3 roles |
| 0:30 | UI/UX | Home responsive (mobile → desktop) |
| 1:30 | Architecture | DevTools: Server Component HTML on Home |
| 2:30 | Auth | Click Admin demo → `/admin` → click Donor demo → `/donor` |
| 3:30 | State | Network tab: second admin dashboard load is instant (cache) |
| 4:30 | Forms | Blood request wizard: empty submit → Zod errors → valid submit |
| 6:00 | Payment | Create request → Pay → SSLCommerz sandbox → success page |
| 7:30 | Admin ops | Verify request → find matches → assign donor |
| 8:30 | Donor ops | Accept assignment → complete → history updates |
| 9:30 | Deploy | Vercel dashboard + live URL |

---

## 📝 Commit Convention

25 meaningful commits (feat/fix/chore/docs/refactor):

```
chore: initialize Next.js 15 with TypeScript + Tailwind
chore: configure shadcn/ui + install base components
feat: add axios client with refresh-token interceptor
feat: define TypeScript types for all API responses
feat: add Zustand auth store with hydration
feat: add TanStack Query provider and query client
feat: add Zod schemas for all forms
feat: add API layer — auth, users, donors modules
feat: add API layer — blood requests, assignments modules
feat: add API layer — payments, admin modules
feat: add shared DataTable with URL-synced sort and pagination
feat: add shared Navbar, Footer, StatusBadge, StatCard
feat: add BloodCompatibilityChart component
feat: add root layout with Inter font and Toaster
feat: add middleware with JWT role-based route protection
feat: add /api/auth proxy routes for httpOnly cookie session
feat: build Home page with hero and live stats
feat: build About, Services, Contact, FAQ pages
feat: build Login with 3 one-click demo buttons + Google Sign-In
feat: build Register page with role selector
feat: build Admin dashboard with Recharts analytics
feat: build Admin users management with filters
feat: build Admin requests with verify + assign donor flow
feat: build Requester 3-step blood request wizard
feat: build Donor assignments, history, profile with Cloudinary upload
feat: integrate SSLCommerz payment redirect flow
feat: add sitemap, robots, custom 404, error boundaries
fix: resolve hydration mismatch in Navbar role rendering
docs: add PROJECT.md and README with setup guide
```

---

## ✅ Rubric Alignment

| Category | Weight | How this project satisfies it |
|----------|:------:|------------------------------|
| UI/UX & Responsiveness | 20% | Tailwind + shadcn, mobile-first, dark mode ready, WCAG AA, 28 pages |
| Next.js Architecture | 15% | Server Components default, loading/error/not-found per group, layouts |
| Auth & Authorization | 15% | JWT httpOnly cookies, middleware, RoleGuard, 3-role UI |
| API Integration & State | 15% | TanStack Query, Zustand, optimistic updates, skeletons |
| Forms & Validation | 10% | RHF + Zod on every form, 3-step wizard |
| Performance | 10% | next/image, next/font, code splitting, URL state |
| Code Quality | 5% | Custom hooks, no `any`, reusable components, typed APIs |
| Deployment | 5% | Vercel + env vars + CORS + callback URLs configured |
| Commits | 2% | 25 meaningful commits |
| Video | 3% | Structured 10-min walkthrough |
| **Bonus** | — | Real SSLCommerz, Cloudinary, Google OAuth, Recharts analytics |

---

## 🆘 Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error on login | Add frontend URL to backend `CORS_ORIGIN`, redeploy backend |
| 401 loop on refresh | Verify refresh token cookie is not expired and rotation is handled |
| Payment redirect 404 | Update SSLCommerz success/cancel URLs in backend `.env` |
| Hydration mismatch | Ensure Navbar and auth-dependent UI render after `useEffect` or from cookie |
| Cloudinary upload fails | Confirm unsigned preset is enabled + upload preset name correct |
| Google Sign-In popup blocked | Add origin to Google Cloud Console authorized origins |
| Tool creates nested `blood-donation/` folder | Re-read the "CRITICAL — WORKING DIRECTORY" section above |

---

## 📄 License

MIT — free to use for educational and portfolio purposes.

---

**Last updated**: _fill on first commit_
**Maintainer**: _your name_
**Live URL**: _add after Vercel deploy_
**Repo**: _add after push_