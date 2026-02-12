# Storage Module

General-purpose storage abstraction supporting local filesystem and S3.

## Features

- **Buffer-based API** for writing arbitrary data
- **Local filesystem** support with automatic directory creation
- **S3 support** via @aztec/stdlib FileStore
- **Custom injection tokens** for multiple independent instances
- **Single responsibility** - each module does one thing

## Usage

### Local-Only Storage

```typescript
import { LocalStorageModule } from "./storage/index.js"

const PAINT_RESULT_STORE = Symbol("PaintResultStore")

@Module({
  imports: [
    LocalStorageModule.forRoot({
      exportToken: PAINT_RESULT_STORE,
    }),
  ],
})
export class MyModule {
  constructor(
    @Inject(PAINT_RESULT_STORE)
    private readonly storage: IResultStore,
  ) {}

  async saveImageBuffer(data: Buffer) {
    // Write buffer to local filesystem
    await this.storage.write("./output/image.png", data, "image/png")
  }

  async saveImageStream(canvas: Canvas) {
    // Write stream directly - efficient for local files
    const stream = canvas.createPNGStream()
    await this.storage.writeStream("./output/image.png", stream, "image/png")
  }
}
```

### S3-Only Storage (AWS SDK v3 - Recommended)

```typescript
import { AwsS3StorageModule } from "./storage/index.js"

const ARTIFACT_STORE = Symbol("ArtifactStore")

@Module({
  imports: [
    AwsS3StorageModule.forRoot({
      exportToken: ARTIFACT_STORE,
      s3Bucket: "my-artifacts-bucket",
      s3Region: "us-east-1",
      s3Prefix: "artifacts/", // optional
      s3PartSize: 10 * 1024 * 1024, // optional, 10MB chunks for multipart
    }),
  ],
})
export class MyModule {
  constructor(
    @Inject(ARTIFACT_STORE)
    private readonly storage: IResultStore,
  ) {}

  async saveToS3(data: Buffer) {
    // Writes to S3 - no s3:// prefix needed
    await this.storage.write("results/image.png", data, "image/png")
  }

  async saveStreamToS3(canvas: Canvas) {
    // True streaming with automatic multipart upload for large files
    const stream = canvas.createPNGStream()
    await this.storage.writeStream("results/image.png", stream, "image/png")
  }
}
```

### S3-Only Storage (Legacy @aztec/stdlib)

```typescript
import { S3StorageModule } from "./storage/index.js"

const ARTIFACT_STORE = Symbol("ArtifactStore")

@Module({
  imports: [
    S3StorageModule.forRoot({
      exportToken: ARTIFACT_STORE,
      s3Bucket: "my-artifacts-bucket",
      s3Region: "us-east-1",
    }),
  ],
})
export class MyModule {
  constructor(
    @Inject(ARTIFACT_STORE)
    private readonly storage: IResultStore,
  ) {}

  async saveToS3(data: Buffer) {
    // Writes to S3 - no s3:// prefix needed
    await this.storage.write("results/image.png", data, "image/png")
  }

  async saveStreamToS3(canvas: Canvas) {
    // Note: Stream will be buffered in memory before upload (FileStore limitation)
    const stream = canvas.createPNGStream()
    await this.storage.writeStream("results/image.png", stream, "image/png")
  }
}
```

### Multiple Independent Instances

```typescript
const CACHE_STORE = Symbol("CacheStore")
const RESULT_STORE = Symbol("ResultStore")

@Module({
  imports: [
    // Local storage for cache
    LocalStorageModule.forRoot({
      exportToken: CACHE_STORE,
    }),
    // AWS S3 storage for results
    AwsS3StorageModule.forRoot({
      exportToken: RESULT_STORE,
      s3Bucket: "results-bucket",
      s3Region: "us-east-1",
    }),
  ],
})
export class MyModule {
  constructor(
    @Inject(CACHE_STORE) private readonly cache: IResultStore,
    @Inject(RESULT_STORE) private readonly results: IResultStore,
  ) {}
}
```

## Design Principles

- **Single Responsibility**: LocalStorageModule handles local files, AwsS3StorageModule/S3StorageModule handle S3 - no overlap
- **No Magic Prefixes**: Paths are interpreted in context of the module type
- **Custom Tokens**: Explicit injection tokens prevent conflicts when using multiple instances

## Implementation Comparison

### AwsS3StorageModule (Recommended)
- **Streaming**: True streaming uploads via @aws-sdk/lib-storage Upload
- **Multipart**: Automatic multipart uploads for large files
- **Chunk Size**: Configurable via s3PartSize option
- **Memory**: Efficient - no buffering required
- **Dependencies**: @aws-sdk/client-s3, @aws-sdk/lib-storage

### S3StorageModule (Legacy)
- **Streaming**: Buffers entire stream in memory
- **Multipart**: Not supported
- **Chunk Size**: N/A
- **Memory**: High for large files
- **Dependencies**: @aztec/stdlib

### LocalStorageModule
- **Streaming**: True streaming via Node.js pipeline
- **Memory**: Efficient
- **Dependencies**: Node.js built-ins only

## API

### IResultStore

```typescript
interface IResultStore {
  write(path: string, data: Buffer, contentType?: string): Promise<string>
  writeStream(path: string, stream: Readable, contentType?: string): Promise<string>
  exists(path: string): Promise<boolean>
}
```

**Note on `writeStream()`:**
- **LocalResultStore**: True streaming via Node.js pipeline (efficient)
- **AwsS3ResultStore**: True streaming via AWS SDK Upload with automatic multipart (efficient)
- **S3ResultStore** (legacy): Buffers entire stream in memory first (FileStore limitation)
