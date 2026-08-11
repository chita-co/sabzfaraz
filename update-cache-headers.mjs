import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";

// 🔑 کلیدهای خود را اینجا جایگزین کنید
const ACCESS_KEY = "fd9d2bce-e142-49c9-852d-eba230013eaf"; // همین Access Key که دارید
const SECRET_KEY = "dcac4e6e5acfdf65c5443fa1712e4d494cc5d3bd185010f6c8af268918d3eef9"; // Secret Key کامل (از پنل کپی کنید)
const BUCKET_NAME = "sabzfaraz-images";
const ENDPOINT = "https://s3.ir-thr-at1.arvanstorage.ir";

const client = new S3Client({
  region: "us-east-1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  forcePathStyle: true,
});

async function updateAllObjects() {
  console.log("شروع بررسی اشیای صندوقچه...");
  let continuationToken = undefined;
  let totalUpdated = 0;

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
    });
    const response = await client.send(listCommand);
    continuationToken = response.NextContinuationToken;

    if (response.Contents) {
      for (const obj of response.Contents) {
        const key = obj.Key;
        const copyCommand = new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `${BUCKET_NAME}/${key}`,
          Key: key,
          MetadataDirective: "REPLACE",
          CacheControl: "public, max-age=31536000, immutable",
          ContentType: obj.ContentType, // حفظ Content-Type
        });
        await client.send(copyCommand);
        totalUpdated++;
        console.log(`✅ ${key} - به‌روزرسانی شد`);
      }
    }
  } while (continuationToken);

  console.log(`\n🎉 تمام شد! ${totalUpdated} شی با Cache-Control جدید به‌روزرسانی شدند.`);
}

updateAllObjects().catch(err => console.error("❌ خطا:", err));