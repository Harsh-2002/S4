import { S3Config } from './types';

export const DEFAULT_S3_CONFIG: Partial<S3Config> = {
  region: 'us-east-1',
  provider: 'aws',
};

export const PROVIDERS = [
  { id: 'aws', name: 'AWS S3', icon: 'Cloud' },
  { id: 'cloudflare', name: 'Cloudflare R2', icon: 'CloudLightning' },
  { id: 'minio', name: 'MinIO', icon: 'Server' },
  { id: 'other', name: 'Custom S3', icon: 'Globe' },
];

export const MOCK_FILES = [
  { key: 'documents/', name: 'documents', size: 0, lastModified: new Date(), isFolder: true },
  { key: 'images/', name: 'images', size: 0, lastModified: new Date(), isFolder: true },
  { key: 'backup.zip', name: 'backup.zip', size: 1024 * 1024 * 50, lastModified: new Date(), isFolder: false, mimeType: 'application/zip' },
  { key: 'project-logo.png', name: 'project-logo.png', size: 1024 * 250, lastModified: new Date(), isFolder: false, mimeType: 'image/png' },
  { key: 'notes.txt', name: 'notes.txt', size: 1024, lastModified: new Date(), isFolder: false, mimeType: 'text/plain' },
];
