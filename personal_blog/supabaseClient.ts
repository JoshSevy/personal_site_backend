import { createClient } from "supabase";
import { config } from "dotenv";

const env = config();

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || (() => { throw new Error("SUPABASE_URL is not defined") })();
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || (() => { throw new Error("SUPABASE_ANON_KEY is not defined") })();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);