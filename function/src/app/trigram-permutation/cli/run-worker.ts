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

import { resolve } from "path"
import { homedir } from "os"
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
   paintQueueNames,
   type PaintQueueNamesEnvironment,
} from "../../shared/di/Loaders.js"
import { RandomArtProvider } from "../../../painting/artwork/components/RandomArtProvider.js"
import { GenJs6Provider } from "../../../painting/artwork/components/GenJs6Provider.js"
import type { IGenModelProvider } from "../../../painting/artwork/interface/IGenModelProvider.js"
import { AppConfigModule } from "../../shared/di/AppConfigModule.js"
import { LocalStorageModule } from "../../../storage/di/LocalStorageModule.js"
import { AwsS3StorageModule } from "../../../storage/di/AwsS3StorageModule.js"
import { WORKER_FILE_STORE } from "../../../storage/tokens.js"
import { TrigramPipelineModule } from "../di/TrigramPipelineModule.js"

type WorkerRole = "paint" | "gather" | "both"
type ArtProvider = "randomart" | "genjs6"

interface CommonWorkerCliOptions {
   role: WorkerRole
   redisUrl: string
   blockstorePath: string
   rootPath: string
   stagerType: "local" | "s3"
   /** Number of concurrent jobs per worker (default: 1) */
   concurrency: number
   /** Art generation provider (default: randomart) */
   artProvider: ArtProvider
}

interface LocalWorkerCliOptions extends CommonWorkerCliOptions {
   stagerType: "local"
}

interface S3WorkerCliOptions extends CommonWorkerCliOptions {
   stagerType: "s3"
   s3Bucket: string
   awsRegion: string
}

type WorkerCliOptions = LocalWorkerCliOptions | S3WorkerCliOptions

// Queue names loaded from configuration (paintQueueNames.yaml)
// This ensures workers listen on the same queues that the submitter sends to
let queueNames: PaintQueueNamesEnvironment["queueNames"]

// Token for injecting the blockstore
const WORKER_BLOCKSTORE = Symbol("WorkerBlockstore")

/**
 * Create the appropriate IGenModelProvider based on configuration.
 */
