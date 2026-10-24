// src/components/shared/RecategorizeTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Check, Loader2, Pencil, Plus, RefreshCw, Sparkles } from "lucide-react";
import { buildForest, pathOf, type CatRow } from "@/lib/categoryTree";
import LevelEditor from "@/components/shared/LevelEditor";

export interface RTProduct {
  id: string;
  name: string;
  image: string | null;
  category_id: string | null;
}
export interface RTCategory {
  id: string;
  name: string;
  parent_id: string | null;
  slug?: string;
}
export interface RTLevel {
  key: string;
  categoryId: string | null;
  newName: string | null;
  newSlug: string | null;
  label: string;
}
export interface RTSuggestion {
  productId: string;
  levels: [RTLevel | null, RTLevel | null, RTLevel | null];
  reason: string;
}
export interface RTPrefixSlot {
  categoryId: string | null;
  newName: string | null;
  newSlug: string | null;
}
export type RTSuggestItem = {
  productId: string;
  excludeKeys?: string[];
  level?: number;
  prefix?: RTPrefixSlot[];
};
export type RTSuggestFn = (
  items: RTSuggestItem[]
) => Promise<{ error?: string; suggestions?: RTSuggestion[] }>;
export type RTApplyFn = (
  s: RTSuggestion,
  level: 1 | 2 | 3
) => Promise<{ error?: string; success?: boolean; categoryId?: string; categoryName?: string; created?: RTCategory[] }>;

export function buildPaths(categories: RTCategory[]): Map<string, string> {
  const rows: CatRow[] = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug ?? "", parent_id: c.parent_id }));
  const { byId } = buildForest(rows);
  const m = new Map<string, string>();
  rows.forEach((r) => m.set(r.id, pathOf(byId, r.id)));
  return m;
}

type Status = "idle" | "loading" | "ready" | "applying" | "applied" | "error";
type Lvl = 1 | 2 | 3;
interface RowState {
  status: Status;
  suggestion?: RTSuggestion;
  level: Lvl;
  hist: Record<Lvl, string[]>;
  message?: string;
}

const EMPTY_HIST: Record<Lvl, string[]> = { 1: [], 2: [], 3: [] };
const LEVEL_LABEL: Record<Lvl, string> = { 1: "اصلی", 2: "فرعی", 3: "زیرفرعی" };
const CHUNK = 8;

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function defaultLevel(s: RTSuggestion): Lvl {
  if (s.levels[2]) return 3;
  if (s.levels[1]) return 2;
  return 1;
}

