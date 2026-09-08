export async function submitUrlToIndexNow(url: string) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return;

  const host = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host,
        key,
        urlList: [url],
      }),
    });
  } catch (error) {
    console.error("IndexNow submit failed:", error);
  }
}