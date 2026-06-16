"use client";

import { useActionState } from "react";
import { createSheetAction, type SheetActionState } from "@/lib/actions/sheets";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const initialState: SheetActionState = { error: null };

export function CreateSheetForm() {
  const [state, formAction, pending] = useActionState(createSheetAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="title">New sheet</Label>
        <Input id="title" name="title" placeholder="e.g. SAT Math Practice — Algebra" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create sheet"}
      </Button>
      {state.error && <p className="text-sm text-danger sm:basis-full">{state.error}</p>}
    </form>
  );
}
