# Random Art Lambda Refactoring Plan

## Goal
Refocus the painting package as an extensible, composable core for generating collections of images based on binary seeds and coordinate systems, with configurable routing strategies.

## Key Simplifications

### 1. Input Model Standardization
- **Binary seeds**: Base64-encoded strings for prefix/suffix (16 bytes each)
- **Region coordinates**: CID reference only (caller provides dimensions)
- **Remove**: Complex seed extension system, multiple input type conversions

### 2. Routing Strategies (5 Variants)
All jobs fragment to worker pool, differ in gather/completion phase:

**Observable Callback Patterns:**
- **onNext per job**: Observable emits once per completed image
- **onComplete collection**: Observable emits array of all results after all jobs complete
- **Both**: Observable emits per job (onNext) AND final collection (onComplete)

**Result Payload Types:**
- **Reference**: File path (local or S3 URI string)
- **Data**: Canvas and/or PNG Buffer
- **Custom**: User-provided callback transforms result before emission

| Variant | Gather Location | Observable Pattern | Result Payload | Notes |
|---------|----------------|--------------------|----------------|-------|
| 1 | Worker pool | onNext per job | S3 URI reference | Each job uploads to S3, returns URI |
| 2 | Worker pool | onComplete collection | S3 URI references | All jobs upload, then emit array of URIs |
| 3 | Origin node | onNext per job | Local file reference | Origin gathers fragments, writes local, emits path |
| 4 | Origin node | Both (onNext + onComplete) | Custom payloads | Origin gathers, calls custom callback per job, emits results + final collection |
| 5 | Origin node | onComplete collection | Local file references | Origin gathers all, writes local batch, emits paths array |

### 3. Module Shelving
**Rename existing attic:** `attic/` → `atticV1/` (preserve generational separation)

**Move to new `attic/` directory:**
- Extension points system (`src/extensions/`)
- Message serialization (`src/messages/components/WireCodecAdapter.ts`, `SerializationProxyHandler.ts`, etc.)
- Seeding extensions (`src/painting/seeding/`)
- Type mapping extensions (`src/messages/interface/ITypeMapExtension.ts`, etc.)
- Coroutine system (referenced but unused)

**Keep in use:**
- Simple `Codec.ts` (current message encoder/decoder)
- Core queue infrastructure (BullMQ, workers, flow producer)
- Core artwork components (RandomArtTaskEngine, GenModelArtist, CanvasPersister)

---

## Implementation Steps

### Phase 1: Shelve Unused Modules

**1.1 Rename existing attic**
```bash
mv attic/ atticV1/
mkdir attic/
```

**1.2 Create new attic structure**
```
attic/
├── extensions/           (move src/extensions/)
├── messages/
│   ├── components/      (WireCodecAdapter, SerializationProxyHandler, etc.)
│   ├── interface/       (ITypeMapExtension, IWireCodecAdapter, etc.)
│   └── kinds/           (WireTxKind, WireTxHooks, etc.)
├── seeding/             (move src/painting/seeding/)
└── README.md            (Document what was shelved and why)
```

**1.3 Update references**
- Remove `InjectedGenModelSeedExtensionPoint` from `src/painting/artwork/di/Module.ts`
- Remove `InjectedGenModelSeedExtensionPoint` from `src/painting/artwork/di/Types.ts`
- Update imports in `AppService.ts` if it references shelved code

**Files to move:**
```
src/extensions/ → attic/extensions/
src/messages/components/WireCodecAdapter.ts → attic/messages/components/
src/messages/components/WireCodecAdapterFactory.ts → attic/messages/components/
src/messages/components/SerializationProxyHandler.ts → attic/messages/components/
src/messages/interface/ITypeMapExtension.ts → attic/messages/interface/
src/messages/interface/ITypeMapExtensionPoint.ts → attic/messages/interface/
src/messages/interface/IWireCodecAdapter.ts → attic/messages/interface/
src/messages/interface/IWireCodecAdapterFactory.ts → attic/messages/interface/
src/messages/kinds/WireTxKind.ts → attic/messages/kinds/
src/messages/kinds/WireTxHooks.ts → attic/messages/kinds/
src/painting/seeding/ → attic/seeding/
src/painting/messages/components/PaintTaskMessageExtension.ts → attic/messages/components/
```

### Phase 2: Simplify Message Models

**2.1 Update SeedModelStrategy**
- Standardize on base64-encoded strings for binary data
- Keep: `ByteBufferSeedModelStrategy`, `StringPairSeedModelStrategy`, `OnePhraseSeedModelStrategy`
- Add base64 encode/decode helpers in `Codec.ts`

**2.2 Extend job input models**
Add `regionDimensions` to avoid CID lookups during fragmentation:
```typescript
interface StagedPaintRequest {
  seedModel: SeedModelStrategy
  stageToPath: string
  pixelWidth: number
  pixelHeight: number
  regionMapRef: CID  // Now required, not embedded in seedModel
}
```

