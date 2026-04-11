# Storage Module

General-purpose storage abstraction supporting local filesystem and S3.

## Interfaces

### IFileStore

```typescript
interface IFileStore {
  write(path: string, data: Buffer, metadata?: FileMetadata): Promise<string>
  read(path: string): Promise<Buffer>
  delete(path: string): Promise<void>
  exists(path: string): Promise<boolean>
  getBaseUri(): string
}

interface FileMetadata {
  contentType?: string
  tags?: Record<string, string>
  cacheControl?: string
  contentEncoding?: string
}
```

`write()` returns the full URI to the stored file (`file://...` for local, `s3://...` for S3).

## Modules

### LocalStorageModule

Writes to the local filesystem. Automatic directory creation. No external dependencies.

```typescript
import { LocalStorageModule } from "./storage/index.js"
import { IFileStore } from "./storage/interface/IFileStore.js"

const IMAGE_STORE = Symbol("ImageStore")

@Module({
  imports: [
    LocalStorageModule.forRoot({
      exportToken: IMAGE_STORE,
      baseDirectory: "/tmp/output", // optional, defaults to process.cwd()
    }),
  ],
})
export class MyModule {
  constructor(
    @Inject(IMAGE_STORE)
    private readonly store: IFileStore,
  ) {}

  async save(data: Buffer) {
    const uri = await this.store.write("images/result.png", data, {
      contentType: "image/png",
    })
    // uri === "file:///tmp/output/images/result.png"
  }
}
```

### AwsS3StorageModule

Writes to S3 using AWS SDK v3 directly (`@aws-sdk/client-s3`). No third-party
file-store abstraction layer.

```typescript
import { AwsS3StorageModule } from "./storage/index.js"
import { IFileStore } from "./storage/interface/IFileStore.js"

const IMAGE_STORE = Symbol("ImageStore")

@Module({
  imports: [
    AwsS3StorageModule.forRoot({
      exportToken: IMAGE_STORE,
      s3Bucket: "my-images-bucket",
      s3Region: "us-east-1",   // optional, defaults to AWS_REGION env var
      s3Prefix: "trigram/",    // optional
    }),
  ],
})
export class MyModule {
  constructor(
    @Inject(IMAGE_STORE)
    private readonly store: IFileStore,
  ) {}

  async save(data: Buffer) {
    const uri = await this.store.write("images/result.png", data, {
      contentType: "image/png",
    })
    // uri === "s3://my-images-bucket/trigram/images/result.png"
  }
}
```

### Multiple independent instances

```typescript
const CACHE_STORE = Symbol("CacheStore")
const RESULT_STORE = Symbol("ResultStore")

@Module({
  imports: [
    LocalStorageModule.forRoot({ exportToken: CACHE_STORE }),
    AwsS3StorageModule.forRoot({
      exportToken: RESULT_STORE,
      s3Bucket: "results-bucket",
    }),
  ],
})
export class MyModule {
  constructor(
    @Inject(CACHE_STORE) private readonly cache: IFileStore,
    @Inject(RESULT_STORE) private readonly results: IFileStore,
  ) {}
}
```

## Pipeline integration

`FileStorePipelineModule` bridges any storage module into the pipeline by
re-exporting its store under the `WORKER_FILE_STORE` token:

```typescript
import { FileStorePipelineModule } from "./storage/pipeline/di/index.js"
import { WORKER_FILE_STORE } from "./storage/tokens.js"

const storageModule = AwsS3StorageModule.forRoot({
  exportToken: WORKER_FILE_STORE,
  s3Bucket: "my-bucket",
})

const pipelineModule = TrigramPipelineModule.assemble(configSvc, storageModule)
```

## Error handling

Both implementations throw typed `StorageError` subclasses rather than raw SDK
errors. Each subclass implements `isRetryable()` for upstream retry logic.

- **Local**: `FilesystemInvalidPathError`, `FilesystemPermissionError`,
  `FilesystemNoSpaceError`, `FilesystemResourceBusyError` (retryable)
- **S3**: `S3InvalidInputError`, `S3BucketNotFoundError`, `S3PermissionError`,
  `S3NetworkError` (retryable)
