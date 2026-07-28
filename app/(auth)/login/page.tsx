import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect, error } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to plan your week.
        </p>
      </div>
      {error === "auth" && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Sign-in link was invalid or expired. Please try again.
        </p>
      )}
      {error === "guest" && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Guest mode is unavailable. Enable &quot;Anonymous Sign-Ins&quot; in your
          Supabase project, or sign in below.
        </p>
      )}
      <AuthForm mode="login" redirectTo={redirect} />
    </div>
  );
}
