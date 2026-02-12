#!/usr/bin/env tsx
/**
 * CLI Tool: Submit Trigram Project to Queue
 *
 * Reads a TrigramProjectSpec JSON file, expands it, and submits
 * the tasks to the BullMQ painting pipeline.
 *
 * Usage:
 *   tsx submit-project.ts <spec-file.json> [options]
 *
 * Options:
 *   --dry-run           Validate and expand without submitting
 *   --redis-url         Redis connection URL (default: redis://localhost:6379)
 *   --blockstore-path   Path to IPLD blockstore (default: ~/.random-art/blockstore)
 *
 * Environment Variables:
 *   REDIS_URL           Redis connection URL
 *   BLOCKSTORE_PATH     Path to IPLD blockstore
 *
 * Example:
 *   tsx submit-project.ts examples/bagua-full.json
 *   tsx submit-project.ts examples/bagua-full.json --dry-run
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { homedir } from "os"
import { NestFactory } from "@nestjs/core"
import {
   Module,
   DynamicModule,
   Provider,
   Type,
   INestApplicationContext,
   Logger,
} from "@nestjs/common"
import { BullModule } from "@nestjs/bullmq"

import type { TrigramProjectSpec } from "../models/spec/index.js"
import { TrigramModule } from "../di/TrigramModule.js"
import { TrigramModuleTypes } from "../di/Types.js"
import type { TrigramProjectSubmitter } from "../components/TrigramProjectSubmitter.js"
import { IpldPlottingModule } from "../../../plotting/ipld/di/Module.js"
import { PlottingModuleTypes } from "../../../plotting/di/Types.js"
import { IpldPlottingModuleTypes } from "../../../plotting/ipld/di/Types.js"
import { RandomArtFlowProducer } from "../../../painting/queue/components/RandomArtFlowProducer.js"
import { FlowConfiguration } from "../../../painting/queue/components/FlowConfiguration.js"
import { QueuedPaintingTypes } from "../../../painting/queue/di/Types.js"
import { IpfsModule } from "../../../ipfs/di/Module.js"
import { PaintingModule } from "../../../painting/artwork/di/Module.js"
import { RandomArtProvider } from "../../../painting/artwork/components/RandomArtProvider.js"
import { PaintQueueRedisEnvironment } from "../../shared/di/Loaders.js"
import { QueueingPaintModule } from "../../../painting/queue/di/Module.js"
import { PaintingModuleTypes } from "../../../painting/artwork/di/Types.js"
import { ConfigService } from "@nestjs/config"
import { AppConfigModule } from "../../shared/di/AppConfigModule.js"

// Queue names now come from configuration (paintQueueNames.yaml)
// loaded via AppConfigModule → QueueingPaintModule → FlowConfiguration

// Token for injecting the blockstore
const SUBMITTER_BLOCKSTORE = Symbol("SubmitterBlockstore")

interface CliOptions {
   configSvc: ConfigService
   specPath: string
   dryRun: boolean
   redisUrl: string
   blockstorePath: string
}

/**
 * Bootstrap module that wires everything together for the submitter role.
 *
 * This module directly wires the FlowProducer and its dependencies rather
 * than going through the InjectableModuleClassFactory configuration system,
 * making the data flow clearer for this end-to-end example.
 *
 * Dependency Graph:
 *   IpfsModule → exports Blockstore
 *   IpldPlottingModule ← injects Blockstore, exports IRegionMapRepository
 *   FlowConfiguration → queue names for scatter/gather
 *   RandomArtFlowProducer ← injects FlowProducer, FlowConfiguration, IRegionMapRepository
 *   TrigramProjectSubmitter ← injects PermutationExpander, RandomArtFlowProducer
 */
@Module({})
class TrigramSubmitterAppModule {
   static forRoot(options: CliOptions): DynamicModule {
      // FlowConfiguration and FlowProducer are now provided by QueueingPaintModule
      // based on queue names from paintQueueNames.yaml configuration
      const providers: Provider[] = [
         // Alias: FlowProducer needs InjectedRegionMapRepo from IpldPlottingModule
         {
            provide: QueuedPaintingTypes.InjectedRegionMapRepo,
            useExisting: PlottingModuleTypes.IRegionMapRepository,
         },
      ]

      // IpfsModule - creates and manages FsBlockstore
      const ipfsModule: DynamicModule = IpfsModule.register({
         rootPath: options.blockstorePath,
         cacheSize: 4000,
         readOnly: true, // Workers only read RegionMaps
         injectToken: SUBMITTER_BLOCKSTORE,
      })
      // IPLD Plotting module - provides IRegionMapRepository
      // Wire blockstore from IpfsModule to IpldPlottingModule config
      const plottingModule = IpldPlottingModule.forRoot({
         blockStore: {
            use: "token",
            for: "value",
            module: ipfsModule,
            token: SUBMITTER_BLOCKSTORE,
         },
      })
      const paintingModule: DynamicModule = PaintingModule.forRoot({
         regionMapRepo: {
            use: "token",
            for: "value",
            module: plottingModule,
            token: PlottingModuleTypes.IRegionMapRepository,
         },
         genModelProvider: {
            use: "value",
            value: new RandomArtProvider(),
         },
      })

      const configSvc: ConfigService = options.configSvc
      const retention = configSvc.get("paintQueueRetention")
      const redis: PaintQueueRedisEnvironment = configSvc.get(
         "PaintQueueRedisEnvironment",
      ) ?? { host: "localhost", port: 6379 }
      const paintAppRole = configSvc.get("paintAppRoles") ?? {}
      const paintQueueNames = configSvc.get("paintQueueNames") ?? {}
      const queueModule: DynamicModule = QueueingPaintModule.forRoot({
         redis,
         retention,
         jobDataSizeLimit: retention.jobDataSizeLimit,
         ...paintAppRole,
         ...paintQueueNames,
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
      })

      // BullMQ connection and flow producer
      // BullModule.forRoot({
      //    connection: { url: options.redisUrl },
      // }),
      // BullModule.registerFlowProducer({ name: "paintFlows" }),

      // Trigram module - provides PermutationExpander and TrigramProjectSubmitter
      const trigramModule = TrigramModule.forRoot({
         role: "submitter",
         FlowProducer: {
            use: "token",
            for: "value",
            module: queueModule,
            token: QueuedPaintingTypes.FlowProducer,
         },
      })
      const imports: Array<DynamicModule | Type> = [
         plottingModule,
         paintingModule,
         queueModule,
         trigramModule,
      ]

      return {
         module: TrigramSubmitterAppModule,
         imports,
         providers,
         exports: [
            queueModule.module,
            plottingModule.module,
            paintingModule.module,
            trigramModule.module,
            // QueuedPaintingTypes.FlowProducer,
         ],
      }
   }
}

