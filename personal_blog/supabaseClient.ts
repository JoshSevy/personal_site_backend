import { createClient } from "supabase";
import { config } from "dotenv";

// Load environment variables
const env = config();
if (env.error) {
    throw env.error;
}

const SUPABASE_URL = env.SUPABASE_URL || (() => { throw new Error("SUPABASE_URL is not defined") })();
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || (() => { throw new Error("SUPABASE_ANON_KEY is not defined") })();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);