function createGenModelProvider(artProvider: ArtProvider): IGenModelProvider {
   switch (artProvider) {
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
      pipelineModule: DynamicModule | undefined,
   ): DynamicModule {
      // Build the module dependency chain

      // 1. IpfsModule - creates and manages FsBlockstore
      const ipfsModule: DynamicModule = IpfsModule.register({
         rootPath: options.blockstorePath,
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
      // Create the art generation provider based on configuration
      const genModelProvider = createGenModelProvider(options.artProvider)

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
                    bucketName: options.s3Bucket,
                    region: options.awsRegion,
                    keyPrefix: "trigram-art",
                 },
              }
            : {
                 stagerType: "local",
                 localConfig: {
                    rootPath: options.rootPath,
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
      // The module handles all the internal wiring via InjectableModuleClassFactory
      const queueModule: DynamicModule = QueueingPaintModule.forRoot({
         redis: parseRedisUrl(options.redisUrl),
         retention: {
            keepLogs: 250,
            removeOnComplete: { age: 120 },
            removeOnFail: { age: 300 },
         },
         jobDataSizeLimit: 1024 ** 3,
         queueNames: {
            toPaintParts: queueNames.toPaintParts,
            toGatherParts: queueNames.toGatherParts,
            toGatherTasks: queueNames.toGatherTasks,
            toReceiveReplies: `reply-queue-worker-${process.pid}`,
         },
         flowProducerNames: {
            forJobSpecs: "forSpecs",
         },
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
         imports: pipelineModule != null
            ? [queueModule, pipelineModule]
            : [queueModule],
      }
   }
}

/**
 * Parse a Redis URL into host/port config
 */
function parseRedisUrl(url: string): { host: string; port: number } {
   try {
      const parsed = new URL(url)
      const port = parseInt(parsed.port, 10)
      return {
         host: parsed.hostname !== "" ? parsed.hostname : "localhost",
         port: !Number.isNaN(port) && port !== 0 ? port : 6379,
      }
   } catch {
      // Fallback for simple "host:port" format
      const [host, portStr] = url.replace("redis://", "").split(":")
      const port = parseInt(portStr, 10)
      return {
         host: host !== "" ? host : "localhost",
         port: !Number.isNaN(port) && port !== 0 ? port : 6379,
      }
   }
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

   const stagerType = (process.env.STAGER_TYPE as "local" | "s3") ?? "local"

   const concurrencyArg =
      getArgValue(args, "--concurrency") ?? process.env.WORKER_CONCURRENCY
   const concurrency =
      concurrencyArg != null ? parseInt(concurrencyArg, 10) : 1

   // Art provider selection - defaults to randomart for open-source distribution
   const artProviderArg =
      getArgValue(args, "--art-provider") ?? process.env.ART_PROVIDER
   let artProvider: ArtProvider = "randomart"
   if (artProviderArg != null) {
      if (!["randomart", "genjs6"].includes(artProviderArg)) {
         console.error(
            `Error: Invalid art provider "${artProviderArg}". Must be randomart or genjs6.`,
         )
         process.exit(1)
      }
      artProvider = artProviderArg as ArtProvider
   }

   const commonProps = {
      role,
      redisUrl:
         getArgValue(args, "--redis-url") ??
         process.env.REDIS_URL ??
         "redis://localhost:6379",
      blockstorePath:
         getArgValue(args, "--blockstore-path") ??
         process.env.BLOCKSTORE_PATH ??
         resolve(homedir(), ".random-art", "blockstore"),
      rootPath:
         getArgValue(args, "--root-path") ??
         process.env.ROOT_PATH ??
         "/tmp/trigram-output",
      concurrency: Number.isNaN(concurrency) || concurrency < 1 ? 1 : concurrency,
      artProvider,
   }

   if (stagerType === "s3") {
      return {
         ...commonProps,
         stagerType: "s3" as const,
         s3Bucket: process.env.S3_BUCKET ?? "",
         awsRegion: process.env.AWS_REGION ?? "us-east-1",
      }
   }

   return {
      ...commonProps,
      stagerType: "local" as const,
   }
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
   const options = parseArgs()

   // Load queue names from configuration before building the module
   // This ensures workers listen on the same queues that the submitter sends to
   const queueConfig = paintQueueNames()
   queueNames = queueConfig.queueNames

   console.log(`\nStarting Trigram Worker`)
   console.log(`  Role: ${options.role}`)
   console.log(`  Concurrency: ${options.concurrency}`)
   console.log(`  Art Provider: ${options.artProvider}`)
   console.log(`  Redis: ${options.redisUrl}`)
   console.log(`  Blockstore: ${options.blockstorePath}`)
   console.log(`  Paint Queue: ${queueNames.toPaintParts}`)
   console.log(`  Gather Queue: ${queueNames.toGatherParts}`)
   if (options.role === "gather" || options.role === "both") {
      console.log(`  Staging: ${options.stagerType}`)
      if (options.stagerType === "local") {
         console.log(`  Output: ${options.rootPath}`)
      } else {
         console.log(`  S3 Bucket: ${options.s3Bucket}`)
      }
   }
   console.log()

   // Validate S3 config if using S3 stager
   if (options.stagerType === "s3" && options.s3Bucket === "") {
      console.error(
         "Error: S3_BUCKET environment variable required when STAGER_TYPE=s3",
      )
      process.exit(1)
   }

   // Phase 1: mini-bootstrap to get ConfigService for the assembly function
   const configContext = await NestFactory.createApplicationContext(
      await AppConfigModule.forRoot(),
      { logger: ["error", "warn"] },
   )
   const configSvc = configContext.get(ConfigService)
   await configContext.close()

   const storageModule =
      options.stagerType === "s3"
         ? AwsS3StorageModule.forRoot({
              exportToken: WORKER_FILE_STORE,
              s3Bucket: options.s3Bucket,
              s3Region: options.awsRegion,
           })
         : LocalStorageModule.forRoot({ exportToken: WORKER_FILE_STORE })

   // Assembly Function: wire the pipeline with config-driven defaults
   const pipelineModule = TrigramPipelineModule.assemble(configSvc, storageModule)

   // Phase 2: full application bootstrap
   const app = await NestFactory.createApplicationContext(
      TrigramWorkerAppModule.forRoot(options, pipelineModule),
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
