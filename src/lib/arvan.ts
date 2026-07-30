// src/lib/arvan.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  endpoint: process.env.ARVAN_ENDPOINT,
  region: "default",
  credentials: {
    accessKeyId: process.env.ARVAN_ACCESS_KEY!,
    secretAccessKey: process.env.ARVAN_SECRET_KEY!,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const ARVAN_BUCKET = process.env.ARVAN_BUCKET_NAME!;

export function getPublicUrl(key: string) {
  return `${process.env.ARVAN_ENDPOINT}/${ARVAN_BUCKET}/${key}`;
}

export function getKeyFromUrl(url: string) {
  const prefix = `${process.env.ARVAN_ENDPOINT}/${ARVAN_BUCKET}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : url;
}

export async function uploadImage(buffer: Buffer, key: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: ARVAN_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/webp",
      ACL: "public-read",
    })
  );
  return getPublicUrl(key);
}

export async function deleteImageByUrl(url: string) {
  const key = getKeyFromUrl(url);
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: ARVAN_BUCKET, Key: key }));
  } catch (e) {
    console.error("خطا در حذف تصویر از باکت:", e);
  }
}