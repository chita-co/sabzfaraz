export type VideoPlatform = "aparat" | "youtube" | "instagram";

export function extractVideoId(platform: VideoPlatform, rawInput: string): string | null {
  const input = rawInput.trim();
  if (!input) return null;

  if (platform === "aparat") {
    const embedMatch = input.match(/embed\/videohash\/([a-zA-Z0-9]+)/);
    if (embedMatch) return embedMatch[1];
    const watchMatch = input.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/);
    if (watchMatch) return watchMatch[1];
    if (/^[a-zA-Z0-9]+$/.test(input)) return input; // فقط شناسه پیست شده
    return null;
  }

  // youtube
  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = input.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch) return embedMatch[1];
  if (/^[a-zA-Z0-9_-]{6,}$/.test(input)) return input;
  return null;
}

export function buildEmbedUrl(platform: VideoPlatform, videoId: string): string {
  if (platform === "aparat") {
    return `https://www.aparat.com/video/video/embed/videohash/${videoId}/vt/frame`;
  }
  return `https://www.youtube.com/embed/${videoId}`;
}

export function buildThumbnailUrl(platform: VideoPlatform, videoId: string): string {
  if (platform === "aparat") {
    return `https://static.cdn.asset.aparat.com/avt/${videoId}.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}