const btn = (bg: string, color: string, border: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 8,
  border: `1px solid ${border}`,
  background: bg,
  color,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

export default function RecategorizeTable({
  products,
  categories,
  suggest,
  apply,
  newCategoryHint,
  applyLabelNew,
  autoSuggest = false,
}: {
  products: RTProduct[];
  categories: RTCategory[];
  suggest: RTSuggestFn;
  apply: RTApplyFn;
  newCategoryHint: string;
  applyLabelNew: string;
  autoSuggest?: boolean;
}) {
  const [extraCats, setExtraCats] = useState<RTCategory[]>([]);
  const allCats = useMemo(() => {
    const ids = new Set(categories.map((c) => c.id));
    return [...categories, ...extraCats.filter((c) => !ids.has(c.id))];
  }, [categories, extraCats]);
  const paths = useMemo(() => buildPaths(allCats), [allCats]);

  const [selected, setSelected] = useState<Set<string>>(() =>
    autoSuggest ? new Set(products.map((p) => p.id)) : new Set()
  );
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    autoSuggest
      ? Object.fromEntries(products.map((p) => [p.id, { status: "loading" as Status, level: 3 as Lvl, hist: EMPTY_HIST }]))
      : {}
  );
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const currentId = (p: RTProduct): string | null => (p.id in overrides ? overrides[p.id] : p.category_id);
  const currentLabel = (p: RTProduct): string => {
    const id = currentId(p);
    return id ? paths.get(id) ?? "—" : "بدون دسته‌بندی";
  };
  const levelOf = (id: string): Lvl => rows[id]?.level ?? 3;

  function patchRow(id: string, patch: Partial<RowState>) {
    setRows((prev) => {
      const base: RowState = prev[id] ?? { status: "idle", level: 3, hist: EMPTY_HIST };
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  const allChecked = products.length > 0 && products.every((p) => selected.has(p.id));
  function toggleAll() {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allChecked) products.forEach((p) => n.delete(p.id));
      else products.forEach((p) => n.add(p.id));
      return n;
    });
  }

  // mode 0 = مسیر کامل؛ mode 1..3 = همان سطح + سطح‌های پایین‌تر، با حفظ سطح‌های بالاتر
  async function runSuggest(ids: string[], mode: 0 | Lvl) {
    if (ids.length === 0) return;
    const lvlMode: Lvl | null = mode === 0 ? null : mode;
    ids.forEach((id) => patchRow(id, { status: "loading", message: undefined }));
    const groups: string[][] = mode === 0 ? chunk(ids, CHUNK) : ids.map((id) => [id]);

    for (const group of groups) {
      const items: RTSuggestItem[] = [];
      const missing: string[] = [];
      for (const id of group) {
        if (!lvlMode) {
          items.push({ productId: id });
          continue;
        }
        const prev = rows[id]?.suggestion;
        const prefix: RTPrefixSlot[] = [];
        let ok = true;
        for (let l = 0; l < lvlMode - 1; l++) {
          const sl = prev?.levels[l];
          if (!sl) {
            ok = false;
            break;
          }
          prefix.push({ categoryId: sl.categoryId, newName: sl.newName, newSlug: sl.newSlug });
        }
        if (!ok) {
          missing.push(id);
          continue;
        }
        items.push({ productId: id, level: lvlMode, excludeKeys: rows[id]?.hist[lvlMode] ?? [], prefix });
      }
      missing.forEach((id) =>
        patchRow(id, { status: "error", message: "ابتدا سطح بالاتر را مشخص کنید یا دسته‌بندی کامل را بزنید." })
      );
      if (items.length === 0) continue;

      const targetIds = items.map((i) => i.productId);
      let res: Awaited<ReturnType<RTSuggestFn>>;
      try {
        res = await Promise.race([
          suggest(items),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("TIMEOUT")), 70_000)),
        ]);
      } catch (e) {
        res = {
          error:
            e instanceof Error && e.message === "TIMEOUT"
              ? "زمان پاسخ هوش مصنوعی تمام شد. دکمه‌ی دسته‌بندی مجدد را بزنید."
              : "خطا در ارتباط با سرور",
        };
      }
      if (res.error || !res.suggestions) {
        targetIds.forEach((id) => patchRow(id, { status: "error", message: res.error ?? "پیشنهادی دریافت نشد" }));
        if (res.error) toast.error(res.error);
        continue;
      }

      const byP = new Map(res.suggestions.map((s) => [s.productId, s]));
      for (const id of targetIds) {
        const s = byP.get(id);
        if (!s) {
          patchRow(id, { status: "error", message: "پیشنهاد معتبری دریافت نشد؛ دوباره بزنید." });
          continue;
        }
        setRows((prev) => {
          const old = prev[id];
          const hist: Record<Lvl, string[]> = { ...(old?.hist ?? EMPTY_HIST) };
          if (lvlMode) {
            const oldSlot = old?.suggestion?.levels[lvlMode - 1];
            if (oldSlot) hist[lvlMode] = [...hist[lvlMode], oldSlot.key];
          }
          const level: Lvl = lvlMode ?? defaultLevel(s);
          return { ...prev, [id]: { status: "ready", suggestion: s, level, hist, message: undefined } };
        });
      }
    }
  }

  function saveManual(id: string, lvl: Lvl, slot: RTLevel) {
    setRows((prev) => {
      const old = prev[id];
      if (!old?.suggestion) return prev;
      const levels = [...old.suggestion.levels] as RTSuggestion["levels"];
      levels[lvl - 1] = slot;
      for (let i: number = lvl; i < 3; i++) levels[i] = null;
      return {
        ...prev,
        [id]: {
          ...old,
          status: "ready",
          level: lvl,
          suggestion: { ...old.suggestion, levels },
        },
      };
    });
    setEditing(null);
  }

  function onLevelChange(id: string, l: Lvl) {
    const s = rows[id]?.suggestion;
    patchRow(id, { level: l });
    if (s && !s.levels[l - 1]) void runSuggest([id], l);
  }

  async function runApply(p: RTProduct): Promise<boolean> {
    const r = rows[p.id];
    const s = r?.suggestion;
    if (!s || !r) return false;
    const lvl = r.level;
    patchRow(p.id, { status: "applying" });

    let res: Awaited<ReturnType<RTApplyFn>>;
    try {
      res = await apply(s, lvl);
    } catch {
      res = { error: "خطا در ارتباط با سرور" };
    }
    if (res.error) {
      patchRow(p.id, { status: "ready", message: res.error });
      toast.error(res.error);
      return false;
    }
    const created = res.created ?? [];
    if (created.length) setExtraCats((prev) => [...prev, ...created]);
    setOverrides((prev) => ({ ...prev, [p.id]: res.categoryId ?? null }));
    setRows((prev) => ({
      ...prev,
      [p.id]: { status: "applied", level: lvl, hist: EMPTY_HIST, message: `منتقل شد به «${res.categoryName ?? ""}»` },
    }));
    return true;
  }

  async function applySelected() {
    const targets = products.filter((p) => {
      const r = rows[p.id];
      const slot = r?.suggestion ? r.suggestion.levels[r.level - 1] : null;
      return selected.has(p.id) && r?.status === "ready" && !!slot && (!!slot.newName || slot.categoryId !== currentId(p));
    });
    if (targets.length === 0) return toast("محصول انتخاب‌شده‌ای با پیشنهادِ متفاوت برای تایید وجود ندارد.");
    setBulkBusy(true);
    let ok = 0;
    for (const p of targets) if (await runApply(p)) ok++;
    setBulkBusy(false);
    toast.success(`${ok.toLocaleString("fa-IR")} محصول تایید شد.`);
  }

  const selectedIds = products.filter((p) => selected.has(p.id)).map((p) => p.id);
  const selectedCount = selectedIds.length;
  const th: React.CSSProperties = { padding: 8, textAlign: "right", color: "#6b7280", fontWeight: 600 };

  useEffect(() => {
    if (!autoSuggest) return;
    const t = setTimeout(() => {
      void runSuggest(products.map((p) => p.id), 0);
    }, 0);
    return () => clearTimeout(t);
    // فقط یک‌بار هنگام باز شدن پنل
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button
          type="button"
          disabled={selectedCount === 0 || bulkBusy}
          onClick={() => runSuggest(selectedIds, 0)}
          style={{ ...btn("#16a34a", "#fff", "#16a34a"), opacity: selectedCount === 0 || bulkBusy ? 0.5 : 1 }}
        >
          <Sparkles size={14} /> دسته‌بندی مجدد انتخاب‌شده‌ها ({selectedCount.toLocaleString("fa-IR")})
        </button>
        <button
          type="button"
          disabled={selectedCount === 0 || bulkBusy}
          onClick={applySelected}
          style={{ ...btn("#f0fdf4", "#166534", "#16a34a"), opacity: selectedCount === 0 || bulkBusy ? 0.5 : 1 }}
        >
          {bulkBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} تایید همه‌ی پیشنهادهای متفاوتِ انتخاب‌شده‌ها
        </button>
        <span style={{ fontSize: 11.5, color: "#9ca3af" }}>
          تا وقتی «تایید» نزنید، هیچ محصولی جابه‌جا نمی‌شود. {newCategoryHint}
        </span>
      </div>

      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
            <th style={{ ...th, width: 32 }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="انتخاب همه" />
            </th>
            <th style={th}>تصویر</th>
            <th style={th}>نام</th>
            <th style={th}>دسته‌بندی فعلی</th>
            <th style={th}>دسته‌بندی پیشنهادی</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const r = rows[p.id];
            const status: Status = r?.status ?? "idle";
            const s = r?.suggestion;
            const lvl = levelOf(p.id);
            const slot = s ? s.levels[lvl - 1] : null;
            const same = !!slot && !!slot.categoryId && slot.categoryId === currentId(p);
            const busy = status === "loading" || status === "applying";
            const applying = status === "applying";
            const canApprove = status === "ready" && !!slot && !same;

            return (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" }}>
                <td style={{ padding: 8 }}>
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label="انتخاب محصول" />
                </td>
                <td style={{ padding: 8 }}>
                  {p.image ? (
                    <Image src={p.image} alt={p.name} width={64} height={64} unoptimized style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, background: "#f3f4f6", borderRadius: 8 }} />
                  )}
                </td>
                <td style={{ padding: 8, maxWidth: 300 }}>{p.name}</td>
                <td style={{ padding: 8, color: "#374151" }}>{currentLabel(p)}</td>
                <td style={{ padding: 8, minWidth: 300 }}>
                  {status === "loading" && (
                    <span style={{ color: "#6b7280", display: "inline-flex", gap: 4, alignItems: "center" }}>
                      <Loader2 size={14} className="animate-spin" /> در حال بررسی...
                    </span>
                  )}
                  {status === "error" && <span style={{ color: "#dc2626", fontSize: 12 }}>{r?.message}</span>}
                  {status === "applied" && <span style={{ color: "#16a34a", fontSize: 12, fontWeight: 700 }}>✓ {r?.message}</span>}
                  {(status === "ready" || status === "applying") && s && (
                    <div>
                      <select
                        value={lvl}
                        onChange={(e) => onLevelChange(p.id, Number(e.target.value) as Lvl)}
                        title="سطحی که با «تایید» ثبت می‌شود"
                        style={{ fontSize: 12, borderRadius: 6, border: "1px solid #d1d5db", padding: "2px 6px" }}
                      >
                        {([1, 2, 3] as Lvl[]).map((l) => (
                          <option key={l} value={l}>
                            {LEVEL_LABEL[l]}
                            {s.levels[l - 1] ? "" : " (+)"}
                          </option>
                        ))}
                      </select>

                      {slot ? (
                        <div style={{ marginTop: 6, fontWeight: 700, lineHeight: 1.8, wordBreak: "break-word", color: same ? "#6b7280" : "#166534" }}>
                          {slot.label}
                        </div>
                      ) : (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#b45309" }}>
                          برای این سطح پیشنهادی نیست. با انتخاب «(+)» پیشنهاد بگیرید.
                        </div>
                      )}
                      {slot?.newName && (
                        <span style={{ display: "inline-block", marginTop: 4, fontSize: 10.5, color: "#b45309", background: "#fef3c7", padding: "1px 6px", borderRadius: 6 }}>
                          دسته‌ی جدید
                        </span>
                      )}
                      {same && <div style={{ fontSize: 11, color: "#6b7280" }}>یکسان با دسته‌بندی فعلی — بدون تغییر</div>}
                      {s.reason && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{s.reason}</div>}
                      {r?.message && <div style={{ fontSize: 11, color: "#dc2626" }}>{r.message}</div>}
                      {editing === p.id && s && (
                        <LevelEditor
                          lvl={lvl}
                          levels={s.levels}
                          allCats={allCats}
                          paths={paths}
                          onSave={(slot) => saveManual(p.id, lvl, slot)}
                          onCancel={() => setEditing(null)}
                        />
                      )}
                    </div>
                  )}
                  {status === "idle" && <span style={{ color: "#d1d5db" }}>—</span>}
                </td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      disabled={busy || bulkBusy}
                      onClick={() => runSuggest([p.id], s ? lvl : 0)}
                      style={{ ...btn("#fff", "#374151", "#d1d5db"), opacity: busy || bulkBusy ? 0.5 : 1 }}
                    >
                      {s && !slot ? <Plus size={13} /> : <RefreshCw size={13} />}
                      {s ? (slot ? `دسته‌بندی مجدد (${LEVEL_LABEL[lvl]})` : `پیشنهاد ${LEVEL_LABEL[lvl]}`) : "دسته‌بندی مجدد"}
                    </button>
                    {s && (
                      <button
                        type="button"
                        disabled={busy || bulkBusy}
                        onClick={() => setEditing(editing === p.id ? null : p.id)}
                        title="ویرایش دستی این سطح"
                        style={{ ...btn("#fff", "#374151", "#d1d5db"), opacity: busy || bulkBusy ? 0.5 : 1 }}
                      >
                        <Pencil size={13} /> ویرایش
                      </button>
                    )}
                    {canApprove && (
                      <button
                        type="button"
                        disabled={busy || bulkBusy}
                        onClick={() => runApply(p)}
                        style={{ ...btn("#16a34a", "#fff", "#16a34a"), opacity: busy || bulkBusy ? 0.5 : 1 }}
                      >
                        {applying ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        {slot?.newName ? applyLabelNew : "تایید"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {products.length === 0 && (
        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 20 }}>محصولی پیدا نشد.</p>
      )}
    </div>
  );
}