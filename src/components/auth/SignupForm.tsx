"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

const authInitialState: AuthActionState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, authInitialState);

  return (
    <Card className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Create account</h1>
      <p className="mt-1 text-sm text-ink-soft">Build tests and worksheets in minutes, with an answer key included.</p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="displayName">Name</Label>
          <Input id="displayName" name="displayName" type="text" autoComplete="name" placeholder="Your name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@school.edu" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
        </div>
        {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        {state.success && <p role="status" className="text-sm text-brand">{state.success}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
