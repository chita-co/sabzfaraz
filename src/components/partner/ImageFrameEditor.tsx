"use client";
import { useRef, useState, useCallback } from "react";
import { Camera, ImageIcon } from "lucide-react";

interface FrameConfig {
  frameUrl: string;
  centerX: number; centerY: number; centerWidth: number; centerHeight: number;
  outputSize: number;
}

const PREVIEW_SIZE = 260;

export default function ImageFrameEditor({
  config, onComposited,
}: { config: FrameConfig; onComposited: (finalBlob: Blob, rawCropBlob: Blob) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoSrc(URL.createObjectURL(file));
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  }
  function handlePointerUp() { dragRef.current = null; }

  const generateFinal = useCallback(async () => {
    if (!photoSrc) return;
    const canvas = document.createElement("canvas");
    canvas.width = config.outputSize;
    canvas.height = config.outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerXpx = (config.centerX / 100) * config.outputSize;
    const centerYpx = (config.centerY / 100) * config.outputSize;
    const centerWpx = (config.centerWidth / 100) * config.outputSize;
    const centerHpx = (config.centerHeight / 100) * config.outputSize;

    // تبدیل افستِ درگ‌شده در پیش‌نمایش (۲۶۰px) به مقیاس واقعیِ بوم خروجی
    const scaleFactor = config.outputSize / PREVIEW_SIZE;
    const scaledOffsetX = offset.x * scaleFactor;
    const scaledOffsetY = offset.y * scaleFactor;

    const photoImg = new Image();
    photoImg.crossOrigin = "anonymous";
    await new Promise((resolve) => { photoImg.onload = resolve; photoImg.src = photoSrc; });

    ctx.save();
    ctx.beginPath();
    ctx.rect(centerXpx, centerYpx, centerWpx, centerHpx);
    ctx.clip();

    const scale = Math.max(centerWpx / photoImg.width, centerHpx / photoImg.height) * zoom;
    const drawW = photoImg.width * scale;
    const drawH = photoImg.height * scale;
    const drawX = centerXpx + centerWpx / 2 - drawW / 2 + scaledOffsetX;
    const drawY = centerYpx + centerHpx / 2 - drawH / 2 + scaledOffsetY;
    ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
    ctx.restore();

    // برش خام (فقط همون چیزی که داخل قاب دیده می‌شه) — برای بازتولید بعدی اگر قالب عوض شد
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = Math.round(centerWpx);
    cropCanvas.height = Math.round(centerHpx);
    const cropCtx = cropCanvas.getContext("2d");
    cropCtx?.putImageData(ctx.getImageData(centerXpx, centerYpx, centerWpx, centerHpx), 0, 0);
    const rawCropBlob: Blob = await new Promise((resolve) => cropCanvas.toBlob((b) => resolve(b!), "image/webp", 0.92));

    const frameImg = new Image();
    frameImg.crossOrigin = "anonymous";
    const proxiedFrameUrl = `/api/image-proxy?url=${encodeURIComponent(config.frameUrl)}`;
await new Promise((resolve) => { frameImg.onload = resolve; frameImg.src = proxiedFrameUrl; });
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => { if (blob) onComposited(blob, rawCropBlob); }, "image/webp", 0.9);
  }, [photoSrc, offset, zoom, config, onComposited]);

  return (
    <div>
      {!photoSrc ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="partner-btn partner-btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Camera size={15} /> گرفتن عکس / انتخاب از گالری
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
        </div>
      ) : (
        <div>
          <div
            style={{ position: "relative", width: PREVIEW_SIZE, height: PREVIEW_SIZE, margin: "0 auto", overflow: "hidden", borderRadius: 10, background: "#f3f4f6", touchAction: "none", cursor: "grab" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              style={{
                position: "absolute",
                left: `${config.centerX}%`,
                top: `${config.centerY}%`,
                width: `${config.centerWidth}%`,
                height: `${config.centerHeight}%`,
                backgroundImage: `url(${photoSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: "center",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.frameUrl} alt="قاب" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, justifyContent: "center" }}>
            <span style={{ fontSize: 11 }}>زوم</span>
            <input type="range" min={0.5} max={2.5} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="partner-btn partner-btn-secondary" style={{ fontSize: 12 }}>
              <ImageIcon size={13} style={{ display: "inline", marginLeft: 4 }} /> تعویض عکس
            </button>
            <button type="button" onClick={generateFinal} className="partner-btn partner-btn-primary" style={{ fontSize: 12 }}>
              تأیید و افزودن این عکس
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        </div>
      )}
    </div>
  );
}