async function parseArgs(): Promise<CliOptions> {
   const args = process.argv.slice(2)

   if (args.length === 0 || args.includes("--help")) {
      printUsage()
      process.exit(args.includes("--help") ? 0 : 1)
   }

   // const specPath = args.find((a) => !a.startsWith("--"))
   const specPath = args.slice(-1)[0]
   if (specPath == null || specPath === "") {
      console.error("Error: No spec file provided")
      printUsage()
      process.exit(1)
   }
   const logger: Logger = new Logger("Bootstrap")
   logger.log("Loading")

   const config: INestApplicationContext =
      await NestFactory.createApplicationContext(AppConfigModule.forRoot(), {
         abortOnError: false,
         snapshot: true,
         logger: ["fatal", "error", "warn", "log", "verbose", "debug"],
      })
   const configSvc: ConfigService = config.get(ConfigService)
   configSvc.get("paint")
   // await config.close()
   logger.log("Configured...")

   return {
      configSvc,
      specPath: resolve(specPath),
      dryRun: args.includes("--dry-run"),
      redisUrl:
         getArgValue(args, "--redis-url") ??
         process.env.REDIS_URL ??
         "redis://localhost:6379",
      blockstorePath:
         getArgValue(args, "--blockstore-path") ??
         process.env.BLOCKSTORE_PATH ??
         resolve(homedir(), ".random-art", "blockstore"),
   }
}

function getArgValue(args: string[], flag: string): string | undefined {
   const idx = args.indexOf(flag)
   return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined
}

function printUsage(): void {
   console.log(`
Usage: tsx submit-project.ts <spec-file.json> [options]

Options:
  --dry-run           Validate and expand without submitting
  --redis-url         Redis connection URL (default: redis://localhost:6379)
  --blockstore-path   Path to IPLD blockstore (default: ~/.random-art/blockstore)
  --help              Show this help message

Environment Variables:
  REDIS_URL           Redis connection URL
  BLOCKSTORE_PATH     Path to IPLD blockstore

Example:
  tsx submit-project.ts examples/bagua-full.json
  tsx submit-project.ts examples/bagua-full.json --dry-run
`)
}

async function main(): Promise<void> {
   const options = await parseArgs()

   // Read and parse spec file
   let spec: TrigramProjectSpec
   try {
      console.log(JSON.stringify(options))
      const specContent = readFileSync(options.specPath, "utf-8")
      spec = JSON.parse(specContent)
   } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
         console.error(`Error: File not found: ${options.specPath}`)
      } else if (error instanceof SyntaxError) {
         console.error(`Error: Invalid JSON in file: ${options.specPath}`)
      } else {
         console.error(`Error reading spec file: ${(error as Error).message}`)
      }
      throw error
      // process.exit(1)
   }

   console.log(`\nProject: ${spec.projectId}`)
   console.log(`Permutation Specs: ${spec.permutationSpecs.length}`)

   // Always bootstrap NestJS to validate full wiring
   console.log(`\nConnecting to Redis at ${options.redisUrl}...`)
   console.log(`Using blockstore at ${options.blockstorePath}`)

   const app = await NestFactory.createApplicationContext(
      TrigramSubmitterAppModule.forRoot(options),
      { logger: ["error", "warn"] },
   )

   try {
      const submitter = app.get<TrigramProjectSubmitter>(
         TrigramModuleTypes.ProjectSubmitter,
      )

      if (options.dryRun) {
         // Dry run - validate and expand via the injected submitter
         console.log("\n[DRY RUN] Validating project...\n")

         const validation = submitter.validateProject(spec)

         if (!validation.valid) {
            console.error("Validation failed:")
            validation.errors.forEach((err) => console.error(`  - ${err}`))
            process.exit(1)
         }

         console.log(`Expanded to ${validation.taskCount} tasks`)
         console.log("\n[DRY RUN] Complete - no tasks submitted")
      } else {
         // Actual submission
         console.log("Submitting project to queue...\n")
         const result = await submitter.submitProject(spec)

         console.log(`\nSubmitted ${result.taskCount} tasks`)
         console.log(`Project ID: ${result.projectId}`)
         console.log(
            `Task IDs: ${result.taskIds.slice(0, 5).join(", ")}${result.taskIds.length > 5 ? "..." : ""}`,
         )
      }
   } finally {
      await app.close()
   }
}

main().catch((error) => {
   console.error("Fatal error:", error)
   throw error
   // process.exit(1)
})
