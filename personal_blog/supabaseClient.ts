import { createClient } from "supabase";
import { config } from "dotenv";

const env = config();

const SUPABASE_URL = process.env.SUPABASE_URL || (() => { throw new Error("SUPABASE_URL is not defined") })();
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || (() => { throw new Error("SUPABASE_ANON_KEY is not defined") })();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);