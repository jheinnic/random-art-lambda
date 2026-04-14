#!/usr/bin/env tsx
/**
 * CLI Tool: Run Trigram Project Worker
 *
 * Starts a worker process that handles painting and/or gathering jobs
 * from the BullMQ queue.
 *
 * Usage:
 *   tsx run-worker.ts [options]
 *
 * Options:
 *   --role <role>      Worker role: paint, gather, or both (default: both)
 *   --redis-url        Redis connection URL (default: redis://localhost:6379)
 *   --blockstore-path  Path to IPLD blockstore (default: ~/.random-art/blockstore)
 *   --root-path       Root path for staged images for gathered images (default: /tmp/trigram-output)
 *
 * Environment Variables:
 *   REDIS_URL          Redis connection URL
 *   BLOCKSTORE_PATH    Path to IPLD blockstore
 *   ROOT_PATH         Root path for staged images
 *   S3_BUCKET          S3 bucket for staging (if using S3 stager)
 *   AWS_REGION         AWS region for S3
 *   STAGER_TYPE        Staging type: "local" or "s3" (default: local)
 *
 * Example:
 *   tsx run-worker.ts --role paint
 *   tsx run-worker.ts --role gather --root-path ./output
 *   tsx run-worker.ts --role both
 */

import { NestFactory } from "@nestjs/core"
import { Module, DynamicModule, OnModuleInit, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

import {
   StagingModule,
   StagingModuleTypes,
} from "../../../painting/staging/index.js"
import { QueueingPaintModule } from "../../../painting/queue/di/Module.js"
import { IpldPlottingModule } from "../../../plotting/ipld/di/Module.js"
import { IpldPlottingModuleTypes } from "../../../plotting/ipld/di/Types.js"
import { PaintingModule } from "../../../painting/artwork/di/Module.js"
import { PaintingModuleTypes } from "../../../painting/artwork/di/Types.js"
import { IpfsModule } from "../../../ipfs/di/Module.js"
import {
   type PaintQueueNamesEnvironment,
   type IpfsEnvironment,
   type StagingEnvironment,
   type PaintGenModelEnvironment,
   type PaintQueueRedisEnvironment,
   type PaintQueueRetentionEnvironment,
} from "../../shared/di/Loaders.js"
import { RandomArtProvider } from "../../../painting/artwork/components/RandomArtProvider.js"
import { GenJs6Provider } from "../../../painting/artwork/components/GenJs6Provider.js"
import type { IGenModelProvider } from "../../../painting/artwork/interface/IGenModelProvider.js"
import { AppConfigModule } from "../../shared/di/AppConfigModule.js"
import { LocalStorageModule } from "../../../storage/di/LocalStorageModule.js"
import { AwsS3StorageModule } from "../../../storage/di/AwsS3StorageModule.js"
import { TrigramModuleTypes } from "../di/Types.js"
import { TrigramPipelineModule } from "../di/TrigramPipelineModule.js"

type WorkerRole = "paint" | "gather" | "both"

interface WorkerCliOptions {
   role: WorkerRole
   stagerType: "local" | "s3"
   /** Number of concurrent jobs per worker (default: 1) */
   concurrency: number
}

// Token for injecting the blockstore
const WORKER_BLOCKSTORE = Symbol("WorkerBlockstore")

/**
 * Create the appropriate IGenModelProvider based on configuration.
 */
function createGenModelProvider(
   genModel: PaintGenModelEnvironment["genModel"],
): IGenModelProvider {
   switch (genModel) {
      case "genjs6":
         return new GenJs6Provider()
      case "randomart":
      default:
         return new RandomArtProvider()
   }
}

/**
 * Bootstrap module that wires everything together for worker role.
 *
 * Uses the standard module configuration pattern:
 *   IpfsModule → exports Blockstore
 *   IpldPlottingModule ← injects Blockstore, exports IRegionMapRepository
 *   PaintingModule ← injects IRegionMapRepository, exports IRandomArtTaskEngine
 *   StagingModule → exports IImageStager
 *   QueueingPaintModule ← injects all above, creates workers based on role config
 */
@Module({})
class TrigramWorkerAppModule implements OnModuleInit {
   private readonly logger = new Logger("TrigramWorkerAppModule")

   onModuleInit(): void {
      this.logger.log("Worker module initialized and ready to process jobs")
   }

   static forRoot(
      options: WorkerCliOptions,
      configSvc: ConfigService,
      pipelineModule: DynamicModule | undefined,
   ): DynamicModule {
      const queueConfig = requireConfig<PaintQueueNamesEnvironment>(
         configSvc,
         "paintQueueNames",
      )
      const queueNames: PaintQueueNamesEnvironment["queueNames"] =
         queueConfig.queueNames
      const flowProducerNames: PaintQueueNamesEnvironment["flowProducerNames"] =
         queueConfig.flowProducerNames
      const ipfsConfig = requireConfig<IpfsEnvironment>(configSvc, "ipfs")
      const stagingConfig = requireConfig<StagingEnvironment>(
         configSvc,
         "staging",
      )
      const genModelConfig = requireConfig<PaintGenModelEnvironment>(
         configSvc,
         "paintGenModel",
      )
      const redisConfig = requireConfig<PaintQueueRedisEnvironment>(
         configSvc,
         "paintQueueRedis",
      )
      const retentionConfig = requireConfig<PaintQueueRetentionEnvironment>(
         configSvc,
         "paintQueueRetention",
      )

      // 1. IpfsModule - creates and manages FsBlockstore
      const ipfsModule: DynamicModule = IpfsModule.register({
         rootPath: ipfsConfig.blockstorePath,
         cacheSize: 4000,
         readOnly: true, // Workers only read RegionMaps
         injectToken: WORKER_BLOCKSTORE,
      })

      // 2. IpldPlottingModule - provides IRegionMapRepository
      const plottingModule: DynamicModule = IpldPlottingModule.forRoot({
         blockStore: {
            use: "token",
            for: "value",
            module: ipfsModule,
            token: WORKER_BLOCKSTORE,
         },
      })

      // 3. PaintingModule - provides IRandomArtTaskEngine
      const genModelProvider = createGenModelProvider(genModelConfig.genModel)

      const paintingModule: DynamicModule = PaintingModule.forRoot({
         regionMapRepo: {
            use: "token",
            for: "value",
            module: plottingModule,
            token: IpldPlottingModuleTypes.IpldRegionMapRepository,
         },
         genModelProvider: {
            use: "value",
            value: genModelProvider,
         },
      })

      // 4. StagingModule - provides IImageStager (only needed for gather role)
      const stagingModule: DynamicModule = StagingModule.forRoot(
         options.stagerType === "s3"
            ? {
                 stagerType: "s3",
                 s3Config: {
                    bucketName: stagingConfig.s3Bucket ?? "",
                    region: stagingConfig.s3Region,
                    keyPrefix: stagingConfig.s3KeyPrefix,
                 },
              }
            : {
                 stagerType: "local",
                 localConfig: {
                    rootPath: stagingConfig.localRootPath,
                 },
              },
      )

      // Determine roles based on CLI option
      const roles: Array<"paintWorker" | "stageWorker"> = []
      if (options.role === "paint" || options.role === "both") {
         roles.push("paintWorker")
      }
      if (options.role === "gather" || options.role === "both") {
         roles.push("stageWorker")
      }

      // 5. QueueingPaintModule - creates workers based on role config
      const queueModule: DynamicModule = QueueingPaintModule.forRoot({
         redis: redisConfig,
         retention: retentionConfig,
         queueNames,
         flowProducerNames,
         workerConcurrency: {
            paint: options.concurrency,
            gather: options.concurrency,
         },
         roles,
         paintEngine: {
            use: "token",
            for: "value",
            module: paintingModule,
            token: PaintingModuleTypes.IRandomArtTaskEngine,
         },
         regionMapRepo: {
            use: "token",
            for: "value",
            module: plottingModule,
            token: IpldPlottingModuleTypes.IpldRegionMapRepository,
         },
         imageStager: {
            use: "token",
            for: "value",
            module: stagingModule,
            token: StagingModuleTypes.IImageStager,
         },
         fileStore: undefined,
      })

      return {
         module: TrigramWorkerAppModule,
         imports:
            pipelineModule != null
               ? [queueModule, pipelineModule]
               : [queueModule],
      }
   }
}

/**
 * Retrieve a required config value — throws if the key is missing.
 * Avoids non-null assertions while keeping call sites concise.
 */
function requireConfig<T>(configSvc: ConfigService, key: string): T {
   const value = configSvc.get<T>(key)
   if (value === undefined) {
      throw new Error(`Required configuration key "${key}" is missing`)
   }
   return value
}

/**
 * Write explicit CLI flag values into process.env so they participate in the
 * ConfigService precedence chain (CLI flag > .env file > loader default).
 * Only explicitly-provided flags are written — env vars already set are not
 * overwritten, preserving the standard dotenv non-overwrite behaviour.
 *
 * Called before Phase 1 bootstrap so ConfigModule sees these values when it
 * loads the registered loaders.
 */
function applyCliEnvOverrides(): void {
   const args = process.argv.slice(2)
   const blockstorePath = getArgValue(args, "--blockstore-path")
   if (blockstorePath != null) process.env.RA_BLOCKSTORE_PATH = blockstorePath
   const rootPath = getArgValue(args, "--root-path")
   if (rootPath != null) process.env.RA_STAGING_ROOT = rootPath
   const artProvider = getArgValue(args, "--art-provider")
   if (artProvider != null) process.env.RA_GEN_MODEL = artProvider
   const stagerType = getArgValue(args, "--stager-type")
   if (stagerType != null) process.env.RA_STAGER_TYPE = stagerType
}

function parseArgs(): WorkerCliOptions {
   const args = process.argv.slice(2)

   if (args.includes("--help")) {
      printUsage()
      process.exit(0)
   }

   const roleArg = getArgValue(args, "--role")
   let role: WorkerRole = "both"
   if (roleArg != null) {
      if (!["paint", "gather", "both"].includes(roleArg)) {
         console.error(
            `Error: Invalid role "${roleArg}". Must be paint, gather, or both.`,
         )
         process.exit(1)
      }
      role = roleArg as WorkerRole
   }

   // stagerType is a topology decision — must be known before Phase 1 to select
   // which storage module to import.  Read from env (which may have been set by
   // applyCliEnvOverrides above, or from RA_STAGER_TYPE / STAGER_TYPE in .env).
   const stagerType =
      (process.env.RA_STAGER_TYPE as "local" | "s3") ??
      (process.env.STAGER_TYPE as "local" | "s3") ??
      "local"

   const concurrencyArg =
      getArgValue(args, "--concurrency") ?? process.env.WORKER_CONCURRENCY
   const concurrency = concurrencyArg != null ? parseInt(concurrencyArg, 10) : 1

   const commonProps = {
      role,
      stagerType,
      concurrency:
         Number.isNaN(concurrency) || concurrency < 1 ? 1 : concurrency,
   }

   return { ...commonProps, stagerType }
}

function getArgValue(args: string[], flag: string): string | undefined {
   const idx = args.indexOf(flag)
   return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined
}

function printUsage(): void {
   console.log(`
Usage: tsx run-worker.ts [options]

Options:
  --role <role>        Worker role: paint, gather, or both (default: both)
  --concurrency <N>    Number of concurrent jobs per worker (default: 1)
  --art-provider       Art generation provider: randomart or genjs6 (default: randomart)
  --redis-url          Redis connection URL (default: redis://localhost:6379)
  --blockstore-path    Path to IPLD blockstore (default: ~/.random-art/blockstore)
  --root-path         Root path for staged images (default: /tmp/trigram-output)
  --help               Show this help message

Environment Variables:
  REDIS_URL            Redis connection URL
  WORKER_CONCURRENCY   Number of concurrent jobs per worker
  ART_PROVIDER         Art generation provider: randomart or genjs6 (default: randomart)
  BLOCKSTORE_PATH      Path to IPLD blockstore
  ROOT_PATH           Root path for staged images
  S3_BUCKET            S3 bucket for staging (if using S3 stager)
  AWS_REGION           AWS region for S3
  STAGER_TYPE          Staging type: "local" or "s3" (default: local)

Worker Roles:
  paint    Process painting jobs (fragment rendering)
  gather   Process gathering jobs (fragment assembly + staging)
  both     Process both painting and gathering jobs

Art Providers:
  randomart  MIT-licensed vshymanskyy/randomart (recommended for distribution)
  genjs6     Original genjs6 implementation (personal use only, LGPL licensed)

Example:
  # Run both painting and gathering workers
  tsx run-worker.ts

  # Run only paint worker
  tsx run-worker.ts --role paint

  # Run gather worker with custom output
  tsx run-worker.ts --role gather --root-path ./output

  # Run with S3 staging
  STAGER_TYPE=s3 S3_BUCKET=my-bucket tsx run-worker.ts --role gather
`)
}

async function main(): Promise<void> {
   // Write explicit CLI flags into process.env before Phase 1 so ConfigModule
   // loaders see them in the precedence chain (CLI flag > .env > loader default).
   applyCliEnvOverrides()

   const options = parseArgs()

   // Load queue names from configuration before building the module
   // This ensures workers listen on the same queues that the submitter sends to
   // const queueConfig = paintQueueNames()

   console.log(`\nStarting Trigram Worker`)
   console.log(`  Role: ${options.role}`)
   console.log(`  Concurrency: ${options.concurrency}`)
   console.log(`  Stager: ${options.stagerType}`)
   // console.log(`  Paint Queue: ${queueNames.toPaintParts}`)
   // console.log(`  Gather Queue: ${queueNames.toGatherParts}`)
   console.log()

   // Phase 1: mini-bootstrap to get ConfigService for the assembly function.
   // CLI overrides are already in process.env, so loaders pick them up here.
   const configContext = await NestFactory.createApplicationContext(
      await AppConfigModule.forRoot(),
      { logger: ["error", "warn"] },
   )
   const configSvc = configContext.get(ConfigService)
   await configContext.close()

   // Log resolved config values after Phase 1.
   // Queue names loaded from configuration (paintQueueNames.yaml)
   // This ensures workers listen on the same queues that the submitter sends to
   const ipfsConfig = requireConfig<IpfsEnvironment>(configSvc, "ipfs")
   const stagingConfig = requireConfig<StagingEnvironment>(configSvc, "staging")
   const paintingConfig = requireConfig<PaintGenModelEnvironment>(
      configSvc,
      "paintGenModel",
   )
   const redisConfig = requireConfig<PaintQueueRedisEnvironment>(
      configSvc,
      "paintQueueRedis",
   )
   console.log(`  Art Provider: ${paintingConfig.genModel}`)
   console.log(`  Redis: ${redisConfig.host}:${redisConfig.port}`)
   console.log(`  Blockstore: ${ipfsConfig.blockstorePath}`)
   if (options.role === "gather" || options.role === "both") {
      if (options.stagerType === "local") {
         console.log(`  Output: ${stagingConfig.localRootPath}`)
      } else {
         console.log(`  S3 Bucket: ${stagingConfig.s3Bucket ?? "(unset)"}`)
      }
   }
   console.log()

   // Validate S3 config if using S3 stager
   if (
      options.stagerType === "s3" &&
      (stagingConfig.s3Bucket === undefined || stagingConfig.s3Bucket === "")
   ) {
      console.error(
         "Error: S3 bucket is required when stager type is s3. " +
            "Set RA_S3_BUCKET or S3_BUCKET.",
      )
      process.exit(1)
   }

   // Application-context boundary: the one place that knows both the storage
   // module's export token and the consumer module's expected token shape.
   const appFileStoreToken = TrigramModuleTypes.AppFileStore
   const storageModule =
      options.stagerType === "s3"
         ? AwsS3StorageModule.forRoot({
              exportToken: appFileStoreToken,
              s3Bucket: stagingConfig.s3Bucket ?? "",
              s3Region: stagingConfig.s3Region,
           })
         : LocalStorageModule.forRoot({ exportToken: appFileStoreToken })

   // Wire the pipeline module via forRoot() — the app-context boundary.
   const pipelineModule = TrigramPipelineModule.forRoot({
      configSvc,
      fileStore: {
         use: "token",
         for: "value",
         token: appFileStoreToken,
         module: storageModule,
      },
   })

   // Phase 2: full application bootstrap
   const app = await NestFactory.createApplicationContext(
      TrigramWorkerAppModule.forRoot(options, configSvc, pipelineModule),
      {
         logger: ["log", "error", "warn"],
      },
   )
   // Setup graceful shutdown
   // The guard must be checked synchronously in the handler, before any async work,
   // to prevent race conditions when multiple signals arrive rapidly.
   let isShuttingDown = false

   const shutdown = async (signal: string): Promise<void> => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`)

      const forceExitTimeout = setTimeout(() => {
         console.error("Shutdown timed out, forcing exit")
         process.exit(1)
      }, 10_000)
      forceExitTimeout.unref()

      try {
         await app.close()
         console.log("Worker stopped.")
         clearTimeout(forceExitTimeout)
         process.exit(0)
      } catch (err) {
         console.error("Error during shutdown:", err)
         clearTimeout(forceExitTimeout)
         process.exit(1)
      }
   }

   // Handler that checks the guard synchronously before starting async shutdown.
   // Using process.on (not once) ensures the handler stays registered to catch
   // subsequent signals while shutdown is in progress, preventing Node's default
   // signal behavior (immediate termination) from interrupting app.close().
   const handleSignal = (signal: string): void => {
      if (isShuttingDown) {
         // Already shutting down - ignore subsequent signals
         console.log(`Shutdown already in progress, ignoring ${signal}`)
         return
      }
      isShuttingDown = true
      shutdown(signal).catch(() => process.exit(1))
   }

   process.on("SIGINT", () => handleSignal("SIGINT"))
   process.on("SIGTERM", () => handleSignal("SIGTERM"))
   console.log("Worker is running. Press Ctrl+C to stop.\n")

   // Keep the process alive - NestJS/BullMQ workers run in the background
   await new Promise(() => {
      // This promise never resolves, keeping the process running
      // The worker processors are registered by NestJS and will handle jobs
   })
}

main().catch((error) => {
   console.error("Fatal error:", error)
   process.exit(1)
})
