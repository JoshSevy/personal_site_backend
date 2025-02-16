import { createClient } from "supabase";

let SUPABASE_URL: string | undefined;
let SUPABASE_ANON_KEY: string | undefined;

if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
    // Running on Deno Deploy
    SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
} else {
    // Running locally
    const env = await import("https://deno.land/x/dotenv/mod.ts");
    SUPABASE_URL = env.config().SUPABASE_URL;
    SUPABASE_ANON_KEY = env.config().SUPABASE_ANON_KEY;
}

if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not defined");
}

if (!SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY is not defined");
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);