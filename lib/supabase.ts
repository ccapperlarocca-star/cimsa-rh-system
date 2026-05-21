import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zqsxcpjwycxmbaocmwml.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxc3hjcGp3eWN4bWJhb2Ntd21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDYwOTEsImV4cCI6MjA5NDg4MjA5MX0.Q8TLS9HAFx1Rn1B4hsWmf9VuhyZc0DKpA1hXM6CNQWY";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);