**Files to modify:**
- `src/painting/messages/SeedModelStrategy.ts`
- `src/painting/messages/StagedPaintRequest.ts`
- `src/painting/messages/PartialPaintRequest.ts`
- `src/painting/messages/components/Codec.ts`

### Phase 3: Add Storage Integration

**3.1 Integrate @aztec/stdlib FileStore**
Use existing `@aztec/stdlib/file-store` which provides:
- `FileStore` interface with `upload()`, `save()`, `read()`, `download()`, `exists()`
- `S3FileStore` implementation (already supports streaming)
- `LocalFileStore` implementation

**3.2 Create storage module wrapper**
```typescript
// src/painting/storage/di/Module.ts
// Provides FileStore configured for S3 or local based on config
@Module({})
export class StorageModule {
  static forRoot(config: StorageConfig): DynamicModule {
    const providers = config.type === 's3'
      ? [{ provide: FILE_STORE, useFactory: () =>
          new S3FileStore(config.bucket, config.prefix, config.opts) }]
      : [{ provide: FILE_STORE, useFactory: () =>
          new LocalFileStore(config.basePath) }]
    return { module: StorageModule, providers, exports: [FILE_STORE] }
  }
}
```

**3.3 Add streaming extension (if needed)**
Aztec's S3FileStore already supports `upload(destPath, srcPath)` which streams from local file.
For Buffer→S3 streaming, use existing `save(path, data: Buffer)` method.

**New files:**
- `src/painting/storage/di/Module.ts`
- `src/painting/storage/di/Types.ts`
- `src/painting/storage/di/Configuration.ts`

### Phase 4: Refactor Queue Module Configuration

**4.1 Define routing strategy configuration**
```typescript
// src/painting/queue/di/Configuration.ts
enum GatherStrategy {
  WORKER_POOL = 'worker_pool',    // Variants 1, 2
  ORIGIN_NODE = 'origin_node'     // Variants 3, 4, 5
}

enum ObservablePattern {
  ON_NEXT_PER_JOB = 'on_next',        // Variants 1, 3 - emit once per job
  ON_COMPLETE_COLLECTION = 'on_complete',  // Variants 2, 5 - emit array after all
  BOTH = 'both'                       // Variant 4 - emit per job AND final array
}

enum ResultPayload {
  S3_REFERENCE = 's3_ref',           // Variants 1, 2 - S3 URI string
  LOCAL_REFERENCE = 'local_ref',     // Variants 3, 5 - local file path
  CANVAS_DATA = 'canvas_data',       // Canvas + PNG Buffer
  CUSTOM_CALLBACK = 'custom'         // Variant 4 - user callback transforms result
}

interface RoutingConfig {
  gatherStrategy: GatherStrategy
  observablePattern: ObservablePattern
  resultPayload: ResultPayload

  // Optional configs
  storageConfig?: {
    type: 's3' | 'local'
    bucket?: string        // S3 only
    prefix?: string        // S3 only
    basePath?: string      // Local only
  }
  customCallback?: (canvas: Canvas, result: StagedPaintResult) => any
}
```

**4.2 Split queue configuration**
Separate shared worker config from origin node config:

**Shared (static queue names for worker pools):**
- `toPaintParts` queue (scatter)
- `toStageCompleted` queue (gather - worker pool variants only)
- `toCompleteJobs` queue (final completion - variant 2 only)

**Origin node (dynamic, per-request):**
- Reply queue: `reply-queue-${uniqueId}`
- Observables registered in `ReturnQueueRoutingProcessor`

**4.3 Create result handlers**
```typescript
// src/painting/queue/interface/IResultHandler.ts
interface IResultHandler<T = any> {
  handleResult(canvas: Canvas, result: StagedPaintResult): Promise<T>
}

// src/painting/queue/components/S3ReferenceHandler.ts
class S3ReferenceHandler implements IResultHandler<string> {
  constructor(private fileStore: FileStore) {}
  async handleResult(canvas: Canvas, result: StagedPaintResult): Promise<string> {
    // Write canvas to temp file, upload to S3 via fileStore, return S3 URI
  }
}

// src/painting/queue/components/LocalReferenceHandler.ts
class LocalReferenceHandler implements IResultHandler<string> {
  constructor(private fileStore: FileStore) {}
  async handleResult(canvas: Canvas, result: StagedPaintResult): Promise<string> {
    // Write canvas to local path via fileStore, return file path
  }
}

// src/painting/queue/components/CanvasDataHandler.ts
class CanvasDataHandler implements IResultHandler<{ canvas: Canvas, buffer: Buffer }> {
  async handleResult(canvas: Canvas, result: StagedPaintResult) {
    // Convert canvas to PNG buffer, return both
  }
}

// src/painting/queue/components/CustomCallbackHandler.ts
class CustomCallbackHandler<T> implements IResultHandler<T> {
  constructor(private callback: (canvas: Canvas, result: StagedPaintResult) => T) {}
  async handleResult(canvas: Canvas, result: StagedPaintResult): Promise<T> {
    return this.callback(canvas, result)
  }
}
```

