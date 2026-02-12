/**
 * Worker Capabilities
 *
 * Defines the capability-based routing system for activity units.
 *
 * Problem:
 * - Some activities can run on any worker (HttpUpload - just needs network)
 * - Some activities need specific resources (FileStaging - needs a specific FileStore)
 * - Different deployments have different workers with different capabilities
 * - FlowProducer must route to workers that can satisfy activity requirements
 *
 * Solution:
 * - Activities declare abstract capability requirements (not concrete implementations)
 * - Workers advertise their capabilities via deployment configuration
 * - FlowProducer matches activities to capable workers at runtime
 * - Queue names encode capability sets for routing
 */

// ============================================================================
// Capability Tokens
// ============================================================================

/**
 * Abstract capability tokens.
 *
 * These are symbols that represent what an activity needs, not how it's provided.
 * The deployment configuration maps these to concrete implementations.
 */
export const Capabilities = {
   /**
    * Needs file storage capability.
    * Could be S3, GCS, local filesystem, etc.
    */
   FILE_STORE: Symbol("capability:file-store"),

   /**
    * Needs network access for HTTP operations.
    * Most workers have this, but some restricted environments might not.
    */
   NETWORK: Symbol("capability:network"),

   /**
    * Needs GPU access for rendering.
    * Only available on specific worker nodes.
    */
   GPU: Symbol("capability:gpu"),

   /**
    * Needs database access.
    */
   DATABASE: Symbol("capability:database"),

   /**
    * Needs cache access (Redis, etc.)
    */
   CACHE: Symbol("capability:cache"),
} as const

export type CapabilityToken = (typeof Capabilities)[keyof typeof Capabilities]

// ============================================================================
// Capability Requirements
// ============================================================================

/**
 * How urgently an activity needs a capability.
 */
export enum CapabilityNeed {
   /** Activity cannot function without this capability */
   REQUIRED = "required",
   /** Activity works better with this capability but can fall back */
   PREFERRED = "preferred",
   /** Activity can use this capability if available */
   OPTIONAL = "optional",
}

/**
 * A single capability requirement declaration.
 */
export interface CapabilityRequirement {
   /** The capability token */
   readonly capability: CapabilityToken
   /** How urgently needed */
   readonly need: CapabilityNeed
   /**
    * Optional qualifier to distinguish variants.
    * E.g., FILE_STORE with qualifier "primary" vs "archive"
    */
   readonly qualifier?: string
}

/**
 * Helper to create capability requirements.
 */
export const requires = {
   /** Activity requires this capability to function */
   required: (
      capability: CapabilityToken,
      qualifier?: string,
   ): CapabilityRequirement => ({
      capability,
      need: CapabilityNeed.REQUIRED,
      qualifier,
   }),

   /** Activity prefers this capability but can work without it */
   preferred: (
      capability: CapabilityToken,
      qualifier?: string,
   ): CapabilityRequirement => ({
      capability,
      need: CapabilityNeed.PREFERRED,
      qualifier,
   }),

   /** Activity can use this capability if available */
   optional: (
      capability: CapabilityToken,
      qualifier?: string,
   ): CapabilityRequirement => ({
      capability,
      need: CapabilityNeed.OPTIONAL,
      qualifier,
   }),
}

// ============================================================================
// Worker Advertisement
// ============================================================================

/**
 * A capability that a worker provides.
 *
 * Workers advertise their capabilities at startup. This information
 * is used by FlowProducer to route work appropriately.
 */
export interface ProvidedCapability {
   /** The capability token */
   readonly capability: CapabilityToken
   /**
    * Optional qualifier for this capability instance.
    * Allows a worker to provide multiple variants of the same capability.
    */
   readonly qualifier?: string
   /**
    * Implementation-specific metadata.
    * E.g., for FILE_STORE: { type: "s3", bucket: "art-renders", region: "us-east-1" }
    */
   readonly metadata?: Record<string, unknown>
}

/**
 * A worker's full capability advertisement.
 */
export interface WorkerCapabilitySet {
   /** Unique worker name (also the queue name) */
   readonly workerName: string
   /** Capabilities this worker provides */
   readonly capabilities: ProvidedCapability[]
   /**
    * Node affinity - if set, this worker can only run on specific nodes.
    * Used for capabilities that require local resources (GPU, local filesystem).
    */
   readonly nodeAffinity?: string
   /**
    * Maximum concurrent jobs this worker can handle.
    */
   readonly concurrency?: number
}

// ============================================================================
// Routing Configuration
// ============================================================================

/**
 * Configuration for how FlowProducer routes activities to workers.
 */
export interface RoutingConfiguration {
   /**
    * Available workers and their capabilities.
    * Loaded from deployment configuration.
    */
   readonly workers: WorkerCapabilitySet[]

   /**
    * Default worker for activities with no special requirements.
    */
   readonly defaultWorker: string

