# Configuration Architecture Summary

## Overview

This document captures the architectural decisions made for the type-safe, expression-driven configuration system for the random-art middleware pipeline.

## Core Architectural Principles

### 1. **Two-Stage Processing Flow**

```
Worker Pool Stage (S3 Staging):
  Input → Render → Transform → Filter → Group → Name → S3 Write → Report

Local Node Stage (Finalization):
  Fetch S3 → Transform → Filter → Name → Local Write → Cleanup
```

### 2. **Expression Independence**

All expressions within a single stage (`nameBy`, `groupBy`, `filterBy`) evaluate **simultaneously** using identical parser context. They cannot reference each other's outputs.

```typescript
// ✓ CORRECT - all expressions use base context only
worker: {
   nameBy: {
      expression: "${hash(buffer).slice(0,12)}.png",
      outputProperty: "s3Path"
   },
   groupBy: {
      expression: "${task.campaign}",  // Cannot reference s3Path
      outputProperty: "groupId"
   }
}

// ✗ WRONG - circular dependency
worker: {
   nameBy: {
      expression: "${groupId}/${hash(buffer)}.png",  // groupId doesn't exist yet
      outputProperty: "s3Path"
   }
}
```

### 3. **Cache Strategy as Configuration Value**

The `cacheStrategy` is a **literal enum value**, not an expression, because it controls pipeline structure:

```typescript
enum CacheStrategy {
   PERMANENT_S3 = "PERMANENT_S3",   // S3 is authoritative, no local stage needed
   TRANSIENT_S3 = "TRANSIENT_S3",   // S3 is staging, local is authoritative
   DUAL_STORAGE = "DUAL_STORAGE",   // Both S3 and local kept permanently
}
```

### 4. **Single Parser Extension**

Only one parser extension class allowed per stage. Users needing multiple sources create a composite class:

```typescript
class CompositeExtensions {
   static getDominantHue(this: ParserContext): string {
      return ImageMetrics.getDominantHue.call(this)
   }

   static getFilesize(this: ParserContext): number {
      return FileUtils.getFilesize.call(this)
   }
}
```

### 5. **Type-Safe Output Properties**

Output property names are captured as **type-level literal strings** to enable full type inference:

```typescript
const config: SingleContentDependence<
   MyTaskModel,
   MyProjectModel,
   [],              // WorkerTE
   "s3Path",        // WorkerNameByProp - tracked by TypeScript
   "groupId",       // WorkerGroupByProp
   // ...
>
```

## Type System Architecture

### Domain Models

```typescript
interface SingleContentDependence<
   TaskModel extends object | undefined,       // User's task properties
   ProjectModel extends object | undefined,    // User's project properties

   // Worker stage configuration
   WorkerTE extends Array<MiddlewareHandler<any, any>>,
   WorkerNameByProp extends string,
   WorkerGroupByProp extends string | undefined,
   WorkerFilterByProp extends string | undefined,

   // Local stage configuration
   LocalTE extends Array<MiddlewareHandler<any, any>>,
   LocalNameByProp extends string | undefined,
   LocalFilterByProp extends string | undefined,
   PE extends Type<any> | undefined,
> {
   // Capture domain model types
   taskModel?: Type<TaskModel>
   projectModel?: Type<ProjectModel>

   cacheStrategy: CacheStrategy

   worker: WorkerStageConfig<...>
   local?: LocalStageConfig<...>
}
```

### Parser Context Construction

```typescript
// Worker stage parser context
type WorkerParserContext<TM, PM, TE> =
   & CoreContext              // Framework properties (width, height, buffer, etc.)
   & { task: TM }             // Task domain model
   & { project: PM }          // Project domain model
   & ExtractAddedContexts<TE> // Properties from transform middleware

// Local stage parser context
type LocalParserContext<TM, PM, WO, TE> =
   & CoreContext
   & { task: TM }
   & { project: PM }
   & WO                       // Worker output (s3Path, groupId, s3Uri, etc.)
   & ExtractAddedContexts<TE> // Local transform extensions
```

