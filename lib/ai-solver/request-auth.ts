import { createClient } from "@/lib/supabase/server";

export async function getRequestUserId() {
  if (!hasSupabaseConfig()) {
    if (process.env.NODE_ENV !== "production") {
      return "local-preview-user";
    }

    throw new Error("Supabase Auth is not configured.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    return user.id;
  }

  if (process.env.NODE_ENV !== "production") {
    return "local-preview-user";
  }

  throw new Error("Authentication is required.");
}

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
