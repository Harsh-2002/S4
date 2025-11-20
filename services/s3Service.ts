
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import JSZip from 'jszip';
import { S3Config, FileObject, BucketObject } from '../types';

// Helper to format bytes
export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export class S3Service {
  private client: S3Client | null = null;
  private config: S3Config | null = null;

  constructor(config?: S3Config) {
    if (config) {
      this.init(config);
    }
  }

  init(config: S3Config) {
    this.config = config;
    this.client = new S3Client({
      region: config.region || 'us-east-1', // Fallback to us-east-1 if region is empty/undefined
      endpoint: config.endpoint || undefined,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Needed for MinIO and compatible with others
      // Explicitly disable TLS if connecting to localhost without https (common for MinIO)
      tls: config.endpoint?.includes('localhost') && config.endpoint?.startsWith('http:') ? false : true,
    });
  }

  // Update config without re-instantiating client (useful for switching buckets)
  updateConfig(newConfig: Partial<S3Config>) {
    if (this.config) {
      this.config = { ...this.config, ...newConfig };
    }
  }

  async listBuckets(): Promise<BucketObject[]> {
    if (!this.client) throw new Error("S3 Client not initialized");

    try {
      const command = new ListBucketsCommand({});
      const response = await this.client.send(command);

      return (response.Buckets || []).map(b => ({
        name: b.Name || 'Unknown',
        creationDate: b.CreationDate
      }));
    } catch (error) {
      console.error("Error listing buckets:", error);
      throw error;
    }
  }

  async createBucket(bucketName: string): Promise<void> {
    if (!this.client) throw new Error("S3 Client not initialized");
    try {
      const command = new CreateBucketCommand({
        Bucket: bucketName,
      });
      await this.client.send(command);
    } catch (error) {
      console.error("Error creating bucket:", error);
      throw error;
    }
  }

  async deleteBucket(bucketName: string): Promise<void> {
    if (!this.client) throw new Error("S3 Client not initialized");
    try {
      const command = new DeleteBucketCommand({
        Bucket: bucketName
      });
      await this.client.send(command);
    } catch (error) {
      console.error("Error deleting bucket:", error);
      throw error;
    }
  }

  async listFiles(prefix: string = ''): Promise<FileObject[]> {
    if (!this.client || !this.config) throw new Error("S3 Client not initialized");
    if (!this.config.bucketName) throw new Error("No bucket selected");

    try {
      let isTruncated = true;
      let continuationToken: string | undefined = undefined;
      const allFiles: FileObject[] = [];

      // Pagination loop to fetch all files in the current directory
      while (isTruncated) {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: this.config.bucketName,
          Prefix: prefix,
          Delimiter: '/',
          ContinuationToken: continuationToken,
        });

        const response = await this.client.send(command);

        // Handle folders (CommonPrefixes)
        if (response.CommonPrefixes) {
          response.CommonPrefixes.forEach((p) => {
            if (p.Prefix) {
              // Avoid duplicates if pagination returns them (rare for CommonPrefixes but good safety)
              const exists = allFiles.some(f => f.key === p.Prefix);
              if (!exists) {
                allFiles.push({
                  key: p.Prefix,
                  name: p.Prefix.replace(prefix, '').replace('/', ''),
                  size: 0,
                  lastModified: new Date(),
                  isFolder: true,
                });
              }
            }
          });
        }

        // Handle files (Contents)
        if (response.Contents) {
          response.Contents.forEach((c) => {
            if (c.Key && c.Key !== prefix) { // Skip the folder object itself if it exists
              allFiles.push({
                key: c.Key,
                name: c.Key.replace(prefix, ''),
                size: c.Size || 0,
                lastModified: c.LastModified || new Date(),
                isFolder: false,
                mimeType: this.getMimeType(c.Key),
              });
            }
          });
        }

        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;
      }

      // Sort: Folders first, then files. Alphabetical.
      return allFiles.sort((a, b) => {
        if (a.isFolder === b.isFolder) {
          return a.name.localeCompare(b.name);
        }
        return a.isFolder ? -1 : 1;
      });

    } catch (error) {
      console.error("Error listing files:", error);
      throw error;
    }
  }

  // Helper: Recursively list all objects with a prefix (no delimiter)
  private async listAllObjects(prefix: string): Promise<{ Key: string; Size: number }[]> {
    if (!this.client || !this.config?.bucketName) throw new Error("Invalid state");

    let isTruncated = true;
    let continuationToken: string | undefined = undefined;
    const objects: { Key: string; Size: number }[] = [];

    while (isTruncated) {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.client.send(command);

      if (response.Contents) {
        response.Contents.forEach(c => {
          if (c.Key) objects.push({ Key: c.Key, Size: c.Size || 0 });
        });
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }

    return objects;
  }

  async deleteFolder(prefix: string): Promise<void> {
    if (!this.client || !this.config?.bucketName) throw new Error("Invalid state");

    // 1. List all objects recursively
    const objects = await this.listAllObjects(prefix);

    if (objects.length === 0) return;

    // 2. Delete in batches of 1000 (S3 limit)
    const batchSize = 1000;
    for (let i = 0; i < objects.length; i += batchSize) {
      const batch = objects.slice(i, i + batchSize);
      const command = new DeleteObjectsCommand({
        Bucket: this.config.bucketName,
        Delete: {
          Objects: batch.map(o => ({ Key: o.Key })),
          Quiet: true
        }
      });
      await this.client.send(command);
    }
  }

  // Calculate total size of a bucket (or prefix within bucket)
  async getBucketSize(bucketName?: string, prefix: string = ''): Promise<number> {
    if (!this.client) throw new Error("S3 Client not initialized");

    const targetBucket = bucketName || this.config?.bucketName;
    if (!targetBucket) throw new Error("No bucket specified");

    try {
      let isTruncated = true;
      let continuationToken: string | undefined = undefined;
      let totalSize = 0;

      while (isTruncated) {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: targetBucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const response = await this.client.send(command);

        if (response.Contents) {
          response.Contents.forEach(c => {
            totalSize += c.Size || 0;
          });
        }

        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;
      }

      return totalSize;
    } catch (error) {
      console.error(`Error calculating bucket size for ${targetBucket}:`, error);
      throw error;
    }
  }

  async downloadFolderAsZip(prefix: string): Promise<Blob> {
    if (!this.client || !this.config?.bucketName) throw new Error("Invalid state");

    const zip = new JSZip();
    const objects = await this.listAllObjects(prefix);

    await Promise.all(objects.map(async (obj) => {
      if (obj.Key.endsWith('/')) return; // Skip folder markers

      try {
        const command = new GetObjectCommand({
          Bucket: this.config!.bucketName,
          Key: obj.Key
        });

        const response = await this.client!.send(command);
        if (response.Body) {
          // transformToByteArray is available in v3 sdk browser client
          const byteArray = await response.Body.transformToByteArray();

          // Calculate relative path
          const relativePath = obj.Key.startsWith(prefix)
            ? obj.Key.substring(prefix.length)
            : obj.Key;

          zip.file(relativePath, byteArray);
        }
      } catch (e) {
        console.error(`Failed to download ${obj.Key} for zip`, e);
      }
    }));

    return await zip.generateAsync({ type: "blob" });
  }

  async downloadFilesAsZip(files: FileObject[]): Promise<Blob> {
    if (!this.client || !this.config?.bucketName) throw new Error("Invalid state");
    const zip = new JSZip();

    // Limit concurrency slightly to avoid overwhelming network/browser
    const downloadFile = async (file: FileObject) => {
      try {
        const command = new GetObjectCommand({
          Bucket: this.config!.bucketName,
          Key: file.key
        });
        const response = await this.client!.send(command);
        if (response.Body) {
          const byteArray = await response.Body.transformToByteArray();
          zip.file(file.name, byteArray);
        }
      } catch (e) {
        console.error("Failed to zip", file.key);
      }
    };

    for (const f of files) {
      await downloadFile(f);
    }

    return await zip.generateAsync({ type: "blob" });
  }

  async getPresignedUrl(key: string, options?: { download?: boolean, expiresIn?: number }): Promise<string> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 Client invalid");

    const commandInput: any = {
      Bucket: this.config.bucketName,
      Key: key,
    };

    if (options?.download) {
      const filename = key.split('/').pop() || 'file';
      commandInput.ResponseContentDisposition = `attachment; filename="${filename}"`;
    }

    const command = new GetObjectCommand(commandInput);

    // Default 1 hour (3600)
    return getSignedUrl(this.client, command, { expiresIn: options?.expiresIn || 3600 });
  }

  async saveFileContent(key: string, content: string, mimeType: string = 'text/plain'): Promise<void> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 Client invalid");
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: content,
      ContentType: mimeType
    });
    await this.client.send(command);
  }

  async uploadFile(
    file: File,
    prefix: string,
    onProgress?: (progress: number, loaded: number, total: number) => void
  ): Promise<void> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 Client invalid");

    const key = `${prefix}${file.name}`;

    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.config.bucketName,
          Key: key,
          Body: file,
          ContentType: file.type,
        },
      });

      upload.on("httpUploadProgress", (progress) => {
        if (progress.loaded !== undefined && progress.total !== undefined && onProgress) {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percentage, progress.loaded, progress.total);
        }
      });

      await upload.done();
    } catch (error: any) {
      console.error("Standard upload failed:", error);

      const isMiddlewareError = error.message && (
        error.message.includes("middleware") ||
        error.message.includes("serializerMiddleware") ||
        error.message.includes("is not a function")
      );

      if (isMiddlewareError) {
        console.warn("Falling back to simple PutObjectCommand due to SDK middleware issue");

        const command = new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
          Body: file,
          ContentType: file.type,
        });

        await this.client.send(command);

        if (onProgress) onProgress(100, file.size, file.size);
        return;
      }

      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 Client invalid");

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  async createFolder(folderName: string, prefix: string): Promise<void> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 Client invalid");

    const sanitizedName = folderName.replace(/^\/+|\/+$/g, '');
    const key = `${prefix}${sanitizedName}/`;

    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: '',
    });

    await this.client.send(command);
  }

  async moveObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    if (!this.client) throw new Error("S3 Client invalid");

    // 1. Copy
    // CopySource must be URL encoded (bucket/key).
    const copySource = `${sourceBucket}/${encodeURIComponent(sourceKey)}`;

    await this.client.send(new CopyObjectCommand({
      Bucket: destBucket,
      Key: destKey,
      CopySource: copySource
    }));

    // 2. Delete Original
    await this.client.send(new DeleteObjectCommand({
      Bucket: sourceBucket,
      Key: sourceKey
    }));
  }

  async moveFolder(sourceBucket: string, sourcePrefix: string, destBucket: string, destPrefix: string): Promise<void> {
    if (!this.client) throw new Error("S3 Client invalid");

    // 1. List all objects in source folder
    const objects = await this.listAllObjects(sourcePrefix);
    if (objects.length === 0) return;

    // 2. Move each object
    for (const obj of objects) {
      const relativePath = obj.Key.substring(sourcePrefix.length);
      const newKey = `${destPrefix}${relativePath}`;
      await this.moveObject(sourceBucket, obj.Key, destBucket, newKey);
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'svg': return 'image/svg+xml';
      case 'webp': return 'image/webp';
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'json': return 'application/json';
      case 'js': return 'application/javascript';
      case 'ts': return 'text/plain';
      case 'tsx': return 'text/plain';
      case 'jsx': return 'text/plain';
      case 'css': return 'text/css';
      case 'html': return 'text/html';
      case 'zip':
      case 'rar':
      case '7z': return 'application/zip';
      case 'mp4':
      case 'mov': return 'video/mp4';
      case 'mp3':
      case 'wav': return 'audio/mpeg';
      default: return 'application/octet-stream';
    }
  }
}
