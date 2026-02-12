import { Extend } from "zod/v4/core/util.js"

// =============================================================================
// Core Types for Middleware Stack
// =============================================================================

/**
 * A middleware component that:
 * - Requires certain state to already exist (Requires)
 * - Provides additional state (Provides)
 * - Exposes methods that operate on the combined context
 */
export interface MiddlewareClass<
   Requires extends object,
   Provides extends object,
   Methods extends object,
> {
   /** What this middleware needs from previous middleware */
   readonly _requires: Requires
   /** What this middleware contributes to context */
   readonly _provides: Provides

   /** Bind the middleware to a context, returning the method interface */
   bind: (context: Extend<Provides, Requires>) => Methods

   prototype: Methods
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Extract the Requires type from a middleware class */
type RequiresOf<T> = T extends MiddlewareClass<infer R, any, any> ? R : never

/** Extract the Provides type from a middleware class */
type ProvidesOf<T> = T extends MiddlewareClass<any, infer P, any> ? P : never

/** Extract the Methods type from a middleware class */
type MethodsOf<T> = T extends MiddlewareClass<any, any, infer M> ? M : never
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Loose constraint for any middleware class.
 * Avoids contra-variance issues by not constraining the bind parameter type.
 */
interface AnyMiddlewareClass {
   readonly _requires: unknown
   readonly _provides: unknown
   /* eslint-disable @typescript-eslint/no-explicit-any */
   bind: (context: any) => any
   /* eslint-enable @typescript-eslint/no-explicit-any */
   prototype: unknown
}

// =============================================================================
// Example State Types
// =============================================================================

export interface UserState {
   userId: string
   userName: string
}

export interface SessionState {
   sessionId: string
   expiresAt: Date
}

export interface PermissionsState {
   roles: string[]
   canEdit: boolean
}

// =============================================================================
// Example Middleware Components
// =============================================================================

/**
 * UserMiddleware - requires nothing, provides UserState
 */
export class UserMiddleware {
   static readonly _requires: {} = {}
   static readonly _provides: UserState

   static bind(context: UserState): UserMiddleware {
      return new UserMiddleware(context)
   }

   private constructor(private readonly context: UserState) {}

   getDisplayName(): string {
      return `User: ${this.context.userName} (${this.context.userId})`
   }
}

/**
 * SessionMiddleware - requires nothing, provides SessionState
 */
export class SessionMiddleware {
   static readonly _requires: {} = {}
   static readonly _provides: SessionState

   static bind(context: SessionState): SessionMiddleware {
      return new SessionMiddleware(context)
   }

   private constructor(private readonly context: SessionState) {}

   isExpired(): boolean {
      return this.context.expiresAt < new Date()
   }

   getSessionInfo(): string {
      return `Session: ${this.context.sessionId}`
   }
}

/**
 * PermissionsMiddleware - requires UserState, provides PermissionsState
 * This middleware depends on user info being available first!
 */
export class PermissionsMiddleware {
   static readonly _requires: UserState
   static readonly _provides: PermissionsState

   static bind(
      context: Extend<PermissionsState, UserState>,
   ): PermissionsMiddleware {
      return new PermissionsMiddleware(context)
   }

   private constructor(
      private readonly context: Extend<PermissionsState, UserState>,
   ) {}

   canUserEdit(): boolean {
      return this.context.canEdit
   }

   hasRole(role: string): boolean {
      return this.context.roles.includes(role)
   }

   describePermissions(): string {
      return `${this.context.userName} has roles: ${this.context.roles.join(", ")}`
   }
}

// =============================================================================
// Middleware Stack Builder
// =============================================================================

/**
 * Represents a composed middleware stack.
 * AccumulatedState = total state required to use this stack
 * CombinedMethods = all methods from all middleware in the stack
 */
interface MiddlewareStack<
   AccumulatedState extends object,
   CombinedMethods extends object,
> {
   /** Create a bound instance with all middleware methods */
   bind: (state: AccumulatedState) => CombinedMethods

   /** Add another middleware to the stack */
   use: <MW extends AnyMiddlewareClass>(
      middleware: MW,
   ) => AccumulatedState extends RequiresOf<MW>
      ? MiddlewareStack<
           Extend<ProvidesOf<MW>, AccumulatedState>,
           Extend<MethodsOf<MW>, CombinedMethods>
        >
      : never // Compile error if requirements not met
}

/**
 * Create an empty middleware stack
 */
function createStack(): MiddlewareStack<{}, {}> {
   return createStackImpl([])
}

function createStackImpl<State extends object, Methods extends object>(
   middlewares: AnyMiddlewareClass[],
): MiddlewareStack<State, Methods> {
   const impl = {
      bind: (state: State): Methods => {
         const result: Methods = Object.assign(
            {},
            ...middlewares.map((mw) => mw.bind(state)),
         ) as Methods
         return result
      },

      use: (middleware: AnyMiddlewareClass) => {
         return createStackImpl([...middlewares, middleware])
      },
   }
   return impl as unknown as MiddlewareStack<State, Methods>
}

// =============================================================================
// Alternative: Pipeline with Runtime State Accumulation
// =============================================================================

/**
 * A middleware that can PRODUCE state at runtime, not just consume it.
 * - Requires: state that must exist before this middleware runs
 * - Produces: state this middleware will add to the context
 * - Methods: the API exposed after binding
 */
export interface ProducerMiddleware<
   Requires extends object,
   Produces extends object,
   Methods extends object,
> {
   readonly _requires: Requires
   readonly _produces: Produces

   /**
    * Called during pipeline execution.
    * Receives accumulated state so far, returns the state this middleware produces.
    */
   produce: (accumulated: Requires) => Produces | Promise<Produces>

   /**
    * Bind to the full context (Requires + Produces) to get methods.
    */
   bind: (context: Extend<Produces, Requires>) => Methods

   prototype: Methods
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Loose constraint for producer middleware.
 * Uses explicit any for bind to avoid Extend<any,any> index signature issues.
 */
interface AnyProducerMiddleware {
   readonly _requires: unknown
   readonly _produces: unknown
   produce: (accumulated: any) => any
   bind: (context: any) => any
   prototype: unknown
}

/** Extract Requires from _requires type marker */
type ProducerRequiresOf<T> = T extends {
   readonly _requires: infer R extends object
}
   ? R
   : never
/** Extract Produces from _produces type marker */
type ProducerProducesOf<T> = T extends {
   readonly _produces: infer P extends object
}
   ? P
   : never
/** Extract Methods from prototype */
type ProducerMethodsOf<T> = T extends { prototype: infer M extends object }
   ? M
   : never
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * A pipeline that accumulates state as it runs through middleware.
 * Tracks both the initial state (what you provide) and accumulated state (after derivations).
 */
interface Pipeline<
   InitialState extends object,
   AccumulatedState extends object,
   CombinedMethods extends object,
> {
   /**
    * Add a middleware to the pipeline.
    * The middleware's requirements must be satisfied by accumulated state.
    */
   use: <MW extends AnyProducerMiddleware>(
      middleware: MW,
   ) => AccumulatedState extends ProducerRequiresOf<MW>
      ? Pipeline<
           InitialState, // Initial state stays the same
           Extend<ProducerProducesOf<MW>, AccumulatedState>, // Accumulated grows
           Extend<ProducerMethodsOf<MW>, CombinedMethods>
        >
      : never

   /**
    * Execute the pipeline with initial state.
    * Each middleware's produce() is called in order, accumulating state.
    * Returns the bound methods with full accumulated context.
    */
   run: (initialState: InitialState) => Promise<CombinedMethods>
}

function _createPipeline(): Pipeline<{}, {}, {}> {
   return _createPipelineImpl([])
}

/**
 * Create a pipeline with a known initial/seed state type.
 * Use this when the first middleware requires specific input state.
 */
function createPipelineWithSeed<SeedState extends object>(): Pipeline<
   SeedState,
   SeedState,
   {}
> {
   return _createPipelineImpl([])
}

function _createPipelineImpl<
   Initial extends object,
   State extends object,
   Methods extends object,
>(middlewares: AnyProducerMiddleware[]): Pipeline<Initial, State, Methods> {
   const impl = {
      use: (middleware: AnyProducerMiddleware) => {
         return _createPipelineImpl([...middlewares, middleware])
      },

      run: async (initialState: Initial): Promise<Methods> => {
         // Accumulate state by running each middleware's produce()
         let accumulated: object = { ...initialState }

         for (const mw of middlewares) {
            const produced = await mw.produce(accumulated)
            accumulated = { ...accumulated, ...produced }
         }

         // Now bind all middleware to the fully accumulated state
         const methods: Methods = Object.assign(
            {},
            ...middlewares.map((mw) => mw.bind(accumulated)),
         ) as Methods

         return methods
      },
   }
   return impl as unknown as Pipeline<Initial, State, Methods>
}

// =============================================================================
// Example: Producer Middleware that fetches/derives state
// =============================================================================

/**
 * UserProducer - given a userId, fetches the full user from a database
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function _createUserProducer(userDb: {
   getUser: (id: string) => Promise<UserState>
}) {
   return class UserProducer {
      static readonly _requires: { userId: string }
      static readonly _produces: UserState

      static async produce(state: { userId: string }): Promise<UserState> {
         // Actually fetch/derive the user state
         return await userDb.getUser(state.userId)
      }

      static bind(context: UserState): UserProducer {
         return new UserProducer(context)
      }

      private constructor(private readonly context: UserState) {}

      getDisplayName(): string {
         return `User: ${this.context.userName}`
      }
   }
}

/**
 * PermissionsProducer - given a user, fetches their permissions
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function _createPermissionsProducer(permDb: {
   getPermissions: (userId: string) => Promise<PermissionsState>
}) {
   return class PermissionsProducer {
      static readonly _requires: UserState
      static readonly _produces: PermissionsState

      static async produce(state: UserState): Promise<PermissionsState> {
         return await permDb.getPermissions(state.userId)
      }

      static bind(
         context: Extend<PermissionsState, UserState>,
      ): PermissionsProducer {
         return new PermissionsProducer(context)
      }

      private constructor(
         private readonly context: Extend<PermissionsState, UserState>,
      ) {}

      canEdit(): boolean {
         return this.context.canEdit
      }
   }
}

// =============================================================================
// Example: State Derivation / Formatting Pipeline
// =============================================================================

/** Input state - the "problem-specific" parts */
export interface RenderInputState {
   projectName: string
   seed: number
   timestamp: Date
   format: "png" | "svg" | "pdf"
}

/** Derived: formatted filename */
export interface FilenameState {
   filename: string
   baseName: string
}

/** Derived: full output path */
export interface OutputPathState {
   outputPath: string
   pathPrefix: string
}

/** Derived: render dimensions based on format */
export interface DimensionsState {
   width: number
   height: number
   dpi: number
}

/**
 * Derives filename from input state
 */
class FilenameDeriver {
   static readonly _requires: RenderInputState
   static readonly _produces: FilenameState

   static produce(state: RenderInputState): FilenameState {
      const dateStr = state.timestamp.toISOString().slice(0, 10)
      const baseName = `${state.projectName}_${state.seed}_${dateStr}`
      return {
         baseName,
         filename: `${baseName}.${state.format}`,
      }
   }

   static bind(
      context: Extend<FilenameState, RenderInputState>,
   ): FilenameDeriver {
      return new FilenameDeriver(context)
   }

   private constructor(
      private readonly context: Extend<FilenameState, RenderInputState>,
   ) {}

   getFilename(): string {
      return this.context.filename
   }
}

/**
 * Derives output path - requires filename to already be derived
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createOutputPathDeriver(baseDir: string) {
   type RequiredState = Extend<FilenameState, RenderInputState>

   return class OutputPathDeriver {
      static readonly _requires: RequiredState
      static readonly _produces: OutputPathState

      static produce(state: RequiredState): OutputPathState {
         const pathPrefix = `${baseDir}/${state.projectName}`
         return {
            pathPrefix,
            outputPath: `${pathPrefix}/${state.filename}`,
         }
      }

      static bind(
         context: Extend<OutputPathState, RequiredState>,
      ): OutputPathDeriver {
         return new OutputPathDeriver(context)
      }

      private constructor(
         private readonly context: Extend<OutputPathState, RequiredState>,
      ) {}

      getOutputPath(): string {
         return this.context.outputPath
      }

      getOutputDir(): string {
         return this.context.pathPrefix
      }
   }
}

/**
 * Derives render dimensions based on format
 */
class DimensionsDeriver {
   static readonly _requires: RenderInputState
   static readonly _produces: DimensionsState

   static produce(state: RenderInputState): DimensionsState {
      // Different defaults based on format
      switch (state.format) {
         case "png":
            return { width: 1920, height: 1080, dpi: 72 }
         case "svg":
            return { width: 800, height: 600, dpi: 96 }
         case "pdf":
            return { width: 2480, height: 3508, dpi: 300 } // A4 at 300dpi
      }
   }

   static bind(
      context: Extend<DimensionsState, RenderInputState>,
   ): DimensionsDeriver {
      return new DimensionsDeriver(context)
   }

   private constructor(
      private readonly context: Extend<DimensionsState, RenderInputState>,
   ) {}

   getDimensions(): { width: number; height: number } {
      return { width: this.context.width, height: this.context.height }
   }

   getPixelCount(): number {
      return this.context.width * this.context.height
   }
}

// =============================================================================
// Combining Derived State + Injected Dependencies
// =============================================================================

/**
 * Interface for file storage operations (injected dependency)
 */
export interface RenderFileStore {
   writeFile: (path: string, data: Buffer) => Promise<void>
   readFile: (path: string) => Promise<Buffer>
   ensureDir: (dir: string) => Promise<void>
}

/**
 * State that RenderWriter produces (just a marker that writing is available)
 */
export interface RenderWriterState {
   writerReady: true
}

/**
 * RenderWriter middleware factory:
 * - Injects: FileStore dependency
 * - Requires: derived outputPath and pathPrefix (from OutputPathDeriver)
 * - Provides: high-level "saveRender" method that combines them
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createRenderWriter(fileStore: RenderFileStore) {
   // The state this middleware requires = everything OutputPathDeriver provides
   type RequiredState = Extend<
      OutputPathState,
      Extend<FilenameState, RenderInputState>
   >

   return class RenderWriter {
      static readonly _requires: RequiredState
      static readonly _produces: RenderWriterState

      // produce() - just marks that writer is ready (no async setup needed)
      static produce(_state: RequiredState): RenderWriterState {
         return { writerReady: true }
      }

      static bind(
         context: Extend<RenderWriterState, RequiredState>,
      ): RenderWriter {
         return new RenderWriter(context, fileStore)
      }

      private constructor(
         private readonly context: Extend<RenderWriterState, RequiredState>,
         private readonly fileStore: RenderFileStore,
      ) {}

      /**
       * Save rendered output to the derived path.
       * Uses:
       * - this.context.pathPrefix (derived by OutputPathDeriver)
       * - this.context.outputPath (derived by OutputPathDeriver)
       * - this.fileStore (injected dependency)
       */
      async saveRender(buffer: Buffer): Promise<string> {
         // Ensure output directory exists
         await this.fileStore.ensureDir(this.context.pathPrefix)
         // Write to the derived path
         await this.fileStore.writeFile(this.context.outputPath, buffer)
         return this.context.outputPath
      }

      /**
       * Load a previously rendered file from the derived path
       */
      async loadRender(): Promise<Buffer> {
         return await this.fileStore.readFile(this.context.outputPath)
      }

      /**
       * Get info about where the render will be saved
       */
      getRenderInfo(): {
         filename: string
         outputPath: string
         pathPrefix: string
      } {
         return {
            filename: this.context.filename,
            outputPath: this.context.outputPath,
            pathPrefix: this.context.pathPrefix,
         }
      }
   }
}

