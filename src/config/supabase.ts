import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

console.log("SUPABASE_URL =", process.env.SUPABASE_URL);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY Exists =",
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseApiKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseApiKey);