### Output Type Inference

```typescript
// TypeScript computes final output type from configuration
type WorkerOutputModel<TM, TE, NameByProp, GroupByProp, FilterByProp> =
   & { task: TM }
   & ExtractAddedContexts<TE>
   & { [K in NameByProp]: string }
   & (GroupByProp extends string ? { [K in GroupByProp]: string } : {})
   & (FilterByProp extends string ? { [K in FilterByProp]: boolean } : {})
   & { s3Uri: string }
```

### Parser Extension Validation

```typescript
type ParserExtension<ThisContext, PE extends Type<any>> = {
   [K in keyof PE]: PE[K] extends (this: any, ...args: infer Args) => infer R
      ? (this: ThisContext, ...args: Args) => R
      : never
}

// TypeScript ensures parser extension methods match accumulated context
interface LocalStageConfig<TM, PM, WO, TE, PE> {
   parserExtension?: PE extends Type<any>
      ? ParserExtension<
           CoreContext & { task: TM } & { project: PM } & WO & ExtractAddedContexts<TE>,
           PE
        > extends PE
        ? PE
        : never
      : undefined
}
```

## Configuration Example

```typescript
// Domain models
interface MyTaskModel {
   campaign: string
   variant: number
}

interface MyProjectModel {
   baseUrl: string
}

// Transform extension
interface ColorAnalysisOutput {
   colorHistogram: {
      dominantHue: string
      entropy: number
   }
}

class ColorAnalysisMiddleware
   implements MiddlewareHandler<ColorAnalysisOutput, {}>
{
   async handle(ctx: any): Promise<any> {
      return {
         ...ctx,
         colorHistogram: analyzeColors(ctx.buffer)
      }
   }
}

// Parser extension
class ImageMetrics {
   static getDominantHue(
      this: CoreContext &
           { task: MyTaskModel } &
           { project: MyProjectModel } &
           ColorAnalysisOutput
   ): string {
      return this.colorHistogram.dominantHue
   }
}

// Type-safe configuration
const config: SingleContentDependence<
   MyTaskModel,
   MyProjectModel,
   [],                             // No worker transforms
   "s3Path",
   "groupId",
   undefined,
   [ColorAnalysisMiddleware],
   "localPath",
   undefined,
   typeof ImageMetrics
> = {
   taskModel: MyTaskModel,
   projectModel: MyProjectModel,
   cacheStrategy: CacheStrategy.TRANSIENT_S3,

   worker: {
      nameBy: {
         expression: "${task.campaign}/${hash(buffer).slice(0,12)}.png",
         outputProperty: "s3Path"
      },
      groupBy: {
         expression: "${task.campaign}",
         outputProperty: "groupId"
      }
   },

   local: {
      transformExtensions: [new ColorAnalysisMiddleware()],
      parserExtension: ImageMetrics,
      nameBy: {
         expression: "${getDominantHue()}/${task.variant}.png",
         outputProperty: "localPath"
      }
   }
}
```

## Remaining Implementation Tasks

### 1. Storage Abstraction Consolidation

**Status**: Partially complete (error classification done)

**Remaining Work**:
- Create unified `IFileStore` interface
- Implement `FileStoreMiddleware` that works with any `IFileStore` implementation
- Inject appropriate store implementation (S3 or Local) via DI token
- Ensure error handling uses `StorageError.isRetryable()` pattern

**Files to Modify**:
- Create: `src/storage/interface/IFileStore.ts`
- Modify: `src/storage/components/S3ResultStore.ts` (implement IFileStore)
- Modify: `src/storage/components/LocalResultStore.ts` (implement IFileStore)
- Create: `src/painting/middleware/handlers/FileStoreMiddleware.ts`
- Delete: `src/painting/middleware/handlers/S3StorageHandlerMiddleware.ts`
- Delete: `src/painting/middleware/handlers/LocalStorageHandlerMiddleware.ts`

### 2. Dependency Injection Token Management

**Status**: Not started

**Work Required**:
- Define DI tokens for file stores
- Configure providers in NestJS module
- Inject stores into middleware based on configuration

