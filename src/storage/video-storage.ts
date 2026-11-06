/**
 * Pluggable Video Storage Client (Cloudflare R2 / S3)
 * Provides presigned upload URLs, download access, and ephemeral file deletion.
 * System Layer: storage
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || "repurpose-media";
const endpoint =
  process.env.R2_ENDPOINT ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "Missing Cloudflare R2 credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_ENDPOINT) in .env.local"
    );
  }

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3ClientInstance;
}

/**
 * Generates a presigned PUT URL allowing the client browser to upload directly to R2.
 * Bypasses Next.js server memory and payload limits.
 */
export async function getPresignedUploadUrl(params: {
  fileName: string;
  contentType: string;
  prefix?: string;
  expiresInSeconds?: number;
}): Promise<PresignedUploadResult> {
  const client = getS3Client();
  const safeName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const prefix = params.prefix ? `${params.prefix.replace(/\/+$/, "")}/` : "uploads/";
  const storageKey = `${prefix}${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds || 3600, // 1 hour default
  });

  const publicUrl = publicBaseUrl
    ? `${publicBaseUrl.replace(/\/+$/, "")}/${storageKey}`
    : uploadUrl.split("?")[0]; // Fallback to raw path without query params

  return {
    uploadUrl,
    storageKey,
    publicUrl,
  };
}

/**
 * Generates a presigned GET URL for downloading or playing private video objects.
 */
export async function getPresignedDownloadUrl(
  storageKey: string,
  expiresInSeconds = 7200
): Promise<string> {
  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/+$/, "")}/${storageKey}`;
  }

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
  });

  return await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Deletes an object from the R2 bucket.
 * Used to immediately delete the multi-GB source video once clips are rendered.
 */
export async function deleteStorageObject(storageKey: string): Promise<boolean> {
  try {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    });
    await client.send(command);
    console.log(`[storage:r2] Successfully deleted temporary object: ${storageKey}`);
    return true;
  } catch (err: any) {
    console.warn(`[storage:r2] Failed to delete object ${storageKey}:`, err.message);
    return false;
  }
}

/**
 * Health check utility to verify that Cloudflare R2 credentials and bucket are reachable.
 */
export async function verifyR2Connection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = getS3Client();
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await client.send(command);
    return {
      success: true,
      message: `Successfully connected to Cloudflare R2 bucket: "${bucketName}"`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to Cloudflare R2 bucket "${bucketName}": ${err.message}`,
    };
  }
}
