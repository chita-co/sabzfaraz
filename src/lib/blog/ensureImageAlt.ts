export function ensureImageAlt(html: string, fallback: string): string {
  const safe = fallback.replace(/"/g, "&quot;");
  return html.replace(/<img\b(?![^>]*\balt=)([^>]*)>/gi, `<img alt="${safe}"$1>`);
}