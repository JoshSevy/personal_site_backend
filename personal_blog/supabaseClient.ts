import { createClient, SupabaseClient } from "supabase";
import { config as loadEnv } from "dotenv";

let SUPABASE_URL: string | undefined;
let SUPABASE_ANON_KEY: string | undefined;

if (typeof Deno !== "undefined" && Deno.env && Deno.env.get("DENO_DEPLOYMENT_ID")) {
    // Running on Deno Deploy
    SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
} else {
    // Running locally — use dotenv's config()
    const envLocal = loadEnv({ export: true });

    // Also try to load from personal_blog/.env (e.g. if running from root)
    // dotenv will not overwrite existing variables, so this is safe to try
    try {
        loadEnv({ path: "personal_blog/.env", export: true });
    } catch (_e) {
        // Ignore if file not found
    }

    SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
}

if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not defined");
}

if (!SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY is not defined");
}

// Create default Supabase client (for unauthenticated requests)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create an authenticated Supabase client with a JWT token
export function createAuthenticatedClient(token: string): SupabaseClient {
    return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });
}
