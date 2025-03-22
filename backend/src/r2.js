import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const requiredEnvVars = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_R2_BUCKET",
  "CLOUDFLARE_ACCESS_KEY",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const accessKey = process.env.CLOUDFLARE_ACCESS_KEY;
const secretKey = process.env.CLOUDFLARE_SECRET_KEY;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});

/**
 * Checks if a file exists in R2 storage
 * @param {string} key - File path/key to check
 * @returns {Promise<boolean>} - True if file exists
 */
export async function checkFileExists(key) {
  try {
    console.log(
      `Checking if ${key} exists in bucket ${process.env.CLOUDFLARE_R2_BUCKET}`
    );

    await s3.send(
      new HeadObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: key,
      })
    );

    // If we get here, the file exists
    console.log(`File ${key} exists in R2 storage`);
    return true;
  } catch (error) {
    // If the error code indicates the object doesn't exist, return false
    if (error.$metadata?.httpStatusCode === 404 || error.name === "NotFound") {
      console.log(`File ${key} does not exist in R2 storage`);
      return false;
    }

    // For any other error, rethrow
    console.error(`Error checking if file exists: ${error.message}`);
    throw error;
  }
}

/**
 * Uploads a file to R2 storage
 * @param {Buffer} fileBuffer - File content
 * @param {string} key - Path/key for the file
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - URL of the uploaded file
 */
export async function uploadImageToR2(
  fileBuffer,
  key,
  contentType = "image/jpeg"
) {
  try {
    console.log(
      `Uploading ${key} to bucket ${process.env.CLOUDFLARE_R2_BUCKET}`
    );

    // Check if file already exists
    const fileExists = await checkFileExists(key);
    if (fileExists) {
      throw new Error(
        `File ${key} already exists in R2 storage. Please contact Shashank to handle new picture request.`
      );
    }

    // File doesn't exist, proceed with upload
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    // Generate the URL for the uploaded file
    const imageUrl = `https://${process.env.CLOUDFLARE_R2_BUCKET}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    console.log("Upload complete, URL:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw error; // Rethrow to preserve the original error message
  }
}
