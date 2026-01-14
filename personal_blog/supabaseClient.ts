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
    const env = loadEnv();
    SUPABASE_URL = env.SUPABASE_URL;
    SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
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
