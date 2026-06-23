import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/** Generic, non-leaky error response for unexpected failures (AI provider errors, etc). */
export function safeErrorResponse(context: string, err: unknown, status = 500) {
  console.error(`[${context}]`, err instanceof Error ? err.stack ?? err.message : err);
  return NextResponse.json({ error: "Something went wrong processing your request." }, { status });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Parses a JSON body against a zod schema, returning a NextResponse on failure or the typed data on success. */
export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { response: badRequest("Invalid JSON body") };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return { response: badRequest(result.error.issues[0]?.message ?? "Invalid request body") };
  }
  return { data: result.data };
}
