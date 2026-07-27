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
import { leaveKitchen, deleteKitchen } from "./actions";
import type { KitchenMember } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function KitchensPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const kitchens = await getMyKitchens();
  const active = await getActiveKitchen(kitchens);
  const kitchenIds = kitchens.map((k) => k.id);

  // Members across all my kitchens, plus a lookup of display names.
  const membersByKitchen = new Map<string, KitchenMember[]>();
  const nameById = new Map<string, string>();

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
        .select("id, display_name")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        nameById.set(p.id, p.display_name ?? "Member");
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Kitchens"
        description="A kitchen is a shared space where members plan meals and build grocery lists together."
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
        <div className="grid gap-4 sm:grid-cols-2">
          {kitchens.map((kitchen) => {
            const members = membersByKitchen.get(kitchen.id) ?? [];
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
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Invite code
                    </span>
                    <InviteCode code={kitchen.invite_code} />
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Members ({members.length})
                    </p>
                    <ul className="flex flex-col gap-1">
                      {members.map((m) => (
                        <li
                          key={m.user_id}
                          className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300"
                        >
                          {m.role === "owner" && (
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          )}
                          {nameById.get(m.user_id) ?? "Member"}
                          {m.user_id === user!.id && (
                            <span className="text-xs text-zinc-400">(you)</span>
                          )}
                        </li>
                      ))}
                    </ul>
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
