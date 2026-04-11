/**
 * Tenant-Scoped Worker Routing
 *
 * Multi-tenant deployments require:
 * 1. Credential isolation - each tenant's workers have only that tenant's creds
 * 2. Queue segregation - tasks route to tenant-specific queues
 * 3. Worker pools per tenant - separate processes for security
 * 4. Redis isolation - job payloads contain tenant data
 *
 * IMPORTANT: Redis Isolation Strategies
 * -------------------------------------
 * "Shared workers" is a misnomer if Redis is shared - workers still see
 * tenant data in job payloads. True multi-tenant isolation requires one of:
 *
 * A) Separate Redis per tenant (FULL_ISOLATION)
 *    - Each tenant has dedicated Redis instance
 *    - Workers connect only to their tenant's Redis
 *    - Strongest isolation, highest cost
 *
 * B) Redis ACLs with tenant key prefixes (ACL_ISOLATION)
 *    - Single Redis instance, tenant-prefixed keys
 *    - Redis 6+ ACLs restrict each worker to its tenant's keys
 *    - Moderate isolation, requires Redis 6+
 *
 * C) Encrypted payloads (ENCRYPTED_PAYLOADS)
 *    - Shared Redis, but payloads encrypted with tenant KMS keys
 *    - Workers can only decrypt payloads for tenants they serve
 *    - Allows shared infrastructure with data protection
 *
 * D) No isolation (SHARED) - Only for non-sensitive workloads
 *    - Shared Redis, shared workers
 *    - Only appropriate when job payloads contain no tenant secrets
 *
 * This module extends the capability system with tenant awareness.
 *
 * Architecture:
 * ```
 * FlowProducer
 *    │
 *    ├── Task { tenantId: "acme", ... }
 *    │        │
 *    │        ▼
 *    │   selectTenantWorker()
 *    │        │
 *    │        ▼
 *    └──► Queue: "painting.worker.acme.s3"
 *              │
 *              ▼
 *         Worker Pool (Acme)
 *         - Has Acme's AWS creds
 *         - Writes to acme-art bucket
 * ```
 */

import type {
   CapabilityRequirement,
   WorkerCapabilitySet,
   RoutingDecision,
} from "./WorkerCapabilities.js"
import { findCapableWorkers, scoreWorker } from "./WorkerCapabilities.js"

// ============================================================================
// Tenant Identity
// ============================================================================

/**
 * Tenant identifier.
 * This is the key that links tasks to tenant-specific resources.
 */
export type TenantId = string & { readonly __brand: unique symbol }

export function asTenantId(id: string): TenantId {
   return id as TenantId
}

// ============================================================================
// Redis Isolation Strategy
// ============================================================================

/**
 * How tenant data is isolated in Redis.
 *
 * This is a deployment-level decision that affects the entire system,
 * not a per-activity setting.
 */
export enum RedisIsolationStrategy {
   /**
    * Separate Redis instance per tenant.
    * Workers connect to tenant-specific Redis.
    * Strongest isolation, highest infrastructure cost.
    */
   FULL_ISOLATION = "full_isolation",

   /**
    * Single Redis with tenant-prefixed keys and ACLs.
    * Requires Redis 6+ with ACL support.
    * Each worker authenticates with tenant-scoped credentials.
    */
   ACL_ISOLATION = "acl_isolation",

   /**
    * Shared Redis, but job payloads encrypted with tenant KMS keys.
    * Workers can only process jobs they can decrypt.
    */
   ENCRYPTED_PAYLOADS = "encrypted_payloads",

   /**
    * No isolation - shared Redis, unencrypted payloads.
    * ONLY appropriate when payloads contain no sensitive data.
    */
   SHARED = "shared",
}

/**
 * Redis connection configuration per tenant.
 * Used with FULL_ISOLATION or ACL_ISOLATION strategies.
 */
export interface TenantRedisConfig {
   /** Tenant this config applies to */
   readonly tenantId: TenantId
   /** Redis connection URL */
   readonly redisUrl: string
   /** Optional: Redis username for ACL auth */
   readonly username?: string
   /** Optional: Redis password or ACL token */
   readonly password?: string
   /** Optional: Key prefix for this tenant (ACL_ISOLATION) */
   readonly keyPrefix?: string
}

// ============================================================================
// Tenant-Scoped Worker Configuration
// ============================================================================

/**
 * Extends WorkerCapabilitySet with tenant ownership.
 */
export interface TenantWorkerConfig extends WorkerCapabilitySet {
   /**
    * The tenant this worker pool serves.
    * If undefined, this is a shared worker (for non-tenant-specific work).
    */
   readonly tenantId?: TenantId

   /**
    * Whether this worker can handle work from any tenant.
    *
    * WARNING: Only safe when BOTH conditions are met:
    * 1. Activities don't require tenant credentials (TenantIsolationLevel.NONE)
    * 2. Job payloads don't contain sensitive tenant data, OR
    *    Redis isolation strategy is ENCRYPTED_PAYLOADS
    */
   readonly isShared?: boolean

