"use client";

import { useState } from "react";
import { Upload, Loader2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { updatePageImages } from "@/app/admin/site-settings/page-images-actions";
import {
  MAX_IMAGE_WIDTH,
  MAX_IMAGES_PER_PAGE,
  MIN_IMAGE_WIDTH,
  defaultPositionFor,
  type PageImage,
  type PageImageAlign,
  type PageImageKind,
} from "@/lib/pageImages";

const POSITION_LABELS: Record<Exclude<PageImageKind, "about">, Record<string, string>> = {
  contact: {
    before_box: "قبل از باکس اطلاعات تماس",
    after_box: "زیر باکس اطلاعات تماس",
    beside_right: "کنار باکس (سمت راست)",
    beside_left: "کنار باکس (سمت چپ)",
  },
  unboxing: {
    after_hero: "بعد از عنوان و توضیح اصلی صفحه",
    after_rules: "بعد از باکس «چطور شرکت کنم؟»",
    after_channels: "بعد از دکمه‌های واتساپ / تلگرام / اینستاگرام",
    end: "انتهای صفحه (بعد از ویدیوهای مشتریان)",
  },
  gallery: {
    after_hero: "بعد از عنوان و توضیح صفحه",
    after_instagram: "بعد از بخش گالری اینستاگرام",
    after_youtube: "بعد از بخش گالری یوتیوب",
    end: "انتهای صفحه (بعد از بخش آپارات)",
  },
};

const ALIGN_LABELS: Record<PageImageAlign, string> = { right: "راست", center: "وسط", left: "چپ" };

function newId() {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseAboutPosition(pos: string): { type: "after_title" | "after_p" | "end"; n: number } {
  if (pos === "after_title") return { type: "after_title", n: 1 };
  if (pos.startsWith("after_p_")) return { type: "after_p", n: Number(pos.slice(8)) || 1 };
  return { type: "end", n: 1 };
}

function ImageList({
  kind,
  images,
  onChange,
}: {
  kind: PageImageKind;
  images: PageImage[];
  onChange: (next: PageImage[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= MAX_IMAGES_PER_PAGE) {
      alert(`حداکثر ${MAX_IMAGES_PER_PAGE} تصویر مجاز است.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        onChange([
          ...images,
          {
            id: newId(),
            url: data.url,
            alt: "",
            width: 400,
            align: "center",
            position: defaultPositionFor(kind),
          },
        ]);
      } else {
        alert(data.error || "خطا در آپلود");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setUploading(false);
    e.target.value = "";
  }

  function patch(id: string, p: Partial<PageImage>) {
    onChange(images.map((img) => (img.id === id ? { ...img, ...p } : img)));
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {images.length === 0 && <p className="text-sm text-gray-500">هنوز تصویری اضافه نشده است.</p>}

      {images.map((img, index) => {
        const isSide = kind === "contact" && img.position.startsWith("beside_");
        const aboutPos = parseAboutPosition(img.position);
        return (
          <div key={img.id} className="border border-gray-200 rounded-xl p-3 space-y-3">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                style={{ width: Math.min(img.width, 160), height: "auto" }}
                className="rounded-lg border bg-gray-50"
              />
              <div className="flex-1 space-y-2">
                <div className="admin-form-group">
                  <label>متن جایگزین تصویر (alt، اختیاری)</label>
                  <input
                    type="text"
                    value={img.alt}
                    maxLength={200}
                    onChange={(e) => patch(img.id, { alt: e.target.value })}
                    placeholder="توضیح کوتاه تصویر برای سئو و دسترسی‌پذیری"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="admin-btn" title="بالا">
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  className="admin-btn"
                  title="پایین"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((x) => x.id !== img.id))}
                  className="admin-btn"
                  title="حذف"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="admin-form-group">
                <label>جایگاه تصویر</label>
                {kind === "about" ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={aboutPos.type}
                      onChange={(e) => {
                        const t = e.target.value;
                        patch(img.id, {
                          position: t === "after_title" ? "after_title" : t === "after_p" ? `after_p_${aboutPos.n}` : "end",
                        });
                      }}
                    >
                      <option value="after_title">بعد از عنوان</option>
                      <option value="after_p">بعد از پاراگراف شماره…</option>
                      <option value="end">انتهای صفحه</option>
                    </select>
                    {aboutPos.type === "after_p" && (
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={aboutPos.n}
                        onChange={(e) => {
                          const n = Math.min(20, Math.max(1, Number(e.target.value) || 1));
                          patch(img.id, { position: `after_p_${n}` });
                        }}
                        style={{ width: 80 }}
                      />
                    )}
                  </div>
                ) : (
                  <select value={img.position} onChange={(e) => patch(img.id, { position: e.target.value })}>
                    {Object.entries(POSITION_LABELS[kind]).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="admin-form-group">
                <label>تراز تصویر{isSide ? " (برای تصویر «کنار باکس» اعمال نمی‌شود)" : ""}</label>
                <div className="flex gap-2">
                  {(["right", "center", "left"] as PageImageAlign[]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      disabled={isSide}
                      onClick={() => patch(img.id, { align: a })}
                      className={`admin-btn ${img.align === a ? "admin-btn-primary" : ""}`}
                    >
                      {ALIGN_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-form-group">
                <label>چیدمان (چند تصویر پشت‌سرهم با جایگاه یکسان)</label>
                <select
                  value={img.layout ?? "stack"}
                  onChange={(e) => patch(img.id, { layout: e.target.value as "stack" | "row" })}
                >
                  <option value="stack">مستقل (زیر هم)</option>
                  <option value="row">کنار هم در یک ردیف</option>
                </select>
              </div>

            <div className="admin-form-group">
              <label>
                اندازه (عرض به پیکسل): {img.width}
                <span className="text-xs text-gray-500"> — کوچک ≈ ۱۵۰، متوسط ≈ ۴۰۰، بزرگ ≈ ۸۰۰</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={MIN_IMAGE_WIDTH}
                  max={MAX_IMAGE_WIDTH}
                  step={10}
                  value={img.width}
                  onChange={(e) => patch(img.id, { width: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  min={MIN_IMAGE_WIDTH}
                  max={MAX_IMAGE_WIDTH}
                  value={img.width}
                  onChange={(e) =>
                    patch(img.id, {
                      width: Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Number(e.target.value) || MIN_IMAGE_WIDTH)),
                    })
                  }
                  style={{ width: 90 }}
                />
              </div>
            </div>
          </div>
        );
      })}

      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 cursor-pointer text-sm text-gray-500 hover:border-green-500 hover:text-green-600 max-w-xs">
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> در حال آپلود...
          </>
        ) : (
          <>
            <Upload size={16} /> افزودن تصویر
          </>
        )}
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
      </label>
    </div>
  );
}

export default function PageImagesManager({
  initialAbout,
  initialContact,
  initialUnboxing = [],
  initialGallery = [],
}: {
  initialAbout: PageImage[];
  initialContact: PageImage[];
  initialUnboxing?: PageImage[];
  initialGallery?: PageImage[];
}) {
  const [about, setAbout] = useState<PageImage[]>(initialAbout);
  const [contact, setContact] = useState<PageImage[]>(initialContact);
  const [unboxing, setUnboxing] = useState<PageImage[]>(initialUnboxing);
  const [gallery, setGallery] = useState<PageImage[]>(initialGallery);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await updatePageImages({ about, contact, unboxing, gallery });
    setSaving(false);
    if (res?.error) setMessage({ type: "err", text: res.error });
    else setMessage({ type: "ok", text: "تصاویر ذخیره شد." });
  }

  return (
    <div className="space-y-5">
      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-1">تصاویر صفحه «درباره ما»</h2>
        <p className="text-xs text-gray-500 mb-3">
          «بعد از پاراگراف شماره N»: پاراگراف‌ها با یک خط خالی در متن «درباره ما» (تنظیمات عمومی) از هم جدا می‌شوند.
        </p>
        <ImageList kind="about" images={about} onChange={setAbout} />
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">تصاویر صفحه «تماس با ما»</h2>
        <ImageList kind="contact" images={contact} onChange={setContact} />
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">تصاویر صفحه «انباکس»</h2>
        <ImageList kind="unboxing" images={unboxing} onChange={setUnboxing} />
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">تصاویر صفحه «گالری»</h2>
        <ImageList kind="gallery" images={gallery} onChange={setGallery} />
      </div>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>{message.text}</p>
      )}
      <button type="button" onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
        {saving ? "در حال ذخیره..." : "ذخیره تصاویر صفحات"}
      </button>
    </div>
  );
}