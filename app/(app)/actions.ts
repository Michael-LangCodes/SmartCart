"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACTIVE_KITCHEN_COOKIE } from "@/lib/kitchen";

/** Persist the selected kitchen in a cookie and refresh the current view. */
export async function setActiveKitchen(formData: FormData): Promise<void> {
  const kitchenId = String(formData.get("kitchenId") ?? "");
  const path = String(formData.get("path") ?? "/planner");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_KITCHEN_COOKIE, kitchenId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath(path);
}
