"use client";

import { useState } from "react";
import { Plus, X, ClipboardPaste } from "lucide-react";

export interface AttributeRow { id: string; key: string; value: string; }

function parseAttributesText(text: string): { key: string; value: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: { key: string; value: string }[] = [];

  for (const line of lines) {
    let parts: string[] | null = null;

    // اولویت اول: جداکننده تب (رایج‌ترین حالت هنگام کپی از جدول/اکسل)
    if (line.includes("\t")) {
      parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
    }
    // اولویت دوم: دو یا چند فاصله‌ی پشت‌سرهم (رایج در متن‌های چسبانده‌شده ساده)
    if (!parts || parts.length < 2) {
      const spaceSplit = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
      if (spaceSplit.length >= 2) parts = spaceSplit;
    }
    // اولویت سوم: علامت دونقطه
    if (!parts || parts.length < 2) {
      const colonSplit = line.split(/[:：]/).map((p) => p.trim()).filter(Boolean);
      if (colonSplit.length >= 2) parts = colonSplit;
    }
    if (!parts || parts.length < 2) continue;

    const key = parts[0];
    const value = parts.slice(1).join(" ").trim();
    if (!key || !value) continue;

    // ردیف عنوان جدول (مثلاً «ویژگی / مقدار») نادیده گرفته می‌شود
    const normalizedKey = key.replace(/\s/g, "");
    const normalizedValue = value.replace(/\s/g, "");
    if (normalizedKey === "ویژگی" && normalizedValue.includes("مقدار")) continue;

    rows.push({ key, value });
  }

  return rows;
}

export default function ProductAttributesEditor({
  attributes, onChange,
}: {
  attributes: AttributeRow[];
  onChange: (rows: AttributeRow[]) => void;
}) {
  const [bulkText, setBulkText] = useState("");
  const [showBulkBox, setShowBulkBox] = useState(false);
  const [parseInfo, setParseInfo] = useState<string | null>(null);

  function addRow() {
    onChange([...attributes, { id: crypto.randomUUID(), key: "", value: "" }]);
  }
  function updateRow(id: string, field: "key" | "value", value: string) {
    onChange(attributes.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function removeRow(id: string) {
    onChange(attributes.filter((r) => r.id !== id));
  }

  function handleApplyBulkText() {
    const parsed = parseAttributesText(bulkText);
    if (parsed.length === 0) {
      setParseInfo("هیچ ردیف معتبری از متن استخراج نشد. لطفاً فرمت «ویژگی [فاصله یا تب] مقدار» را رعایت کنید.");
      return;
    }
    // ردیف‌های جدید به انتهای ردیف‌های موجود اضافه می‌شوند — چیزی که قبلاً به‌صورت دستی وارد کرده بودید پاک نمی‌شود
    onChange([...attributes, ...parsed.map((p) => ({ id: crypto.randomUUID(), key: p.key, value: p.value }))]);
    setParseInfo(`${parsed.length.toLocaleString("fa-IR")} ویژگی با موفقیت در ردیف‌های زیر جایگذاری شد. برای ثبت نهایی، دکمه‌ی «ذخیره محصول» را بزنید.`);
    setBulkText("");
  }

  return (
    <div className="admin-form-group">
      <div className="flex items-center justify-between mb-1">
        <label style={{ marginBottom: 0 }}>ویژگی‌های فنی (مثل قطر، ضخامت، ولتاژ — اختیاری)</label>
        <button
          type="button"
          onClick={() => setShowBulkBox((v) => !v)}
          className="admin-btn admin-btn-secondary flex items-center gap-1"
          style={{ padding: "4px 10px", fontSize: 12 }}
        >
          <ClipboardPaste size={13} /> جایگذاری گروهی از متن
        </button>
      </div>

      {showBulkBox && (
        <div className="attr-bulk-box">
          <p className="attr-bulk-hint">
            متن ویژگی‌ها را با فرمت «نام ویژگی» و «مقدار» در هر خط وارد کنید (جداشده با فاصله، تب یا «:») — مثلاً مستقیم از یک جدول کپی‌شده. با زدن دکمه‌ی «جایگذاری»، ردیف‌های زیر به‌طور خودکار بر اساس همین متن پر می‌شوند و شما همچنان می‌توانید آن‌ها را ویرایش یا حذف کنید.
          </p>
          <textarea
            rows={6}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"مدل ماژول\tESP32-S3-WROOM-1\nپردازنده\tدو هسته Xtensa LX7 @ 240MHz\nولتاژ ورودی\t5V DC"}
            className="attr-bulk-textarea"
          />
          <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={handleApplyBulkText} className="admin-btn admin-btn-primary">
              جایگذاری در ردیف‌ها
            </button>
            <button type="button" onClick={() => { setBulkText(""); setParseInfo(null); }} className="admin-btn admin-btn-secondary">
              پاک کردن متن
            </button>
          </div>
          {parseInfo && <p className="attr-bulk-info">{parseInfo}</p>}
        </div>
      )}

      <div className="space-y-2 mb-2">
        {attributes.map((row) => (
          <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input type="text" placeholder="ویژگی (مثلاً: ولتاژ)" value={row.key} onChange={(e) => updateRow(row.id, "key", e.target.value)} className="admin-input" />
            <input type="text" placeholder="مقدار (مثلاً: 5 ولت)" value={row.value} onChange={(e) => updateRow(row.id, "value", e.target.value)} className="admin-input" />
            <button type="button" onClick={() => removeRow(row.id)} className="admin-btn admin-btn-danger"><X size={14} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="admin-btn admin-btn-secondary flex items-center gap-1">
        <Plus size={14} /> افزودن ویژگی
      </button>

      <style jsx>{`
        .attr-bulk-box {
          border: 1.5px dashed #93c5fd;
          background: #eff6ff;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .attr-bulk-hint {
          font-size: 11.5px;
          color: #1e40af;
          line-height: 1.9;
          margin: 0 0 8px;
        }
        .attr-bulk-textarea {
          width: 100%;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12.5px;
          resize: vertical;
        }
        .attr-bulk-info {
          font-size: 11.5px;
          color: #15803d;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}