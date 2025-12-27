import { supabase } from "@/lib/supabase";

export async function callCeisaProxy(payload: any) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User belum login Supabase");
  }

  const res = await fetch(
    "https://kczxklbumktuemiajuyj.supabase.co/functions/v1/supabase-functions-ceisa-proxy",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        // 🔴 WAJIB — SDK invoke TIDAK bisa kirim ini
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,

        // 🔴 WAJIB
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CEISA proxy error: ${text}`);
  }

  return res.json();
}
