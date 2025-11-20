
export interface S3Config {
  id: string;
  label?: string; // User defined profile name
  name: string; // Bucket name (kept for backward compat if needed, but usually bucketName is used)
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName?: string;
  provider: 'aws' | 'cloudflare' | 'minio' | 'other';
  readOnly?: boolean;
}

export interface FileObject {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
  isFolder: boolean;
  mimeType?: string;
}

export interface BucketObject {
  name: string;
  creationDate?: Date;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export enum ViewMode {
  LIST = 'LIST',
  GRID = 'GRID'
}

export interface UploadTask {
  id: string;
  fileName: string;
  progress: number; // 0 to 100
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  speed?: string;
  loaded?: number;
  total?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
