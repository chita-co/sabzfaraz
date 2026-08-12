// اسکریپت یک‌بارمصرف برای اصلاح Content-Type و Cache-Control اشیای موجود در باکت آروان
// اجرا: node fix-cache-headers.mjs
import { config } from 'dotenv';
config({ path: '.env.local' });
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";

const ACCESS_KEY = process.env.ARVAN_ACCESS_KEY;
const SECRET_KEY = process.env.ARVAN_SECRET_KEY;
const BUCKET_NAME = process.env.ARVAN_BUCKET_NAME;
const ENDPOINT = process.env.ARVAN_ENDPOINT;

if (!ACCESS_KEY || !SECRET_KEY || !BUCKET_NAME || !ENDPOINT) {
  console.error("❌ متغیرهای ARVAN_ACCESS_KEY / ARVAN_SECRET_KEY / ARVAN_BUCKET_NAME / ARVAN_ENDPOINT در .env.local تنظیم نشده‌اند.");
  process.exit(1);
}

const client = new S3Client({
  region: "ir-thr-at1",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  forcePathStyle: true,
});

function contentTypeFromKey(key) {
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  if (key.endsWith(".png")) return "image/png";
  return null; // نوع نامشخص → رد می‌شود تا خراب نشود
}

async function run() {
  console.log("شروع اصلاح Content-Type و Cache-Control...");
  let continuationToken;
  let fixed = 0, skipped = 0;

  do {
    const list = await client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, ContinuationToken: continuationToken }));
    continuationToken = list.NextContinuationToken;

    for (const obj of list.Contents ?? []) {
      const key = obj.Key;
      const contentType = contentTypeFromKey(key);
      if (!contentType) { skipped++; continue; }

      await client.send(new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${encodeURIComponent(key)}`,
        Key: key,
        MetadataDirective: "REPLACE",
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
        ACL: "public-read",
      }));
      fixed++;
      console.log(`✅ ${key} → ${contentType}`);
    }
  } while (continuationToken);

  console.log(`\n🎉 تمام شد. ${fixed} فایل اصلاح شد، ${skipped} فایل نامشخص رد شد.`);
}

run().catch((err) => console.error("❌ خطا:", err));