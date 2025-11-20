# S4 - Modern S3 Storage Explorer

A blazing-fast, client-side file manager for S3-compatible cloud storage. Built entirely in the browser with no backend servers, no tracking, and no data collection.

S4 provides a clean, modern interface for managing your cloud storage across AWS S3, Cloudflare R2, MinIO, and any S3-compatible provider.

## Features

- **100% Client-Side**: All operations run in your browser. No backend servers, no data collection.
- **Multi-Cloud Support**: Works with AWS S3, Cloudflare R2, MinIO, and any S3-compatible storage.
- **Secure by Design**: Credentials encrypted with AES-GCM and stored locally in your browser.
- **File Management**: Upload, download, delete, move, and organize files and folders.
- **Instant Previews**: View images, videos, PDFs, and markdown files without downloading.
- **Drag & Drop**: Upload files and folders effortlessly with drag-and-drop support.
- **Storage Analytics**: View bucket and total storage usage across your accounts.
- **Keyboard Shortcuts**: Navigate quickly with Cmd+K command palette.
- **Read-Only Mode**: Safe browsing with limited IAM permissions.
- **Share Links**: Generate temporary presigned URLs for file sharing.

## Quick Start

### Prerequisites

- Node.js 18 or higher
- S3-compatible storage credentials (access key, secret key, endpoint)

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Harsh-2002/S4.git
   cd S4
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to any static hosting service.

## Supported Storage Providers

### AWS S3

**Endpoint:** `s3.amazonaws.com` or region-specific like `s3.us-east-1.amazonaws.com`

**Configuration:**
- Region: Your bucket's region (e.g., `us-east-1`)
- Access Key ID: Your IAM user access key
- Secret Access Key: Your IAM user secret key

### Cloudflare R2

**Endpoint:** `https://<account-id>.r2.cloudflarestorage.com`

**Configuration:**
- Region: `auto`
- Access Key ID: R2 API token ID
- Secret Access Key: R2 API token secret

### MinIO

**Endpoint:** Your MinIO server URL (e.g., `https://minio.example.com`)

**Configuration:**
- Region: Your configured region or `us-east-1`
- Access Key ID: MinIO access key
- Secret Access Key: MinIO secret key

### Other S3-Compatible Providers

Any storage provider that implements the S3 API should work. Configure the endpoint, region, and credentials accordingly.

## Required IAM Permissions

For full functionality, your IAM user or API token needs the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::*"
      ]
    }
  ]
}
```

**Minimal Permissions (Read-Only Mode):**
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:ListBucket",
    "s3:GetObject"
  ],
  "Resource": [
    "arn:aws:s3:::your-bucket-name",
    "arn:aws:s3:::your-bucket-name/*"
  ]
}
```

## CORS Configuration

Since S4 runs in your browser, you must configure CORS on your S3 bucket to allow browser access.

Add this CORS policy to your bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"]
  }
]
```

For production deployments, replace `"AllowedOrigins": ["*"]` with your specific domain.

## Deployment

S4 is a static web application and can be deployed to any static hosting service:

### Vercel

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm run build
# Drag the dist/ folder to Netlify's web interface
```

### GitHub Pages

```bash
npm run build
# Deploy the dist/ folder to your gh-pages branch
```

### AWS S3 + CloudFront

```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name
# Configure CloudFront distribution pointing to the bucket
```

## Architecture

S4 is built with modern web technologies:

- **React 18**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first styling
- **AWS SDK v3**: S3 client operations
- **Lucide React**: Icon library
- **Web Crypto API**: Local credential encryption

### Security Architecture

1. **No Backend**: All code runs in the browser. There are no servers collecting data.
2. **Local Encryption**: Connection profiles are encrypted using AES-GCM 256-bit encryption.
3. **Direct API Calls**: Your browser connects directly to your S3 provider.
4. **No Tracking**: No analytics, no cookies, no telemetry.

## Development

### Project Structure

```
S4/
├── components/         # React components
│   ├── Landing.tsx    # Landing page
│   ├── Login.tsx      # Connection setup
│   ├── BucketList.tsx # Bucket sidebar
│   └── Explorer.tsx   # File browser
├── services/          # Business logic
│   ├── s3Service.ts   # S3 API client
│   └── cryptoService.ts # Encryption utilities
├── types.ts           # TypeScript definitions
├── constants.ts       # App constants
└── App.tsx           # Main app component
```

### Tech Stack

- React 18.3
- TypeScript 5.6
- Vite 6.4
- TailwindCSS 3.4
- AWS SDK for JavaScript v3
- Lucide React for icons

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the repository for details.

## Support

- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/Harsh-2002/S4/issues)
- **Discussions**: Ask questions on [GitHub Discussions](https://github.com/Harsh-2002/S4/discussions)

## Acknowledgments

Built with modern web technologies and inspired by the need for a better S3 file management experience.
