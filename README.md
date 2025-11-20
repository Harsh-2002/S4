# S4 - Modern S3 Storage Explorer

A blazing-fast, client-side file manager for S3-compatible cloud storage. Built entirely in the browser with no backend servers, no tracking, and no data collection.

## Features

- **100% Client-Side**: No backend servers, secure by design.
- **Multi-Cloud**: AWS S3, Cloudflare R2, MinIO, and more.
- **Secure**: Credentials encrypted locally with AES-GCM.
- **PWA Ready**: Install as a native app with offline support.
- **File Management**: Drag & drop, previews, and bulk actions.

## Quick Start

```bash
git clone https://github.com/Harsh-2002/S4.git
cd S4
npm install
npm run dev
```

## Configuration

### CORS Setup
To use S4, configure CORS on your bucket:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### IAM Permissions
Required: `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`.

## Tech Stack

- React 18 + TypeScript
- Vite + TailwindCSS
- AWS SDK v3

## License

MIT License.
