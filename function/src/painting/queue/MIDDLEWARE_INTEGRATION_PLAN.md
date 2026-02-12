# Middleware Integration Plan for RandomArtGatheringWorker

## Current State (Line 123)

```typescript
// TODO -- Integrate the Middleware Pipeline HERE
ctx.putImageData(fullImageData, 0, 0)
const writeStream = createWriteStream(
   job.data.body?.stageToPath ?? "fake" + ".png",
)
const persister = new CanvasPersister(canvas, writeStream)
await persister.finish()
```

**Problems:**
- Hardcoded file path (`stageToPath` or `"fake.png"`)
- Direct filesystem write (not using FileStore abstraction)
- No campaign-based organization
- No content validation or filtering

## Proposed Integration

### 1. Base Model (Job Context)

```typescript
interface GatheringJobContext {
   // From job data
   taskId: string  // ULIDString
   buffer: Buffer  // Canvas data

   // From GenModelSeed
   seedPrefix: string
   seedSuffix: string

   // From PaintResolution
   pixelWidth: number
   pixelHeight: number

   // From result
   childCount: number
}
```

### 2. Middleware Extensions (V2 with DI)

#### Campaign Extension
```typescript
interface ICampaign {
   campaignId: string
   getCampaignKey(): string
   getCampaignHash(): string
}

class _Campaign implements ICampaign {
   constructor(private readonly base: GatheringJobContext) {}

   campaignId = ""

   getCampaignKey(): string {
      // Hash of seedPrefix + seedSuffix
      return crypto.createHash('sha256')
         .update(this.base.seedPrefix + this.base.seedSuffix)
         .digest('hex')
         .slice(0, 16)
   }

   getCampaignHash(): string {
      return `campaign:${this.getCampaignKey()}`
   }
}
```

#### Storage Path Extension (depends on Campaign)
```typescript
interface IStoragePath {
   storageKey: string
   getStorageKey(): string
}

class _StoragePath implements IStoragePath {
   constructor(
      private readonly base: GatheringJobContext,
      private readonly campaign: ICampaign
   ) {}

   storageKey = "renders"  // Default, can be overridden

   getStorageKey(): string {
      return `${this.campaign.getCampaignHash()}/${this.storageKey}`
   }
}
```

#### Naming Extension (depends on StoragePath)
```typescript
interface INaming {
   fileName: string
   getFullPath(): string
}

class _Naming implements INaming {
   constructor(
      private readonly base: GatheringJobContext,
      private readonly storagePath: IStoragePath
   ) {}

   fileName = ""

   getFullPath(): string {
      return `${this.storagePath.getStorageKey()}/${this.fileName}`
   }
}
```

#### Content Filter Extension
```typescript
interface IContentFilter {
   minSize: number
   maxSize: number
   shouldAccept(): boolean
}

class _ContentFilter implements IContentFilter {
   constructor(private readonly base: GatheringJobContext) {}

   minSize = 100  // bytes
   maxSize = 10 * 1024 * 1024  // 10MB

   shouldAccept(): boolean {
      const size = this.base.buffer.byteLength
      return size >= this.minSize && size <= this.maxSize
   }
}
```

### 3. Middleware Handlers

```typescript
class CampaignHandler implements MiddlewareHandler<any, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      // Campaign is computed from seed, no additional data needed
      return {
         disposition: JobDisposition.OK,
         model: {}
      }
   }
}

class StoragePathHandler implements MiddlewareHandler<any, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      // Could customize storageKey based on job type, dimensions, etc.
      const storageKey = ctx.pixelWidth >= 1024 ? "renders/hires" : "renders"

      return {
         disposition: JobDisposition.OK,
         model: { storageKey }
      }
   }
}

class NamingHandler implements MiddlewareHandler<any, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      // Generate filename from dimensions and campaign
      const fileName = `${ctx.pixelWidth}x${ctx.pixelHeight}_${ctx.getCampaignKey()}.png`

      return {
         disposition: JobDisposition.OK,
         model: { fileName }
      }
   }
}

class ContentFilterHandler implements MiddlewareHandler<any, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      if (!ctx.shouldAccept()) {
         return {
            disposition: JobDisposition.IGNORE,
            error: new Error(`Content size ${ctx.buffer.byteLength} out of range`)
         }
      }

      return {
         disposition: JobDisposition.OK,
         model: {}
      }
   }
}
```

### 4. Integration Point (Replace TODO)

```typescript
// Line 123 - Replace current implementation with:

// 1. Put image data on canvas
ctx.putImageData(fullImageData, 0, 0)

// 2. Get PNG buffer from canvas
const pngBuffer = canvas.toBuffer('image/png')

// 3. Build base context
const baseContext: GatheringJobContext = {
   taskId: actualJobData.body!.taskId,
   buffer: pngBuffer,
   seedPrefix: actualJobData.body!.paintableSeed.seedPrefix,
   seedSuffix: actualJobData.body!.paintableSeed.seedSuffix,
   pixelWidth: imageSize.width,
   pixelHeight: imageSize.height,
   childCount: keys.length
}

// 4. Execute middleware chain
const result = await new MiddlewareChainBuilderV2(baseContext, GatheringJobContext)
   .add(CampaignExt, new CampaignHandler())
   .add(StoragePathExt, new StoragePathHandler())
   .add(NamingExt, new NamingHandler())
   .add(ContentFilterExt, new ContentFilterHandler())
   .execute()

// 5. Check disposition
if (result.disposition === JobDisposition.IGNORE) {
   this.logger.warn(`Content filtered: ${result.error?.message}`)
   // Don't write file, but return success
   return job.data.prepareReply({
      pathStaged: null  // or indicate filtered
   })
}

if (result.disposition !== JobDisposition.OK) {
   throw result.error || new Error('Middleware failed')
}

// 6. Use FileStore to write (not direct filesystem)
const fullPath = result.getFullPath()  // e.g., "campaign:abc123/renders/640x640_abc123.png"

// Get FileStore from DI container
const fileStore = this.fileStoreService  // Injected via constructor

await fileStore.write(fullPath, pngBuffer)

this.logger.log(`Staged to: ${fullPath}`)

await job.updateProgress(progress)

return job.data.prepareReply({
   pathStaged: fullPath
})
```

## Key Benefits

1. **Separation of Concerns**
   - Middleware: Builds relative path (`campaign:abc123/renders/640x640_abc123.png`)
   - FileStore: Handles storage (S3, local filesystem, etc.)

2. **Explicit Dependencies**
   - Campaign → StoragePath → Naming
   - No non-deterministic initialization

3. **Type Safety**
   - TypeScript enforces dependency contracts
   - Methods are type-checked

4. **Content Validation**
   - Size filtering before write
   - Can add format validation, etc.

5. **Testability**
   - Mock FileStore for tests
   - Mock dependencies in extensions

## Migration Steps

1. **Create extension definitions** (Campaign, StoragePath, Naming, ContentFilter)
2. **Create middleware handlers**
3. **Inject FileStore** into RandomArtGatheringWorker constructor
4. **Replace TODO block** with middleware execution + FileStore write
5. **Update GatherPaintedPartsResult** to include relative path (not absolute)
6. **Test** with different campaigns, sizes, and storage backends

## Notes

- The `stageToPath` field in the request can be deprecated
- FileStore configuration (bucket, region, etc.) stays in infrastructure config
- Middleware never knows about S3 buckets or local paths
- Can add more middleware (compression, watermarking, etc.) without changing worker