   /**
    * Redis connection for this worker.
    * Required for FULL_ISOLATION strategy (each tenant has own Redis).
    * Optional for ACL_ISOLATION (uses shared Redis with tenant credentials).
    */
   readonly redisConfig?: TenantRedisConfig
}

/**
 * Multi-tenant routing configuration.
 */
export interface TenantRoutingConfiguration {
   /**
    * All available workers with tenant assignments.
    */
   readonly workers: TenantWorkerConfig[]

   /**
    * Queue name pattern for tenant workers.
    * Placeholders:
    * - {tenantId} - replaced with tenant ID
    * - {capability} - replaced with primary capability name
    *
    * @example "painting.worker.{tenantId}.{capability}"
    */
   readonly tenantQueuePattern: string

   /**
    * Queue name for shared workers (non-tenant-specific).
    */
   readonly sharedQueuePattern: string

   /**
    * Origin queue pattern for tasks that must return to origin.
    */
   readonly originQueuePattern: string

   /**
    * Fallback behavior when no tenant-specific worker exists.
    */
   readonly missingTenantBehavior: MissingTenantBehavior

   /**
    * Redis isolation strategy for this deployment.
    * Determines how tenant data is protected in the queue infrastructure.
    */
   readonly redisIsolation: RedisIsolationStrategy

   /**
    * Default Redis config for SHARED or ACL_ISOLATION strategies.
    * For FULL_ISOLATION, each TenantWorkerConfig has its own redisConfig.
    */
   readonly defaultRedisConfig?: {
      readonly redisUrl: string
      readonly username?: string
      readonly password?: string
   }

   /**
    * Per-tenant Redis configs.
    * Required for FULL_ISOLATION, optional for ACL_ISOLATION.
    */
   readonly tenantRedisConfigs?: TenantRedisConfig[]
}

export enum MissingTenantBehavior {
   /** Reject the task with an error */
   REJECT = "reject",
   /** Route to a shared worker pool (if activity allows) */
   USE_SHARED = "use_shared",
   /** Queue to a provisioning queue that triggers worker spinup */
   PROVISION = "provision",
}

// ============================================================================
// Task Context
// ============================================================================

/**
 * Tenant context extracted from a task.
 * FlowProducer extracts this from the incoming request.
 */
export interface TaskTenantContext {
   /** The tenant making the request */
   readonly tenantId: TenantId
   /** Whether this task requires tenant-isolated execution */
   readonly requiresIsolation: boolean
   /** Optional: preferred worker pool if multiple exist for this tenant */
   readonly preferredPool?: string
}

// ============================================================================
// Routing Logic
// ============================================================================

/**
 * Result of tenant-aware routing.
 */
export interface TenantRoutingDecision extends RoutingDecision {
   /** The tenant being routed */
   readonly tenantId: TenantId
   /** Whether using a shared vs tenant-specific worker */
   readonly isSharedWorker: boolean
   /** If provisioning is needed, the provisioning queue */
   readonly provisioningQueue?: string
}

/**
 * Select the appropriate worker for a tenant's task.
 */
export function selectTenantWorker(
   tenantContext: TaskTenantContext,
   requirements: CapabilityRequirement[],
   config: TenantRoutingConfiguration,
): TenantRoutingDecision {
   const { tenantId, requiresIsolation } = tenantContext

   // Find workers that belong to this tenant
   const tenantWorkers = config.workers.filter(
      (w) => w.tenantId === tenantId && !w.isShared,
   )

   // Find shared workers (if isolation not required)
   const sharedWorkers = !requiresIsolation
      ? config.workers.filter((w) => w.isShared)
      : []

   // First, try tenant-specific workers that satisfy capabilities
   const capableTenantWorkers = findCapableWorkers(
      requirements,
      tenantWorkers,
   ) as TenantWorkerConfig[]

   if (capableTenantWorkers.length > 0) {
      // Score and select best tenant worker
      const scored = capableTenantWorkers.map((w) => ({
         worker: w,
         score: scoreWorker(requirements, w),
      }))
      scored.sort((a, b) => b.score - a.score)

      const best = scored[0]
      return {
         tenantId,
         queueName: best.worker.workerName,
         reason: `Tenant-specific worker with score ${best.score}`,
         isFallback: false,
         isSharedWorker: false,
      }
   }

   // No tenant worker available - check fallback behavior
   switch (config.missingTenantBehavior) {
      case MissingTenantBehavior.REJECT:
         return {
            tenantId,
            queueName: "",
            reason: `No worker configured for tenant ${tenantId}`,
            isFallback: true,
            isSharedWorker: false,
         }

      case MissingTenantBehavior.USE_SHARED:
         if (requiresIsolation) {
            return {
               tenantId,
               queueName: "",
               reason: `Task requires isolation but no tenant worker exists for ${tenantId}`,
               isFallback: true,
               isSharedWorker: false,
            }
         }

         const capableSharedWorkers = findCapableWorkers(
            requirements,
            sharedWorkers,
         ) as TenantWorkerConfig[]

         if (capableSharedWorkers.length > 0) {
            const scored = capableSharedWorkers.map((w) => ({
               worker: w,
               score: scoreWorker(requirements, w),
            }))
            scored.sort((a, b) => b.score - a.score)

            const best = scored[0]
            return {
               tenantId,
               queueName: best.worker.workerName,
               reason: `Using shared worker (no tenant-specific worker for ${tenantId})`,
               isFallback: true,
               isSharedWorker: true,
            }
         }

         return {
            tenantId,
            queueName: "",
            reason: `No capable worker (tenant or shared) for ${tenantId}`,
            isFallback: true,
            isSharedWorker: false,
         }

      case MissingTenantBehavior.PROVISION:
         // Return a provisioning queue - external system handles worker spinup
         const provisioningQueue = config.tenantQueuePattern
            .replace("{tenantId}", tenantId)
            .replace("{capability}", "provision")

         return {
            tenantId,
            queueName: provisioningQueue,
            reason: `Queued for provisioning - no worker for ${tenantId}`,
            isFallback: true,
            isSharedWorker: false,
            provisioningQueue,
         }
   }
}

