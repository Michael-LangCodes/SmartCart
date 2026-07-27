import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Create your account
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Start planning meals and building grocery lists.
        </p>
      </div>
      <AuthForm mode="signup" />
    </div>
  );
}
