/**
 * Whether a real (permanent) account is required to use the app.
 *
 * - `true`  -> login/signup is mandatory; unauthenticated users are sent to /login.
 * - `false` (default) -> "open mode": visitors are silently signed in as an
 *   anonymous Supabase user (a "guest") per browser.
 *
 * Flip `NEXT_PUBLIC_REQUIRE_AUTH=true` to re-enable the account portal with no
 * code changes. `NEXT_PUBLIC_` so it's readable in the proxy, server
 * components, and client components alike.
 */
export const REQUIRE_AUTH = process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";
