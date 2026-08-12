import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";

// 🔑 کلیدهای شما (از پنل اروان)
const ACCESS_KEY = "fd9d2bce-e142-49c9-852d-eba230013eaf";
const SECRET_KEY = "dcac4e6e5acfdf65c5443fa1712e4d494cc5d3bd185010f6c8af268918d3eef9";
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

async function revertAllObjects() {
  console.log("شروع بازگردانی اشیا...");
  let continuationToken = undefined;
  let totalReverted = 0;

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
        // کپی شی روی خودش با ACL عمومی و حذف Cache-Control
        const copyCommand = new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `${BUCKET_NAME}/${key}`,
          Key: key,
          ACL: "public-read",          // برگرداندن دسترسی عمومی
          MetadataDirective: "REPLACE",
          CacheControl: "",             // حذف هدر Cache-Control (مقدار خالی)
          ContentType: obj.ContentType, // حفظ نوع محتوا
        });
        await client.send(copyCommand);
        totalReverted++;
        console.log(`✅ بازگردانی شد: ${key}`);
      }
    }
  } while (continuationToken);

  console.log(`\n🎉 تمام اشیا (${totalReverted} عدد) به حالت اولیه بازگشتند.`);
}

revertAllObjects().catch(err => console.error("❌ خطا:", err));