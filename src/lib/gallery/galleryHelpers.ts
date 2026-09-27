// آدرس embed رسمی اینستاگرام را از روی لینک پست/ریلز می‌سازد (بدون نیاز به هیچ API یا توکن)
export function buildInstagramEmbedUrl(rawUrl: string): string | null {
  const input = rawUrl.trim();
  const match = input.match(/instagram\.com\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const [, type, code] = match;
  return `https://www.instagram.com/${type}/${code}/embed/captioned/`;
}