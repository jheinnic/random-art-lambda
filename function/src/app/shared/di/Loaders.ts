import { registerAs } from "@nestjs/config"
import { dirname, resolve } from "path"
import { homedir } from "os"
import { fileURLToPath } from "url"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import * as yaml from "js-yaml"
import z from "zod"

// Define the equivalent of __filename (current file path)
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url)

// Define the equivalent of __dirname (current directory path)
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(__filename)

export interface PainterChannelEnvironment {
   concurrency: number
   timeout: number
}

export const painterChannel = registerAs(
   "painterChannel",
   (): PainterChannelEnvironment => {
      const concurrency =
         process.env.RA_PAINTER_CONCURRENCY != null &&
         parseInt(process.env.RA_PAINTER_CONCURRENCY)
      const timeout =
         process.env.RA_PAINTER_TIMEOUT != null &&
         parseInt(process.env.RA_PAINTER_TIMEOUT)
      return {
         concurrency: typeof concurrency === "boolean" ? 8 : concurrency,
         timeout: typeof timeout === "boolean" ? 90000 : timeout,
      }
   },
)

const PaintAppRolesEnvironmentSchema = z.object({
   roles: z
      .array(
         z.union([
            z.literal("mainApp"),
            z.literal("paintWorker"),
            z.literal("stageWorker"),
            z.literal("jobDoneWorker"),
         ]),
      )
      .min(1)
      .max(4),
})

export type PaintAppRolesEnvironment = z.infer<
   typeof PaintAppRolesEnvironmentSchema
>

export const paintAppRoles = registerAs(
   "paintAppRoles",
   (): PaintAppRolesEnvironment => {
      const rawLoad: unknown = {
         roles:
            process.env.RA_APP_ROLES !== undefined
               ? JSON.parse(process.env.RA_APP_ROLES)
               : ["mainApp"],
      }
      const appRoles: PaintAppRolesEnvironment =
         PaintAppRolesEnvironmentSchema.parse(rawLoad)
      return appRoles
   },
)

const PaintQueueRedisEnvironmentSchema = z.object({
   host: z
      .union([
         z.ipv4(),
         z.literal("localhost"),
         z.hostname(),
         z.string().regex(z.regexes.domain),
      ])
      .default("localhost"),
   port: z.number().min(1024).max(65536).default(6379),
})
export type PaintQueueRedisEnvironment = z.infer<
   typeof PaintQueueRedisEnvironmentSchema
>
const PAINT_QUEUE_REDIS_YAML_CONFIG_FILENAME = "paintQueueRedis.yaml"

export const paintQueueRedis = registerAs(
   "paintQueueRedis",
   (): PaintQueueRedisEnvironment => {
      const fileName: string =
         process.env.RA_QUEUE_REDIS_YAML_FILE ??
         join(__dirname, PAINT_QUEUE_REDIS_YAML_CONFIG_FILENAME)
      const rawLoad: unknown = yaml.load(readFileSync(fileName, "utf8"))
      return PaintQueueRedisEnvironmentSchema.parse(rawLoad)
   },
)

const PaintQueueRetentionEnvironmentSchema = z.object({
   keepLogs: z.number().min(0).default(250),
   removeOnComplete: z
      .object({
         age: z.number().min(0),
      })
      .default({ age: 60 }),
   removeOnFail: z
      .object({
         age: z.number().min(0),
      })
      .default({ age: 365 }),
   jobDataSizeLimit: z
      .number()
      .min(512)
      .default(1024 * 1024),
})
export type PaintQueueRetentionEnvironment = z.infer<
   typeof PaintQueueRetentionEnvironmentSchema
>
const PAINT_QUEUE_RETENTION_YAML_CONFIG_FILENAME = "paintQueueRetention.yaml"

