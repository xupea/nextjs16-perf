import { Suspense } from "react";
import { cookies } from "next/headers";
import { cacheLife } from "next/cache";

import HomeShell from "@/app/components/HomeShell";
import { getCurrentUserFromToken } from "@/app/lib/auth";

export default function HomePage() {
  return (
    <Suspense fallback={<CachedGuestShell />}>
      <ResolvedHomePage />
    </Suspense>
  );
}

async function CachedGuestShell() {
  "use cache";
  cacheLife("days");

  return <HomeShell key="guest" initialView="guest" />;
}

async function ResolvedHomePage() {
  const sessionToken = (await cookies()).get("session")?.value;
  const user = await getCurrentUserFromToken(sessionToken);

  if (!user) {
    return <CachedGuestShell />;
  }

  return <HomeShell key={user.id} initialView="lobby" initialUser={user} />;
}