// =============================================================================
// Full Execution Pipeline: Everything happens in run()
// =============================================================================

/**
 * Interface for a renderer (injected dependency)
 */
export interface Renderer {
   render: (
      seed: number,
      width: number,
      height: number,
      format: string,
   ) => Promise<Buffer>
}

/**
 * State produced by the renderer - the actual image buffer
 */
export interface RenderedImageState {
   imageBuffer: Buffer
   renderTimeMs: number
}

/**
 * RenderExecutor - actually renders the image during produce()
 * - Requires: dimensions, seed, format (all derived earlier)
 * - Produces: imageBuffer (the actual rendered image)
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createRenderExecutor(renderer: Renderer) {
   type RequiredState = Extend<DimensionsState, RenderInputState>

   return class RenderExecutor {
      static readonly _requires: RequiredState
      static readonly _produces: RenderedImageState

      // This is where the actual rendering happens!
      static async produce(state: RequiredState): Promise<RenderedImageState> {
         const startTime = Date.now()
         const imageBuffer = await renderer.render(
            state.seed,
            state.width,
            state.height,
            state.format,
         )
         return {
            imageBuffer,
            renderTimeMs: Date.now() - startTime,
         }
      }

      static bind(
         context: Extend<RenderedImageState, RequiredState>,
      ): RenderExecutor {
         return new RenderExecutor(context)
      }

      private constructor(
         private readonly context: Extend<RenderedImageState, RequiredState>,
      ) {}

      getImageBuffer(): Buffer {
         return this.context.imageBuffer
      }

      getRenderTime(): number {
         return this.context.renderTimeMs
      }
   }
}

/**
 * State produced after saving - confirmation of what was saved
 */
