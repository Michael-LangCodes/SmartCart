import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ensures the visitor has a session, creating an anonymous ("guest") user if
 * needed, then redirects to `next`. Route Handlers can write cookies, so this
 * is where the anonymous session is reliably established for open mode.
 *
 * Requires "Anonymous Sign-Ins" to be enabled in the Supabase dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const nextParam = searchParams.get("next") ?? "/planner";
  const next = nextParam.startsWith("/") ? nextParam : "/planner";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      // Most likely anonymous sign-ins are disabled in Supabase.
      return NextResponse.redirect(`${origin}/login?error=guest`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
