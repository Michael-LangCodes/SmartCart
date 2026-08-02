"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveKitchen } from "@/lib/kitchen";

function revalidatePantry() {
  revalidatePath("/pantry");
}

/** Add or merge a pantry item into the active kitchen. */
export async function addPantryItem(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 120) return;

  const qtyRaw = String(formData.get("quantity") ?? "").trim();
  const quantity =
    qtyRaw === "" ? null : Number.isFinite(Number(qtyRaw)) ? Number(qtyRaw) : null;
  const unit = String(formData.get("unit") ?? "").trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kitchen = await getActiveKitchen();
  if (!kitchen) return;

  const { data: existing } = await supabase
    .from("kitchen_pantry_items")
    .select("id, quantity")
    .eq("kitchen_id", kitchen.id)
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    const nextQty =
      quantity !== null
        ? (existing.quantity != null ? Number(existing.quantity) : 0) + quantity
        : existing.quantity;
    await supabase
      .from("kitchen_pantry_items")
      .update({
        name,
        quantity: nextQty,
        unit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("kitchen_id", kitchen.id);
  } else {
    await supabase.from("kitchen_pantry_items").insert({
      kitchen_id: kitchen.id,
      name,
      quantity,
      unit,
    });
  }

  revalidatePantry();
}

/** Remove a pantry item. */
export async function deletePantryItem(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kitchen = await getActiveKitchen();
  if (!kitchen) return;

  await supabase
    .from("kitchen_pantry_items")
    .delete()
    .eq("id", id)
    .eq("kitchen_id", kitchen.id);

  revalidatePantry();
}

/** Clear the entire pantry for the active kitchen. */
export async function clearPantry(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kitchen = await getActiveKitchen();
  if (!kitchen) return;

  await supabase
    .from("kitchen_pantry_items")
    .delete()
    .eq("kitchen_id", kitchen.id);

  revalidatePantry();
}
