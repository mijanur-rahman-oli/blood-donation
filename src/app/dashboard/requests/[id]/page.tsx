import RequestDetail from "@/components/dashboard/RequestDetail";

/* ----------------------------------------------------------------------
   /dashboard/requests/[id] — Server wrapper
   ----------------------------------------------------------------------
   The page is a thin Server Component that pulls the dynamic `id`
   segment and hands it to the client <RequestDetail />. The actual
   fetching, mutations, dialogs, and the payment redirect live in the
   client component so they can use TanStack Query.
   ---------------------------------------------------------------------- */

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RequestDetail id={id} />;
}
