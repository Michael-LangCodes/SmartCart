import { Users, LogOut, Trash2, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyKitchens, getActiveKitchen } from "@/lib/kitchen";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreateKitchenForm,
  JoinKitchenForm,
  InviteCode,
} from "@/components/kitchen-forms";
import {
  AddKitchenPersonForm,
  KitchenPeopleList,
} from "@/components/kitchen-people";
import { leaveKitchen, deleteKitchen } from "./actions";
import { dietLabel, formatAllergies } from "@/lib/diet";
import type { KitchenMember, KitchenPerson, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type FavRow = {
  person_id: string;
  recipe_id: string;
  position: number;
  recipes: { id: string; title: string } | null;
};

export default async function KitchensPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const kitchens = await getMyKitchens();
  const active = await getActiveKitchen(kitchens);
  const kitchenIds = kitchens.map((k) => k.id);

  const membersByKitchen = new Map<string, KitchenMember[]>();
  const profileById = new Map<
    string,
    Pick<
      Profile,
      | "display_name"
      | "allergies"
      | "diet_type"
      | "serving_multiplier"
      | "target_calories"
      | "target_protein_g"
    >
  >();
  const peopleByKitchen = new Map<
    string,
    (KitchenPerson & {
      favorites: { position: number; recipe_id: string; title: string }[];
    })[]
  >();

  const { data: recipeRows } = await supabase
    .from("recipes")
    .select("id, title")
    .or(`owner_id.eq.${user!.id},is_public.eq.true`)
    .order("title");
  const recipes = (recipeRows ?? []) as { id: string; title: string }[];

  if (kitchenIds.length > 0) {
    const { data: members } = await supabase
      .from("kitchen_members")
      .select("kitchen_id, user_id, role, created_at")
      .in("kitchen_id", kitchenIds);

    const memberList = (members ?? []) as KitchenMember[];
    for (const m of memberList) {
      const arr = membersByKitchen.get(m.kitchen_id) ?? [];
      arr.push(m);
      membersByKitchen.set(m.kitchen_id, arr);
    }

    const userIds = Array.from(new Set(memberList.map((m) => m.user_id)));
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select(
          "id, display_name, allergies, diet_type, serving_multiplier, target_calories, target_protein_g",
        )
        .in("id", userIds);
      for (const p of profiles ?? []) {
        profileById.set(p.id, p);
      }
    }

    const { data: people } = await supabase
      .from("kitchen_people")
      .select("*")
      .in("kitchen_id", kitchenIds)
      .order("name");

    const personList = (people ?? []) as KitchenPerson[];
    const personIds = personList.map((p) => p.id);

    const favByPerson = new Map<
      string,
      { position: number; recipe_id: string; title: string }[]
    >();
    if (personIds.length > 0) {
      const { data: favs } = await supabase
        .from("kitchen_person_favorites")
        .select("person_id, recipe_id, position, recipes(id, title)")
        .in("person_id", personIds);
      for (const f of (favs ?? []) as unknown as FavRow[]) {
        const arr = favByPerson.get(f.person_id) ?? [];
        arr.push({
          position: f.position,
          recipe_id: f.recipe_id,
          title: f.recipes?.title ?? "Recipe",
        });
        favByPerson.set(f.person_id, arr);
      }
    }

    for (const person of personList) {
      const arr = peopleByKitchen.get(person.kitchen_id) ?? [];
      arr.push({
        ...person,
        favorites: favByPerson.get(person.id) ?? [],
      });
      peopleByKitchen.set(person.kitchen_id, arr);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kitchens"
        description="A kitchen is a shared household space. Invite account members with a code, or add people without accounts and track their diet prefs."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create a kitchen</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateKitchenForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Join with an invite code</CardTitle>
          </CardHeader>
          <CardContent>
            <JoinKitchenForm />
          </CardContent>
        </Card>
      </div>

      {kitchens.length === 0 ? (
        <EmptyState
          title="You're not in any kitchen yet"
          description="Create your own kitchen or join one with an invite code to start planning together."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {kitchens.map((kitchen) => {
            const members = membersByKitchen.get(kitchen.id) ?? [];
            const people = peopleByKitchen.get(kitchen.id) ?? [];
            const isOwner = kitchen.created_by === user!.id;
            const isActive = active?.id === kitchen.id;
            return (
              <Card key={kitchen.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-600" />
                      {kitchen.name}
                    </CardTitle>
                    {isActive && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Invite code
                    </span>
                    <InviteCode code={kitchen.invite_code} />
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Account members ({members.length})
                    </p>
                    <ul className="flex flex-col gap-2">
                      {members.map((m) => {
                        const p = profileById.get(m.user_id);
                        return (
                          <li
                            key={m.user_id}
                            className="text-sm text-zinc-700 dark:text-zinc-300"
                          >
                            <div className="flex items-center gap-1.5">
                              {m.role === "owner" && (
                                <Crown className="h-3.5 w-3.5 text-amber-500" />
                              )}
                              {p?.display_name ?? "Member"}
                              {m.user_id === user!.id && (
                                <span className="text-xs text-zinc-400">(you)</span>
                              )}
                            </div>
                            {p && (
                              <p className="ml-5 text-xs text-zinc-500">
                                {dietLabel(p.diet_type)} · ×
                                {p.serving_multiplier} servings
                                {p.allergies?.length
                                  ? ` · ${formatAllergies(p.allergies)}`
                                  : ""}
                                {p.target_calories != null
                                  ? ` · ${Number(p.target_calories)} kcal/day`
                                  : ""}
                                {p.target_protein_g != null
                                  ? ` · ${Number(p.target_protein_g)}g protein`
                                  : ""}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Household people — no account ({people.length})
                    </p>
                    <KitchenPeopleList people={people} recipes={recipes} />
                    <AddKitchenPersonForm
                      kitchenId={kitchen.id}
                      recipes={recipes}
                    />
                  </div>

                  <div className="flex gap-2">
                    {isOwner ? (
                      <form action={deleteKitchen}>
                        <input type="hidden" name="kitchenId" value={kitchen.id} />
                        <Button variant="danger" size="sm" type="submit">
                          <Trash2 className="h-4 w-4" /> Delete kitchen
                        </Button>
                      </form>
                    ) : (
                      <form action={leaveKitchen}>
                        <input type="hidden" name="kitchenId" value={kitchen.id} />
                        <Button variant="outline" size="sm" type="submit">
                          <LogOut className="h-4 w-4" /> Leave
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
