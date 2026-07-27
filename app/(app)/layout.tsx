import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyKitchens, getActiveKitchen } from "@/lib/kitchen";
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

  if (!user) redirect("/login");

  const kitchens = await getMyKitchens();
  const activeKitchen = await getActiveKitchen(kitchens);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "Account";

  return (
    <>
      <Nav
        kitchens={kitchens}
        activeKitchenId={activeKitchen?.id ?? null}
        userName={userName}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
