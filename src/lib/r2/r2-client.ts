import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {

  console.log("🚀 uploadToR2 chamado:", {
    keyLength: key.length,
    bufferSize: buffer.length,
    contentType,
    bucket: process.env.R2_BUCKET, // ✅
    hasCredentials: !!(
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
    ),
  });

  const result = await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!, // ✅
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = `${process.env.R2_PUBLIC_BASE_URL}/${key}`; // ✅
  return url;
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET!, // ✅
      Key: key,
    })
  );
}

export { r2 };