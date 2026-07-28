import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyKitchens, getActiveKitchen } from "@/lib/kitchen";
import { REQUIRE_AUTH } from "@/lib/auth-config";
import { Nav } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // In open mode the proxy establishes a guest session; this is a fallback in
  // case it didn't (e.g. first hit that bypassed the proxy).
  if (!user) redirect(REQUIRE_AUTH ? "/login" : "/auth/guest?next=/planner");

  const isGuest = user.is_anonymous ?? false;

  const kitchens = await getMyKitchens();
  const activeKitchen = await getActiveKitchen(kitchens);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = isGuest
    ? "Guest"
    : (profile?.display_name ?? user.email?.split("@")[0] ?? "Account");

  return (
    <>
      <Nav
        kitchens={kitchens}
        activeKitchenId={activeKitchen?.id ?? null}
        userName={userName}
        isGuest={isGuest}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