**Files to modify:**
- `src/painting/queue/di/Configuration.ts` - Add routing config types
- `src/painting/queue/di/Module.ts` - Provide result handler based on config
- `src/painting/queue/components/RandomArtGatheringWorker.ts` - Inject result handler
- `src/painting/queue/components/RandomArtFlowProducer.ts` - Configure Observable pattern

**New files:**
- `src/painting/queue/interface/IResultHandler.ts`
- `src/painting/queue/components/S3ReferenceHandler.ts`
- `src/painting/queue/components/LocalReferenceHandler.ts`
- `src/painting/queue/components/CanvasDataHandler.ts`
- `src/painting/queue/components/CustomCallbackHandler.ts`

### Phase 5: Update DI Configuration Examples

**5.1 Variant 1: Worker pool + S3 + onNext per job**
```yaml
# src/app/shared/di/queueConfigVariant1.yaml
roles: ['paintWorker', 'stageWorker']
routing:
  gatherStrategy: worker_pool
  observablePattern: on_next
  resultPayload: s3_ref
  storageConfig:
    type: s3
    bucket: my-random-art-bucket
    prefix: images/
```

**5.2 Variant 2: Worker pool + S3 + onComplete collection**
```yaml
# src/app/shared/di/queueConfigVariant2.yaml
roles: ['paintWorker', 'stageWorker', 'jobDoneWorker']
routing:
  gatherStrategy: worker_pool
  observablePattern: on_complete
  resultPayload: s3_ref
  storageConfig:
    type: s3
    bucket: my-random-art-bucket
    prefix: images/
```

**5.3 Variant 3: Origin node + Local + onNext per job**
```yaml
# src/app/shared/di/queueConfigVariant3.yaml
roles: ['mainApp']
routing:
  gatherStrategy: origin_node
  observablePattern: on_next
  resultPayload: local_ref
  storageConfig:
    type: local
    basePath: ./output/
```

**5.4 Variant 4: Origin node + Custom callback + Both patterns**
```typescript
// In app code
const config = {
  roles: ['mainApp'],
  routing: {
    gatherStrategy: GatherStrategy.ORIGIN_NODE,
    observablePattern: ObservablePattern.BOTH,
    resultPayload: ResultPayload.CUSTOM_CALLBACK,
    customCallback: (canvas, result) => ({
      metadata: { width: canvas.width, height: canvas.height },
      thumbnail: generateThumbnail(canvas),
      path: saveToDisk(canvas, result.stageToPath)
    })
  }
}
```

**5.5 Variant 5: Origin node + Local + onComplete collection**
```yaml
# src/app/shared/di/queueConfigVariant5.yaml
roles: ['mainApp']
routing:
  gatherStrategy: origin_node
  observablePattern: on_complete
  resultPayload: local_ref
  storageConfig:
    type: local
    basePath: ./batch_output/
```

### Phase 6: Update Main Application Integration

**6.1 Simplify AppService**
Remove unused seed extension point logic, use simplified input models.

**6.2 Update CLI/Lambda entry points**
Configure appropriate routing variant based on deployment context.

**Files to modify:**
- `src/app/ticketing/components/TicketArtService.ts`
- `src/app/di/AppModule.ts`
- `src/cli/app/Module.ts`

---

## Testing Strategy

1. **Unit tests**: Test each completion handler independently
2. **Integration tests**:
   - Variant 1: Submit job, verify S3 upload
   - Variant 3: Submit job, verify Observable emits result
   - Variant 5: Submit job, verify local file written
3. **End-to-end**: Full flow from job submission to result delivery

---

## Migration Path

1. Run Phase 1 (shelving) - Non-breaking, just moves unused code
2. Run Phase 2-3 (simplify models, add S3) - Extend existing models
3. Run Phase 4 (refactor queue config) - Backwards compatible with feature flags
4. Run Phase 5-6 (update configs, apps) - Switch to new configuration
5. Remove old code paths once validated

---

## Success Criteria

- [ ] All unused extension/messaging code moved to `attic/`
- [ ] Input models simplified to base64 seeds + CID
- [ ] 5 routing variants supported via configuration
- [ ] S3 integration working for variants 1-2
- [ ] Observable delivery working for variants 3-4
- [ ] Local FS delivery working for variant 5
- [ ] Existing functionality preserved
- [ ] Build passes with no errors
