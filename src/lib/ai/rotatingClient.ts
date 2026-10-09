import { createAdminClient } from "@/lib/supabase/admin";
import { extractFirstJsonObject } from "@/lib/ai/extractJson";

interface AiKeyRow {
  id: string; api_key: string; provider: string; priority: number;
  daily_used_count: number; daily_reset_at: string;
}

type ThinkingLevel = "minimal" | "low" | "medium" | "high";
interface ModelSpec { name: string; thinking?: ThinkingLevel }

export interface AiCallOptions {
  temperature?: number;
  perAttemptTimeoutMs?: number; // حداکثر زمان هر تلاش
  totalTimeoutMs?: number;      // حداکثر زمان کل همه‌ی تلاش‌ها
}

// آدرس پروکسی کلودفلر (به جای آدرس مستقیم گوگل)
const GEMINI_BASE_URL = "https://ai-proxy.sabzfaraz.ir";

// ترتیب مدل‌ها: سریع‌ترین اول.
// gemini-3.8-flash مقدار minimal را نمی‌پذیرد (خطا می‌دهد) پس low می‌گذاریم.
// gemini-3.5-flash-lite به‌صورت پیش‌فرض thinking ندارد.
// برای تغییر بدون ویرایش کد: متغیر محیطی GEMINI_MODELS مثل
// gemini-3.6-flash:minimal,gemini-3.8-flash:low,gemini-3.5-flash-lite
const DEFAULT_MODELS: ModelSpec[] = [
  { name: "gemini-3.6-flash", thinking: "minimal" },
  { name: "gemini-3.8-flash", thinking: "low" },
  { name: "gemini-3.5-flash", thinking: "minimal" },
  { name: "gemini-3.5-flash-lite" },
];

const THINKING_LEVELS: ThinkingLevel[] = ["minimal", "low", "medium", "high"];

function getModels(): ModelSpec[] {
  const raw = process.env.GEMINI_MODELS?.trim();
  if (!raw) return DEFAULT_MODELS;
  const parsed: ModelSpec[] = [];
  for (const part of raw.split(",")) {
    const [name, level] = part.trim().split(":");
    if (!name) continue;
    parsed.push({ name, thinking: THINKING_LEVELS.find((l) => l === level) });
  }
  return parsed.length > 0 ? parsed : DEFAULT_MODELS;
}

class GeminiHttpError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`status ${status}: ${body.slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

// ── حافظه‌ی خطاها (چون سرور پارس‌پک یک پروسه‌ی همیشه‌روشن است، بین درخواست‌ها می‌ماند)
const modelCooldown = new Map<string, number>(); // مدل → تا چه زمانی استراحت
const keyCooldown = new Map<string, number>();   // کلید → تا چه زمانی استراحت
const pairCooldown = new Map<string, number>();  // مدل|کلید → تا چه زمانی استراحت

function isCooling(map: Map<string, number>, k: string) {
  const until = map.get(k);
  if (!until) return false;
  if (until <= Date.now()) { map.delete(k); return false; }
  return true;
}
function cool(map: Map<string, number>, k: string, ms: number) {
  map.set(k, Date.now() + ms);
}

// ── کش ۳۰ ثانیه‌ای کلیدها (به‌جای یک کوئری در هر درخواست)
let keysCache: { at: number; keys: AiKeyRow[] } | null = null;
const KEYS_CACHE_MS = 30_000;

async function getUsableKeys(): Promise<AiKeyRow[]> {
  if (keysCache && Date.now() - keysCache.at < KEYS_CACHE_MS) return keysCache.keys;

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: keys } = await admin
    .from("partner_ai_keys")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  const usable = (keys ?? []) as AiKeyRow[];
  const needReset = usable.filter((k) => k.daily_reset_at !== today);
  if (needReset.length > 0) {
    // ریست روزانه‌ی شمارنده‌ها، موازی و بدون معطل‌کردن درخواست
    void Promise.all(
      needReset.map((k) =>
        admin.from("partner_ai_keys").update({ daily_used_count: 0, daily_reset_at: today }).eq("id", k.id)
      )
    ).catch(() => {});
    needReset.forEach((k) => { k.daily_used_count = 0; k.daily_reset_at = today; });
  }

  keysCache = { at: Date.now(), keys: usable };
  return usable;
}

// ثبت مصرف/خطا در پس‌زمینه؛ هیچ‌وقت خطا پرت نمی‌کند و پاسخ را معطل نمی‌کند
function markKeyUsed(id: string, error?: string) {
  const admin = createAdminClient();
  const work = async () => {
    if (error) {
      await admin.from("partner_ai_keys").update({ last_error: error.slice(0, 500) }).eq("id", id);
      return;
    }
    const { error: rpcError } = await admin.rpc("increment_partner_ai_key_usage", { p_key_id: id });
    if (rpcError) {
      const { data } = await admin.from("partner_ai_keys").select("daily_used_count").eq("id", id).single();
      await admin.from("partner_ai_keys").update({ daily_used_count: (data?.daily_used_count ?? 0) + 1 }).eq("id", id);
    }
  };
  void work().catch(() => {});
}

async function callGeminiWithKey(
  apiKey: string,
  prompt: string,
  spec: ModelSpec,
  opts: { temperature?: number; timeoutMs: number },
  withThinking = true
): Promise<string> {
  const generationConfig: Record<string, unknown> = { responseMimeType: "application/json" };
  if (opts.temperature !== undefined) generationConfig.temperature = opts.temperature;
  if (withThinking && spec.thinking) generationConfig.thinkingConfig = { thinkingLevel: spec.thinking };

  let res: Response;
  try {
    // درخواست از طریق پروکسی کلودفلر ارسال می‌شود
    res = await fetch(`${GEMINI_BASE_URL}/v1beta/models/${spec.name}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
      signal: AbortSignal.timeout(opts.timeoutMs),
    });
  } catch (e: unknown) {
    const name = (e as { name?: string } | null)?.name;
    if (name === "TimeoutError" || name === "AbortError") throw new GeminiHttpError(408, "timeout");
    throw new GeminiHttpError(0, e instanceof Error ? e.message : "network error");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // اگر مدل مقدار thinking را نپذیرفت، یک بار بدون آن تلاش کن
    if (res.status === 400 && withThinking && spec.thinking && /think/i.test(body)) {
      return callGeminiWithKey(apiKey, prompt, spec, opts, false);
    }
    throw new GeminiHttpError(res.status, body);
  }

  const data = await res.json();
  const parts: Array<{ text?: string; thought?: boolean }> = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
  if (!text) throw new GeminiHttpError(204, "پاسخ خالی");

  // فقط اولین JSON کامل را برگردان (متن اضافه یا JSON تکراری حذف می‌شود)
  const clean = extractFirstJsonObject(text);
  if (!clean) throw new GeminiHttpError(422, `JSON نامعتبر: ${text.slice(0, 120)}`);
  return clean;
}

