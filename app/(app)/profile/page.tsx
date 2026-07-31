import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { formatAllergies } from "@/lib/diet";
import type { DietType } from "@/lib/diet";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, allergies, diet_type, serving_multiplier, target_calories, target_protein_g, target_carbs_g, target_fat_g, target_fiber_g",
    )
    .eq("id", user!.id)
    .maybeSingle();

  const { data: favorites } = await supabase
    .from("profile_favorite_recipes")
    .select("recipe_id, position")
    .eq("profile_id", user!.id)
    .order("position");

  const { data: recipeRows } = await supabase
    .from("recipes")
    .select("id, title")
    .or(`owner_id.eq.${user!.id},is_public.eq.true`)
    .order("title");

  const favByPos = new Map(
    (favorites ?? []).map((f) => [f.position, f.recipe_id]),
  );
  const favoriteIds: [string, string, string] = [
    favByPos.get(1) ?? "",
    favByPos.get(2) ?? "",
    favByPos.get(3) ?? "",
  ];

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Your profile"
        description="Diet preferences, allergies, portion size, nutrition targets, and favorite meals. Kitchen members can see these when planning."
      />
      <ProfileForm
        displayName={profile?.display_name ?? ""}
        dietType={(profile?.diet_type as DietType) ?? "all"}
        allergies={formatAllergies(profile?.allergies)}
        servingMultiplier={Number(profile?.serving_multiplier ?? 1)}
        macroTargets={{
          target_calories:
            profile?.target_calories != null
              ? Number(profile.target_calories)
              : null,
          target_protein_g:
            profile?.target_protein_g != null
              ? Number(profile.target_protein_g)
              : null,
          target_carbs_g:
            profile?.target_carbs_g != null
              ? Number(profile.target_carbs_g)
              : null,
          target_fat_g:
            profile?.target_fat_g != null ? Number(profile.target_fat_g) : null,
          target_fiber_g:
            profile?.target_fiber_g != null
              ? Number(profile.target_fiber_g)
              : null,
        }}
        favoriteIds={favoriteIds}
        recipes={(recipeRows ?? []) as { id: string; title: string }[]}
      />
    </div>
  );
}