**Files to Create/Modify**:
- Create: `src/storage/tokens.ts` (DI tokens)
- Modify: `src/painting/artwork/di/*` (module configuration)

### 3. Dynamic Module Construction from Configuration

**Status**: Configuration types designed, runtime builder not implemented

**Work Required**:
- Implement `DynamicModuleFactory` that reads `SingleContentDependence` config
- Build worker middleware chain from `config.worker`
- Build local middleware chain from `config.local` (if present)
- Register providers for injected dependencies
- Create `FlowProcessor` instances

**Files to Create**:
- Create: `src/painting/artwork/di/DynamicModuleFactory.ts`
- Create: `src/painting/artwork/di/FlowProcessor.ts`
- Create: `src/painting/artwork/di/MiddlewareChainBuilder.ts`

### 4. Queue Rotation

**Status**: Not started

**Work Required**:
- Implement queue selection strategy (round-robin, load-based, etc.)
- Register multiple BullMQ queues
- Route jobs to appropriate worker queues
- Coordinate between worker queues and local node

**Files to Create**:
- Create: `src/queue/QueueRotationStrategy.ts`
- Create: `src/queue/QueueRegistry.ts`
- Modify: Job submission logic to select queue

### 5. Expression Evaluation Integration

**Status**: Design complete, implementation needed

**Work Required**:
- Create expression evaluator using `jse-eval`
- Implement middleware that evaluates `nameBy`/`groupBy`/`filterBy` expressions
- Bind parser context with domain models and parser extensions
- Set output properties on context

**Files to Create**:
- Create: `src/painting/middleware/expression/ExpressionEvaluator.ts`
- Create: `src/painting/middleware/handlers/NameByMiddleware.ts`
- Create: `src/painting/middleware/handlers/GroupByMiddleware.ts`
- Create: `src/painting/middleware/handlers/FilterByMiddleware.ts`

### 6. Core Context Definition

**Status**: Referenced but not defined

**Work Required**:
- Define `CoreContext` interface with framework properties
- Ensure it includes: `jobId`, `width`, `height`, `buffer`, `prefixLength`, `regionMapName`, etc.

**Files to Create**:
- Create: `src/painting/middleware/types/CoreContext.ts`

## Architectural Benefits

1. **Type Safety**: Full TypeScript inference from configuration to output types
2. **Clear Semantics**: Two-stage flow is explicit in configuration structure
3. **Expression Independence**: No ordering dependencies within stages
4. **Extensibility**: Users can add domain models, transforms, and parser functions
5. **Self-Documenting**: Configuration structure reveals pipeline behavior
6. **Error Prevention**: Circular dependencies and type mismatches caught at compile time

## Migration Path

### From Current Middleware

```typescript
// Old: Middleware sets actualFilename
class ContentHashFileNamerMiddleware {
   async handle(ctx: ItemContext): Promise<ItemContext> {
      const hash = crypto.createHash('sha256').update(ctx.buffer).digest('hex')
      return {
         ...ctx,
         actualFilename: `${hash.slice(0,12)}.png`
      }
   }
}

// New: Configuration specifies expression
worker: {
   nameBy: {
      expression: "${hash(buffer).slice(0,12)}.png",
      outputProperty: "s3Path"
   }
}

// Generic NameByMiddleware evaluates expression
class NameByMiddleware {
   constructor(
      private readonly expression: string,
      private readonly outputProperty: string
   ) {}

   async handle(ctx: any): Promise<any> {
      const value = await evaluateExpression(this.expression, ctx)
      return {
         ...ctx,
         [this.outputProperty]: value
      }
   }
}
```

## Documentation Status

- ✅ Storage error classification architecture documented
- ✅ Middleware handler cleanup documented
- ✅ Configuration type system architecture documented
- ⏳ Expression evaluation guide (pending)
- ⏳ DI integration guide (pending)
- ⏳ Queue rotation strategy (pending)
- ⏳ Migration guide for existing users (pending)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-08
**Status**: Design phase complete, implementation pending
