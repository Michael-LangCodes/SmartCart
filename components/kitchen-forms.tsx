"use client";

import { useActionState, useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  createKitchen,
  joinKitchen,
  type KitchenState,
} from "@/app/(app)/kitchens/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: KitchenState = {};

export function CreateKitchenForm() {
  const [state, action, pending] = useActionState(createKitchen, initial);
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input name="name" placeholder="e.g. The Smith Household" required />
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Create"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function JoinKitchenForm() {
  const [state, action, pending] = useActionState(joinKitchen, initial);
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name="invite_code"
          placeholder="Invite code (e.g. 4F9AB2)"
          className="uppercase"
          required
        />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "..." : "Join"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      title="Copy invite code"
    >
      {code}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