export interface SavedRenderState {
   savedPath: string
   savedAt: Date
   bytesWritten: number
}

/**
 * RenderSaver - saves the rendered image during produce()
 * - Requires: imageBuffer (from RenderExecutor), outputPath (from OutputPathDeriver)
 * - Produces: savedPath confirmation
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createRenderSaver(fileStore: RenderFileStore) {
   type RequiredState = Extend<
      RenderedImageState,
      Extend<OutputPathState, Extend<FilenameState, RenderInputState>>
   >

   return class RenderSaver {
      static readonly _requires: RequiredState
      static readonly _produces: SavedRenderState

      // This is where the actual saving happens!
      static async produce(state: RequiredState): Promise<SavedRenderState> {
         await fileStore.ensureDir(state.pathPrefix)
         await fileStore.writeFile(state.outputPath, state.imageBuffer)
         return {
            savedPath: state.outputPath,
            savedAt: new Date(),
            bytesWritten: state.imageBuffer.length,
         }
      }

      static bind(
         context: Extend<SavedRenderState, RequiredState>,
      ): RenderSaver {
         return new RenderSaver(context)
      }

      private constructor(
         private readonly context: Extend<SavedRenderState, RequiredState>,
      ) {}

      getSavedPath(): string {
         return this.context.savedPath
      }

      getSaveInfo(): { path: string; bytes: number; timestamp: Date } {
         return {
            path: this.context.savedPath,
            bytes: this.context.bytesWritten,
            timestamp: this.context.savedAt,
         }
      }
   }
}

// =============================================================================
// Complete Execution Pipeline
// =============================================================================

// 1. Create injected dependencies
const _mockRenderer: Renderer = {
   render: async (seed, width, height, format) => {
      console.log(`Rendering ${width}x${height} ${format} with seed ${seed}`)
      // Simulate rendering work
      return Buffer.from(`Mock ${format} image data for seed ${seed}`)
   },
}

const _mockFileStore: RenderFileStore = {
   writeFile: async (path, data) =>
      console.log(`Writing ${data.length} bytes to ${path}`),
   readFile: async (path) => {
      console.log(`Reading from ${path}`)
      return Buffer.from("mock render data")
   },
   ensureDir: async (dir) => console.log(`Ensuring dir exists: ${dir}`),
}

// 2. Create configured middleware
const OutputPathDeriver = createOutputPathDeriver("/var/renders")
const RenderExecutor = createRenderExecutor(_mockRenderer)
const RenderSaver = createRenderSaver(_mockFileStore)

// 3. Build the EXECUTION pipeline - everything happens in run()
const _executionPipeline = createPipelineWithSeed<RenderInputState>()
   .use(FilenameDeriver) // 1. derive filename
   .use(DimensionsDeriver) // 2. derive dimensions
   .use(OutputPathDeriver) // 3. derive output path
   .use(RenderExecutor) // 4. EXECUTE: render the image
   .use(RenderSaver) // 5. EXECUTE: save to disk

// 4. Usage - run() does EVERYTHING, returns methods to inspect results
async function _executionExample(): Promise<void> {
   // Single call - derives all state AND executes render + save
   const ctx = await _executionPipeline.run({
      projectName: "landscape",
      seed: 42,
      timestamp: new Date(),
      format: "png",
   })

   // By the time run() returns, the image is already rendered and saved!
   // ctx methods let you inspect what happened:
   console.log(`Rendered in ${ctx.getRenderTime()}ms`)
   console.log(`Saved to: ${ctx.getSavedPath()}`)
   console.log(ctx.getSaveInfo())
   // { path: "/var/renders/landscape/...", bytes: 1234, timestamp: ... }
}

// =============================================================================
// Dependency Injection via Middleware Factories
// =============================================================================

/** Example external dependency interfaces */
export interface FileStore {
   save: (userId: string, data: Buffer) => Promise<string>
   load: (fileId: string) => Promise<Buffer>
}

