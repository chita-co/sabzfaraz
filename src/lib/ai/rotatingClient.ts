import { createAdminClient } from "@/lib/supabase/admin";

interface AiKeyRow {
  id: string; api_key: string; provider: string; priority: number;
  daily_used_count: number; daily_reset_at: string;
}

async function getUsableKeys(): Promise<AiKeyRow[]> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: keys } = await admin.from("partner_ai_keys").select("*").eq("is_active", true).order("priority", { ascending: true });
  const usable: AiKeyRow[] = [];
  for (const k of keys ?? []) {
    if (k.daily_reset_at !== today) {
      await admin.from("partner_ai_keys").update({ daily_used_count: 0, daily_reset_at: today }).eq("id", k.id);
      k.daily_used_count = 0;
    }
    usable.push(k as AiKeyRow);
  }
  return usable;
}

async function markKeyUsed(id: string, error?: string) {
  const admin = createAdminClient();
  if (error) {
    await admin.from("partner_ai_keys").update({ last_error: error }).eq("id", id);
  } else {
    try {
      await admin.rpc("increment_partner_ai_key_usage", { p_key_id: id });
    } catch {
      const { data } = await admin.from("partner_ai_keys").select("daily_used_count").eq("id", id).single();
      await admin.from("partner_ai_keys").update({ daily_used_count: (data?.daily_used_count ?? 0) + 1 }).eq("id", id);
    }
  }
}

const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"];

async function callGeminiWithKey(apiKey: string, prompt: string, model: string): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`status ${res.status}: ${errBody.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("پاسخ خالی");
  return text;
}

export async function callAiWithRotation(prompt: string, mode: "SEQUENTIAL" | "RANDOM" = "SEQUENTIAL"): Promise<string> {
  let keys = await getUsableKeys();
  if (keys.length === 0) throw new Error("هیچ کلید هوش مصنوعی فعالی تنظیم نشده است.");
  if (mode === "RANDOM") keys = [...keys].sort(() => Math.random() - 0.5);

  for (const model of GEMINI_MODELS) {
    for (const key of keys) {
      try {
        const result = await callGeminiWithKey(key.api_key, prompt, model);
        await markKeyUsed(key.id);
        return result;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "خطای نامشخص";
        console.error("Gemini fail:", model, msg);
        await markKeyUsed(key.id, `${model}: ${msg}`);
        // 503 یعنی خود مدل شلوغ است، نه کلید؛ امتحان بقیه کلیدها روی همین مدل فایده ندارد
        if (msg.startsWith("status 503")) break;
      }
    }
  }
  throw new Error("مشکلی پیش آمده، لطفاً دوباره تلاش کنید.");
}