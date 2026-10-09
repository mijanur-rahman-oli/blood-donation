import { Suspense } from "react";

import { LoginForm } from "./LoginForm";

/* ----------------------------------------------------------------------
   /login — server wrapper
   ----------------------------------------------------------------------
   Next.js 15+ requires `useSearchParams()` to live inside a
   <Suspense> boundary so the static prerender pass can render the
   surrounding shell. The form itself is in <LoginForm /> (a Client
   Component).
   ---------------------------------------------------------------------- */

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