export interface Canvas {
   drawRect: (x: number, y: number, w: number, h: number) => void
   render: () => Buffer
}

/** State that the file middleware will provide */
export interface FileState {
   currentFileId: string | null
}

/**
 * Middleware factory - accepts dependencies, returns a configured middleware class.
 * The returned class closes over the injected dependencies.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createFileMiddleware(fileStore: FileStore) {
   // Return a class that has the fileStore in its closure
   return class FileMiddleware {
      static readonly _requires: UserState
      static readonly _provides: FileState

      static bind(context: Extend<FileState, UserState>): FileMiddleware {
         return new FileMiddleware(context, fileStore)
      }

      private constructor(
         private readonly context: Extend<FileState, UserState>,
         private readonly _fileStore: FileStore,
      ) {}

      async saveCurrentWork(data: Buffer): Promise<string> {
         // Can access both context (from state) and fileStore (from DI)
         const fileId = await this._fileStore.save(this.context.userId, data)
         return fileId
      }

      async loadFile(fileId: string): Promise<Buffer> {
         return await this._fileStore.load(fileId)
      }
   }
}

/** State that canvas middleware provides */
export interface CanvasState {
   width: number
   height: number
}

/**
 * Another middleware factory with a different dependency
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createCanvasMiddleware(canvas: Canvas) {
   return class CanvasMiddleware {
      static readonly _requires: {} = {}
      static readonly _provides: CanvasState

      static bind(context: CanvasState): CanvasMiddleware {
         return new CanvasMiddleware(context, canvas)
      }

      private constructor(
         private readonly context: CanvasState,
         private readonly _canvas: Canvas,
      ) {}

      drawBackground(): void {
         this._canvas.drawRect(0, 0, this.context.width, this.context.height)
      }

      exportImage(): Buffer {
         return this._canvas.render()
      }
   }
}

// =============================================================================
// Usage Examples
// =============================================================================

// 1. Create/obtain your external dependencies
const myFileStore: FileStore = {
   save: async (userId, _data) => `file-${userId}-${Date.now()}`,
   load: async (_fileId) => Buffer.from("mock data"),
}

const myCanvas: Canvas = {
   drawRect: (x, y, _w, _h) => console.log(`Drawing rect at ${x},${y}`),
   render: () => Buffer.from("PNG data"),
}

// 2. Create configured middleware classes by injecting dependencies
const FileMiddleware = createFileMiddleware(myFileStore)
const CanvasMiddleware = createCanvasMiddleware(myCanvas)

// 3. Build the stack with both static and injected middleware
// NOTE: Type inference with Zod's Extend<> doesn't fully resolve the MiddlewareClass
// conditional types. This is aspirational - the runtime would work but TS can't verify it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stack = (createStack() as any)
   .use(UserMiddleware) // Static middleware (no external deps)
   .use(SessionMiddleware)
   .use(CanvasMiddleware) // Injected dependency (canvas)
   .use(FileMiddleware) // Injected dependency (fileStore), requires UserState
   .use(PermissionsMiddleware)

// 4. Bind with the combined state
const _ctx = stack.bind({
   // UserState
   userId: "123",
   userName: "Alice",
   // SessionState
   sessionId: "sass-456",
   expiresAt: new Date("2025-12-31"),
   // CanvasState
   width: 800,
   height: 600,
   // FileState
   currentFileId: null,
   // PermissionsState
   roles: ["admin", "editor"],
   canEdit: true,
})

// _ctx now has methods from ALL middleware, with dependencies already wired:
// _ctx.getDisplayName()      - from UserMiddleware
// _ctx.isExpired()           - from SessionMiddleware
// _ctx.drawBackground()      - from CanvasMiddleware (uses injected canvas)
// _ctx.exportImage()         - from CanvasMiddleware
// _ctx.saveCurrentWork(buf)  - from FileMiddleware (uses injected fileStore)
// _ctx.loadFile(id)          - from FileMiddleware
// _ctx.canUserEdit()         - from PermissionsMiddleware
// _ctx.hasRole("admin")      - from PermissionsMiddleware
