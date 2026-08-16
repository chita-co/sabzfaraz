import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex, nofollow" />
  <title>نماد اعتماد شرکت</title>
</head>
<body style="margin:0; display:flex; justify-content:center; align-items:center; background:transparent;">
  <a referrerPolicy="origin" target="_blank" rel="noreferrer" href="https://trustseal.enamad.ir/?id=771198&Code=xJTGAB5Hqaj2vITUvbXueKZ5VdtlPdHk">
    <img
      referrerPolicy="origin"
      src="https://trustseal.enamad.ir/logo.aspx?id=771198&Code=xJTGAB5Hqaj2vITUvbXueKZ5VdtlPdHk"
      alt="نماد اعتماد شرکت"
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