const TOO_SLOW = "پاسخ هوش مصنوعی بیش از حد طول کشید. لطفاً دوباره تلاش کنید.";

export async function callAiWithRotation(
  prompt: string,
  mode: "SEQUENTIAL" | "RANDOM" = "SEQUENTIAL",
  options: AiCallOptions = {}
): Promise<string> {
  const allKeys = await getUsableKeys();
  if (allKeys.length === 0) {
    throw new Error("هیچ کلید هوش مصنوعی فعالی تنظیم نشده است.");
  }

  const perAttemptMs = options.perAttemptTimeoutMs ?? 25_000;
  const deadline = Date.now() + (options.totalTimeoutMs ?? 55_000);
  const models = getModels();
  let lastErrorMessage = "";

  for (let pass = 0; pass < 2; pass++) {
    const keys = mode === "RANDOM" ? [...allKeys].sort(() => Math.random() - 0.5) : allKeys;
    let attempted = 0;

    for (const spec of models) {
      if (isCooling(modelCooldown, spec.name)) continue;

      for (const key of keys) {
        if (isCooling(keyCooldown, key.id)) continue;
        if (isCooling(pairCooldown, `${spec.name}|${key.id}`)) continue;

        const remaining = deadline - Date.now();
        if (remaining < 3_000) throw new Error(TOO_SLOW);

        attempted++;
        try {
          const result = await callGeminiWithKey(key.api_key, prompt, spec, {
            temperature: options.temperature,
            timeoutMs: Math.min(perAttemptMs, remaining),
          });
          markKeyUsed(key.id);
          return result;
        } catch (e: unknown) {
          const status = e instanceof GeminiHttpError ? e.status : 0;
          const body = e instanceof GeminiHttpError ? e.body : "";
          const msg = e instanceof Error ? e.message : "خطای نامشخص";
          lastErrorMessage = msg;
          console.error(`Gemini fail [${spec.name}]:`, msg);
          markKeyUsed(key.id, `${spec.name}: ${msg}`);

          // مدل وجود ندارد/دسترسی ندارد: مدل بعدی (و ۳۰ دقیقه امتحانش نکن)
          if (status === 404) { cool(modelCooldown, spec.name, 30 * 60_000); break; }

          // درخواست یا پاسخ مشکل دارد: مشکل از کلید نیست، مدل بعدی
          if (status === 400 || status === 204) break;

          // خود مدل شلوغ/کند/قطع است: مدل بعدی، و کمی استراحت
          if (status === 408 || status === 500 || status === 503 || status === 504 || status === 529 || status === 0) {
            cool(modelCooldown, spec.name, status === 408 ? 60_000 : 30_000);
            break;
          }

          // کلید مشکل دارد: ۱۰ دقیقه کنار بگذار و کلید بعدی
          if (status === 401 || status === 403) {
            cool(keyCooldown, key.id, 10 * 60_000);
            continue;
          }

          // سهمیه‌ی همین کلید برای همین مدل تمام شده: کلید بعدی
          if (status === 429) {
            const daily = /per ?day|daily/i.test(body);
            cool(pairCooldown, `${spec.name}|${key.id}`, daily ? 6 * 3_600_000 : 60_000);
            continue;
          }
          // خطای دیگر: کلید بعدی
        }
      }
    }

    if (attempted > 0) break;
    // همه‌ی ترکیب‌ها در استراحت بودند: استراحت‌ها را پاک کن و یک بار دیگر امتحان کن
    modelCooldown.clear(); keyCooldown.clear(); pairCooldown.clear();
  }

  console.error("Gemini: all models and keys failed. Last error:", lastErrorMessage);
  throw new Error("مشکلی پیش آمده، لطفاً دوباره تلاش کنید.");
}