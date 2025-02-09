import { createClient } from "jsr:@supabase/supabase-js@2";
import { config } from "dotenv";

const env = config();

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);