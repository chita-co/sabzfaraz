// scripts/add-admin-guard.mjs
// اجرا از ریشه‌ی پروژه:  node scripts/add-admin-guard.mjs
// به ابتدای هر "export async function" در فایل‌های "use server" پوشه‌ی src/app/admin
// خط  await requireAdmin();  اضافه می‌کند (اگر قبلاً نداشته باشد). چند بار اجرا شود، تکراری اضافه نمی‌کند.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src", "app", "admin");
const IMPORT_LINE = 'import { requireAdmin } from "@/lib/auth/requireAdmin";';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

// پیدا کردن "{" ابتدای بدنه‌ی تابع، بعد از پرانتز پارامترها و (اختیاری) نوع بازگشتی
function findBodyOpen(src, startAfterName) {
  let i = src.indexOf("(", startAfterName);
  if (i < 0) return -1;
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "(") depth++;
    else if (c === ")") { depth--; if (depth === 0) { i++; break; } }
  }
  while (/\s/.test(src[i])) i++;
  if (src[i] === ":") {
    i++;
    let angle = 0, brace = 0, paren = 0;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === "<") angle++;
      else if (c === ">" && src[i - 1] !== "=") angle--;
      else if (c === "(") paren++;
      else if (c === ")") paren--;
      else if (c === "{") {
        if (angle === 0 && paren === 0 && brace === 0) {
          const before = src.slice(0, i).trimEnd();
          const last = before[before.length - 1];
          if (!(last === ":" || last === "|" || last === "&" || last === "," || last === "<")) return i;
        }
        brace++;
      } else if (c === "}") brace--;
    }
    return -1;
  }
  return src[i] === "{" ? i : -1;
}

let changedFiles = 0, guarded = 0, skipped = 0;
const report = [];

for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, "utf8");
  if (!/^\s*["']use server["']/m.test(src)) continue;
  const eol = src.includes("\r\n") ? "\r\n" : "\n";

  const re = /^export\s+async\s+function\s+(\w+)/gm;
  const hits = [];
  let m;
  while ((m = re.exec(src))) hits.push({ name: m[1], index: m.index, nameEnd: m.index + m[0].length });

  // از آخر به اول تا ایندکس‌ها بهم نخورند
  const hitsForward = [...hits];
  let fileChanged = false;
  for (const h of hits.reverse()) {
    const open = findBodyOpen(src, h.nameEnd);
    if (open < 0) { report.push(`!! نتوانستم بدنه را پیدا کنم: ${file} :: ${h.name}`); continue; }
    // اگر در بدنه‌ی همین تابع (تا ابتدای تابع بعدی) requireAdmin هست، رد کن
    const nextIdx = hitsForward[hitsForward.findIndex((x) => x.index === h.index) + 1]?.index ?? src.length;
    const peek = src.slice(open, nextIdx);
    if (/requireAdmin\s*\(/.test(peek)) { skipped++; continue; }
    src = src.slice(0, open + 1) + eol + "  await requireAdmin();" + src.slice(open + 1);
    guarded++; fileChanged = true;
  }

  if (fileChanged) {
    if (!src.includes(IMPORT_LINE) && !/from\s+["']@\/lib\/auth\/requireAdmin["']/.test(src)) {
      src = src.replace(/^(\s*["']use server["'];?\s*)(\r?\n)/m, (all, a, nl) => `${a}${nl}${IMPORT_LINE}${nl}`);
    }
    fs.writeFileSync(file, src);
    changedFiles++;
    report.push(`✔ ${path.relative(process.cwd(), file)}`);
  }
}

console.log(report.join("\n"));
console.log(`\nفایل تغییر یافته: ${changedFiles} | تابع محافظت‌شده: ${guarded} | از قبل محافظت‌شده: ${skipped}`);