export const paintQueueRetention = registerAs(
   "paintQueueRetention",
   (): PaintQueueRetentionEnvironment => {
      const fileName: string =
         process.env.RA_QUEUE_RETENTION_YAML_FILE ??
         join(__dirname, PAINT_QUEUE_RETENTION_YAML_CONFIG_FILENAME)
      const rawLoad: unknown = yaml.load(readFileSync(fileName, "utf8"))
      return PaintQueueRetentionEnvironmentSchema.parse(rawLoad)
   },
)

const BullName: z.ZodString = z
   .string()
   .regex(/^[A-Za-z][A-Za-z0-9]+/)
   .min(3)

const PaintQueueNamesEnvironmentSchema = z.object({
   flowProducerNames: z.object({
      forJobSpecs: BullName,
   }),
   queueNames: z.object({
      toPaintParts: BullName,
      toGatherParts: BullName,
      toGatherTasks: BullName,
      toReceiveReplies: BullName,
   }),
})
export type PaintQueueNamesEnvironment = z.infer<
   typeof PaintQueueNamesEnvironmentSchema
>
const PAINT_QUEUE_NAMES_YAML_CONFIG_FILENAME = "paintQueueNames.yaml"

export const paintQueueNames = registerAs(
   "paintQueueNames",
   (): PaintQueueNamesEnvironment => {
      const fileName: string =
         process.env.RA_QUEUE_NAMES_YAML_FILE ??
         join(__dirname, PAINT_QUEUE_NAMES_YAML_CONFIG_FILENAME)
      const rawLoad: any = yaml.load(readFileSync(fileName, "utf8"))
      if (process.env.UNIQUE_ID === undefined) {
         throw new Error("UNIQUE_ID must be set to derive reply-to queue name!")
      }
      rawLoad.queueNames.toReceiveReplies = `reply-queue-${process.env.UNIQUE_ID}`
      return PaintQueueNamesEnvironmentSchema.parse(rawLoad)
   },
)

// =============================================================================
// IPFS / Blockstore
// =============================================================================

const IpfsEnvironmentSchema = z.object({
   blockstorePath: z
      .string()
      .default(resolve(homedir(), ".random-art", "blockstore")),
})

export type IpfsEnvironment = z.infer<typeof IpfsEnvironmentSchema>

export const ipfs = registerAs(
   "ipfs",
   (): IpfsEnvironment =>
      IpfsEnvironmentSchema.parse({
         blockstorePath: process.env.RA_BLOCKSTORE_PATH,
      }),
)

// =============================================================================
// Staging
// =============================================================================

const StagingEnvironmentSchema = z.object({
   stagerType: z.enum(["local", "s3"]).default("local"),
   localRootPath: z.string().default("/tmp/trigram-output"),
   s3Bucket: z.string().optional(),
   s3Region: z.string().default("us-east-1"),
   s3KeyPrefix: z.string().default("trigram-art"),
})

export type StagingEnvironment = z.infer<typeof StagingEnvironmentSchema>

export const staging = registerAs(
   "staging",
   (): StagingEnvironment =>
      StagingEnvironmentSchema.parse({
         stagerType: process.env.RA_STAGER_TYPE,
         localRootPath: process.env.RA_STAGING_ROOT,
         s3Bucket: process.env.RA_S3_BUCKET ?? process.env.S3_BUCKET,
         s3Region: process.env.RA_AWS_REGION ?? process.env.AWS_REGION,
         s3KeyPrefix: process.env.RA_S3_KEY_PREFIX,
      }),
)

// =============================================================================
// Painting / Gen model
// =============================================================================

const PaintingEnvironmentSchema = z.object({
   genModel: z.enum(["randomart", "genjs6"]).default("randomart"),
})

export type PaintingEnvironment = z.infer<typeof PaintingEnvironmentSchema>

export const painting = registerAs(
   "painting",
   (): PaintingEnvironment =>
      PaintingEnvironmentSchema.parse({
         genModel: process.env.RA_GEN_MODEL,
      }),
)
