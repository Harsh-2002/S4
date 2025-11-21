# S4 - Copilot Instructions

S4 is a **100% client-side S3 file manager** built with React 18, TypeScript, and Vite. It requires NO backend servers and supports AWS S3, Cloudflare R2, MinIO, and any S3-compatible storage.

## Architecture Overview

### Data Flow
```
Landing → Login (credential form) → Explorer (file manager)
         ↓ (save encrypted profiles)
    BucketList (sidebar navigation)
```

- **Profile Management**: S3Config stored locally (encrypted with AES-GCM via `cryptoService`)
- **Multi-bucket Support**: Users can switch buckets via CommandPalette (Cmd+K)
- **Ephemeral State**: All configs/uploads live in memory—nothing persists except encrypted profiles

### Core Services

**`s3Service.ts`**
- Wraps AWS SDK v3 (`@aws-sdk/client-s3`)
- Initializes S3Client with `forcePathStyle: true` (MinIO/custom endpoints compatibility)
- Key methods: `listBuckets()`, `listObjects()`, `uploadFile()`, `deleteObject()`
- Upload tracking: Uses `@aws-sdk/lib-storage` with progress callbacks
- Handles diverse S3 providers (AWS, R2, MinIO) via endpoint/region config

**`cryptoService.ts`**
- Client-side encryption: AES-GCM (256-bit key via Web Crypto API)
- Key stored in localStorage (obfuscation layer; XSS still exposes it—this is by design for PWA convenience)
- Patterns: `encrypt(data)` → base64 string, `decrypt(string)` → JSON object

### Component Hierarchy

- **`App.tsx`**: Root orchestrator—manages app state (landing/login/app), profile lifecycle, upload queue, theme
- **`Explorer.tsx`**: Main file manager (1918 lines)—virtualized list, drag/drop, previews, bulk actions, error handling
- **`BucketList.tsx`**: Sidebar—bucket selection, creation/deletion
- **`CommandPalette.tsx`**: Global search (Cmd+K)—bucket/profile switching, theme toggle
- **`Login.tsx`**: Profile form—handles provider-specific placeholders (AWS vs MinIO vs R2)
- **`Landing.tsx`**: Onboarding marketing page
- **Support Components**: `ImagePreview`, `BottomSheet`, `SwipeableListItem`, `PageTransition`

## Developer Workflows

### Build & Run
```bash
npm install
npm run dev    # Starts Vite @ localhost:3000
npm run build  # Outputs dist/ (static files)
```

### Docker Deploy
```bash
docker build -t s4 .
docker run -p 8080:8080 s4
```
- Multi-stage build: Node builds React → Caddy serves static files
- Caddyfile routes all requests to index.html (SPA support)

### Key Commands Not Obvious from Files
- **Cmd/Ctrl+K**: Opens CommandPalette (Cmd+K handler in App.useEffect)
- **Mobile UI**: Responsive breakpoint at 768px via `useIsMobile()` hook
- **Upload Speed Calc**: `(loaded / duration) = bytesPerSec` (App.handleUpload)

## Project-Specific Patterns

### Error Handling (Explorer.tsx)
- AWS SDK errors mapped to human-readable messages in `getAwsErrorMessage()`
- Special handling: CORS errors show config snippet, AccessDenied suggests IAM fixes
- **Pattern**: Catch AWS errors → extract metadata (code, message, httpStatusCode) → display with docs link

### File Preview System (Explorer.tsx)
- MIME type detection → renders appropriate preview (images, PDFs, text, markdown)
- DOMPurify sanitizes markdown/HTML before render
- Lazy-loaded via `ImagePreview` component

### Virtualization
- `@tanstack/react-virtual` powers large file lists (10k+ files)
- Prevents rendering off-screen items—critical for performance

### Mobile Gestures (hooks/)
- `usePinchZoom`: Image zoom in preview
- `useSwipeGesture`: Navigate back/forward
- `useEdgeSwipe`: Open bucket sidebar from edge
- `useSafeArea`: Respect notches (PWA on mobile)

### State Management
- Centralized in App.tsx: profiles, currentBucket, uploads, isDarkMode
- **Shared refs**: `s3Ref` passed down to Explorer/BucketList (singleton S3Service)
- **Upload tracking**: `Record<taskId, UploadTask>` in App state—updates via callback

## Critical Integration Points

### Provider-Specific Logic
- **AWS**: Region required, endpoint optional; TLS enabled by default
- **MinIO**: `forcePathStyle: true` + localhost HTTP support (no TLS)
- **R2 (Cloudflare)**: Endpoint format `https://<account_id>.r2.cloudflarestorage.com`
- See: `Login.tsx` (useEffect with provider switch) + `s3Service.init()`

### CORS Requirement
- Explorer fails silently if bucket lacks CORS config
- Error mapping in `getAwsErrorMessage()` catches 'Failed to fetch' → advises CORS fix
- All operations (GET, PUT, DELETE, HEAD) require CORS headers

### Encryption/Decryption Flow
- On profile save: `handleSaveProfile()` → `cryptoService.encrypt(profiles[])` → localStorage
- On app load: `loadProfiles()` → `cryptoService.decrypt()` → parse profiles[]
- Credentials always decrypted in memory (App.config.accessKeyId, etc.)

## Testing & Debugging Tips

### Local S3 Testing
```bash
# MinIO (docker-compose)
docker run -p 9000:9000 minio/minio
# Then use endpoint: http://localhost:9000
```

### Common Issues
1. **"Connection Failed (CORS)"**: Check S3 bucket CORS config (see Explorer error display)
2. **"Access Denied"**: Verify IAM has s3:ListBucket, s3:GetObject, s3:PutObject, s3:DeleteObject
3. **Localhost MinIO fails**: Ensure `endpoint.startsWith('http:')` for TLS=false logic

### File Size Limits
- Explorer virtualization handles large lists but upload is bottlenecked by browser memory
- Multipart uploads via `@aws-sdk/lib-storage` (auto-partitions large files)

## Key Files Reference
| File | Purpose | Dependencies |
|------|---------|--------------|
| `services/s3Service.ts` | AWS SDK wrapper | @aws-sdk/client-s3 |
| `services/cryptoService.ts` | Encryption layer | Web Crypto API |
| `components/Explorer.tsx` | Main UI logic (1918 lines) | Virtual list, file previews |
| `App.tsx` | State orchestration | All child components |
| `hooks/useIsMobile.ts` | Responsive detection | Standard pattern |
| `types.ts` | TypeScript interfaces | S3Config, FileObject, etc. |

## Common AI Coding Tasks

**Adding a new S3 operation**: Update `s3Service.ts` with AWS SDK command + error handling, expose via public method, wire into Explorer/BucketList UI.

**Fixing mobile UI**: Check `useIsMobile()` breakpoint, adjust Tailwind classes with `md:` prefix, test gesture hooks.

**Profile-related feature**: Modify S3Config interface, update encryption flow in `cryptoService`, adjust Login form, wire to App state.

**Performance issue**: Check for missing virtualization (Explorer uses @tanstack/react-virtual), profile with DevTools, consider splitting Explorer file list into separate component.
