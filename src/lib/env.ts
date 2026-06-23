import "server-only";

/**
 * Fail-closed startup check for required server environment variables.
 * Imported from src/lib/supabase/server.ts so it runs on first server-side
 * use rather than needing a separate bootstrap step.
 */
const REQUIRED_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

let validated = false;

export function assertRequiredEnv() {
  if (validated) return;
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. See .env.local.example.`,
    );
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    const leakedViaPublicVar = Object.entries(process.env).some(
      ([key, value]) => key.startsWith("NEXT_PUBLIC_") && value === serviceKey,
    );
    if (leakedViaPublicVar) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY value is also assigned to a NEXT_PUBLIC_* variable.");
    }
  }
  validated = true;
}
