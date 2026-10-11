import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StorageService {
  saveFile(buffer: Buffer, originalName: string, subfolder: string): Promise<string>;
  deleteFile(relativePath: string): Promise<void>;
  getAbsolutePath(relativePath: string): string;
  validateFile(
    file: { mimetype: string; size: number; originalname: string },
    allowedMimes: string[],
    maxBytes: number
  ): { valid: boolean; error?: string };
}

export class LocalStorageService implements StorageService {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(baseDir || process.env.STORAGE_DIR || './uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, originalName: string, subfolder: string): Promise<string> {
    const targetFolder = path.join(this.baseDir, subfolder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const ext = path.extname(originalName);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const fullPath = path.join(targetFolder, uniqueName);

    await fs.promises.writeFile(fullPath, buffer);
    return path.posix.join('/uploads', subfolder, uniqueName);
  }

  async deleteFile(relativePath: string): Promise<void> {
    const cleanPath = relativePath.replace(/^\/uploads\//, '');
    const fullPath = path.join(this.baseDir, cleanPath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  getAbsolutePath(relativePath: string): string {
    const cleanPath = relativePath.replace(/^\/uploads\//, '');
    return path.join(this.baseDir, cleanPath);
  }

  validateFile(
    file: { mimetype: string; size: number; originalname: string },
    allowedMimes: string[],
    maxBytes: number
  ): { valid: boolean; error?: string } {
    if (file.size > maxBytes) {
      const maxMb = Math.round(maxBytes / (1024 * 1024));
      return { valid: false, error: `File size exceeds maximum limit of ${maxMb}MB` };
    }

    const matchesMime = allowedMimes.some(mime => {
      if (mime.endsWith('/*')) {
        return file.mimetype.startsWith(mime.replace('/*', ''));
      }
      return file.mimetype === mime;
    });

    if (!matchesMime) {
      return { valid: false, error: `Invalid file type. Allowed types: ${allowedMimes.join(', ')}` };
    }

    return { valid: true };
  }
}

export const defaultStorage = new LocalStorageService();