   /**
    * Origin queue pattern. {nodeId} is replaced with actual node ID.
    * Used for ORIGIN_ONLY activities.
    */
   readonly originQueuePattern: string
}

/**
 * Result of routing analysis.
 */
export interface RoutingDecision {
   /** The chosen worker queue name */
   readonly queueName: string
   /** Why this worker was chosen */
   readonly reason: string
   /** Workers that were considered but rejected */
   readonly rejected?: Array<{
      workerName: string
      reason: string
   }>
   /** Whether this is a fallback (preferred capability not available) */
   readonly isFallback: boolean
}

// ============================================================================
// Routing Logic
// ============================================================================

/**
 * Finds workers that can satisfy a set of capability requirements.
 */
export function findCapableWorkers(
   requirements: CapabilityRequirement[],
   workers: WorkerCapabilitySet[],
): WorkerCapabilitySet[] {
   const required = requirements.filter((r) => r.need === CapabilityNeed.REQUIRED)

   return workers.filter((worker) => {
      // Worker must satisfy all required capabilities
      for (const req of required) {
         const hasCapability = worker.capabilities.some(
            (cap) =>
               cap.capability === req.capability &&
               (req.qualifier === undefined || cap.qualifier === req.qualifier),
         )
         if (!hasCapability) {
            return false
         }
      }
      return true
   })
}

/**
 * Scores workers based on how well they match preferred/optional capabilities.
 */
export function scoreWorker(
   requirements: CapabilityRequirement[],
   worker: WorkerCapabilitySet,
): number {
   let score = 0

   for (const req of requirements) {
      const hasCapability = worker.capabilities.some(
         (cap) =>
            cap.capability === req.capability &&
            (req.qualifier === undefined || cap.qualifier === req.qualifier),
      )

      if (hasCapability) {
         switch (req.need) {
            case CapabilityNeed.REQUIRED:
               score += 100 // Must have, but doesn't differentiate
               break
            case CapabilityNeed.PREFERRED:
               score += 10 // Nice to have
               break
            case CapabilityNeed.OPTIONAL:
               score += 1 // Bonus points
               break
         }
      }
   }

   return score
}

/**
 * Select the best worker for a set of requirements.
 */
export function selectWorker(
   requirements: CapabilityRequirement[],
   config: RoutingConfiguration,
   contextHints?: {
      /** Prefer a specific qualifier for FILE_STORE capability */
      preferredFileStoreQualifier?: string
      /** Prefer workers on a specific node */
      preferredNode?: string
   },
): RoutingDecision {
   // Find all capable workers
   const capable = findCapableWorkers(requirements, config.workers)

   if (capable.length === 0) {
      // No capable workers - fall back to default
      return {
         queueName: config.defaultWorker,
         reason: "No workers satisfy required capabilities, using default",
         isFallback: true,
         rejected: config.workers.map((w) => ({
            workerName: w.workerName,
            reason: "Missing required capability",
         })),
      }
   }

   // Score each capable worker
   const scored = capable.map((worker) => ({
      worker,
      score: scoreWorker(requirements, worker),
   }))

   // Apply context hints as tie-breakers
   if (contextHints?.preferredFileStoreQualifier) {
      for (const entry of scored) {
         const hasPreferred = entry.worker.capabilities.some(
            (cap) =>
               cap.capability === Capabilities.FILE_STORE &&
               cap.qualifier === contextHints.preferredFileStoreQualifier,
         )
         if (hasPreferred) {
            entry.score += 50
         }
      }
   }

   if (contextHints?.preferredNode) {
      for (const entry of scored) {
         if (entry.worker.nodeAffinity === contextHints.preferredNode) {
            entry.score += 25
         }
      }
   }

   // Sort by score descending
   scored.sort((a, b) => b.score - a.score)

   const best = scored[0]
   return {
      queueName: best.worker.workerName,
      reason: `Best match with score ${best.score}`,
      isFallback: false,
   }
}

// ============================================================================
// Capability Checker
// ============================================================================

/**
 * Runtime capability checker for workers.
 *
 * Workers use this to verify they can handle incoming work.
 */
export class CapabilityChecker {
   constructor(private readonly provided: ProvidedCapability[]) {}

   /**
    * Check if this worker satisfies the given requirements.
    */
   satisfies(requirements: CapabilityRequirement[]): boolean {
      const required = requirements.filter((r) => r.need === CapabilityNeed.REQUIRED)

      for (const req of required) {
         const has = this.provided.some(
            (cap) =>
               cap.capability === req.capability &&
               (req.qualifier === undefined || cap.qualifier === req.qualifier),
         )
         if (!has) {
            return false
         }
      }
      return true
   }

   /**
    * Get the metadata for a specific capability.
    */
   getCapabilityMetadata(
      capability: CapabilityToken,
      qualifier?: string,
   ): Record<string, unknown> | undefined {
      const cap = this.provided.find(
         (c) =>
            c.capability === capability &&
            (qualifier === undefined || c.qualifier === qualifier),
      )
      return cap?.metadata
   }
}
