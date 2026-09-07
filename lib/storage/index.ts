import { env } from "@/lib/env";
import { LocalDiskStorage } from "./local";
import { S3Storage } from "./s3";

export interface StorageAdapter {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

function createStorage(): StorageAdapter {
  if (env.STORAGE_DRIVER === "s3") {
    return new S3Storage({
      bucket: env.S3_BUCKET!,
      region: env.S3_REGION!,
      endpoint: env.S3_ENDPOINT,
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      publicUrl: env.S3_PUBLIC_URL!,
    });
  }
  return new LocalDiskStorage(env.UPLOADS_DIR);
}

const globalForStorage = globalThis as unknown as { storage?: StorageAdapter };
export const storage: StorageAdapter = globalForStorage.storage ?? createStorage();
if (process.env.NODE_ENV !== "production") globalForStorage.storage = storage;
