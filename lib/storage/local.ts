import fs from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "./index";

/**
 * Development adapter. Writes under UPLOADS_DIR and serves through
 * app/uploads/[...path]/route.ts.
 */
export class LocalDiskStorage implements StorageAdapter {
  private readonly root: string;

  constructor(dir: string) {
    this.root = path.resolve(process.cwd(), dir);
  }

  /** Resolve a key to an absolute path, refusing anything outside the root. */
  resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }

  publicUrl(key: string): string {
    return `/uploads/${key}`;
  }
}
