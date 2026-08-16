import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex, nofollow" />
  <title>نماد اعتماد شخص</title>
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; background:transparent;">
  <a referrerPolicy="origin" target="_blank" rel="noreferrer" href="https://trustseal.enamad.ir/?id=775040&Code=fh4SEG1KfFjUvs1m6W7qx2zcqVDNviQv">
    <img
      referrerPolicy="origin"
      src="https://trustseal.enamad.ir/logo.aspx?id=775040&Code=fh4SEG1KfFjUvs1m6W7qx2zcqVDNviQv"
      alt="نماد اعتماد شخص"
      style="display:block; max-width:150px; height:auto;"
    />
  </a>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}