// ============================================================================
// Queue Name Helpers
// ============================================================================

/**
 * Generate a tenant-specific queue name.
 */
export function getTenantQueueName(
   pattern: string,
   tenantId: TenantId,
   capabilityHint?: string,
): string {
   return pattern
      .replace("{tenantId}", tenantId)
      .replace("{capability}", capabilityHint ?? "default")
}

/**
 * Parse a queue name to extract tenant info.
 */
export function parseTenantQueueName(
   queueName: string,
   pattern: string,
): { tenantId?: TenantId; capability?: string } | null {
   // Convert pattern to regex
   const regexStr = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape regex chars
      .replace("\\{tenantId\\}", "(?<tenantId>[^.]+)")
      .replace("\\{capability\\}", "(?<capability>[^.]+)")

   const match = queueName.match(new RegExp(`^${regexStr}$`))
   if (!match?.groups) return null

   return {
      tenantId: match.groups.tenantId
         ? asTenantId(match.groups.tenantId)
         : undefined,
      capability: match.groups.capability,
   }
}

// ============================================================================
// Activity Tenant Requirements
// ============================================================================

/**
 * Declares whether an activity requires tenant isolation.
 *
 * Use in @ActivityUnit metadata to indicate security requirements.
 */
export enum TenantIsolationLevel {
   /**
    * Activity handles tenant credentials - MUST run on tenant-specific worker.
    * Examples: S3 writes to tenant bucket, database writes to tenant schema
    */
   REQUIRED = "required",

   /**
    * Activity prefers tenant worker but can use shared if unavailable.
    * Examples: Logging with tenant context, metrics tagging
    */
   PREFERRED = "preferred",

   /**
    * Activity is tenant-agnostic - can safely run on shared workers.
    * Examples: Image processing, HTTP uploads to pre-signed URLs
    */
   NONE = "none",
}

/**
 * Helper to determine if a task needs isolation based on activities.
 */
export function requiresTenantIsolation(
   activityIsolationLevels: TenantIsolationLevel[],
): boolean {
   return activityIsolationLevels.some(
      (level) => level === TenantIsolationLevel.REQUIRED,
   )
}

// ============================================================================
// Example Configuration
// ============================================================================

/**
 * Example multi-tenant configuration.
 *
 * @example
 * ```typescript
 * const config: TenantRoutingConfiguration = {
 *    workers: [
 *       // Acme Corp's dedicated workers
 *       {
 *          workerName: "painting.worker.acme.s3",
 *          tenantId: asTenantId("acme"),
 *          capabilities: [
 *             { capability: Capabilities.FILE_STORE, qualifier: "s3",
 *               metadata: { bucket: "acme-art-renders", region: "us-east-1" } }
 *          ],
 *       },
 *       // Globex's dedicated workers
 *       {
 *          workerName: "painting.worker.globex.s3",
 *          tenantId: asTenantId("globex"),
 *          capabilities: [
 *             { capability: Capabilities.FILE_STORE, qualifier: "s3",
 *               metadata: { bucket: "globex-renders", region: "eu-west-1" } }
 *          ],
 *       },
 *       // Shared workers for non-credential work
 *       {
 *          workerName: "painting.worker.shared.http",
 *          isShared: true,
 *          capabilities: [
 *             { capability: Capabilities.NETWORK }
 *          ],
 *       },
 *    ],
 *    tenantQueuePattern: "painting.worker.{tenantId}.{capability}",
 *    sharedQueuePattern: "painting.worker.shared.{capability}",
 *    originQueuePattern: "painting.origin.{nodeId}",
 *    missingTenantBehavior: MissingTenantBehavior.REJECT,
 * }
 * ```
 */
export const exampleTenantConfig = {} // Type-only example above
