import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import moment from "moment";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucketName = process.env.R2_BUCKET_NAME!;

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadImage(
  fileBuffer: Buffer,
  filename: string,
  type: string
) {
  const unix = moment().unix();
  const nameFile = `${unix}_${Math.random()
    .toString(36)
    .substring(2, 14)}-${filename}`;
  const date = moment().format("YYYY-MM");
  const key = `${date}/${nameFile}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentLength: fileBuffer.length,
    ContentType: type,
  });

  await client.send(command);

  const url = `${process.env.R2_URL}/${key}`;
  console.log(url, "url");
  return key;
}
