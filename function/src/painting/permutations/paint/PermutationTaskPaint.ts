import type { WorkerTaskDomain, WorkerProjectDomain } from "../../sdk/index.js"
import type {
   PermutationTaskDomain,
   PermutationProjectDomain,
} from "../sdk/index.js"

/**
 * Task-level paint model produced by PermutationsExpander.
 *
 * Extends WorkerTaskDomain to slot into the RandomArt SDK's plugin extension point.
 * Serialized to AppDomainMemento at the Permutations → RandomArt boundary.
 *
 * In the worker pipeline's expression context this appears under `app`:
 *   app.prefixIndex, app.suffixIndex, app.termPairIndex, app.termPairSourceIndex
 *   app.domain  — the app-specific contribution (absent for Trigram)
 */
export interface PermutationTaskPaint extends WorkerTaskDomain {
   readonly prefixIndex: number
   readonly suffixIndex: number
   readonly termPairIndex: number
   readonly termPairSourceIndex: number

   /**
    * App-specific domain contribution. Absent for Trigram (no app paint model).
    * ECDH would carry rangeNames, splitStrategy, batchId, etc. here.
    */
   readonly domain?: PermutationTaskDomain
}

/**
 * Project-level paint model produced by PermutationsExpander.
 *
 * Extends WorkerProjectDomain to slot into the RandomArt SDK's project plugin point.
 * Carries only what the Permutations layer knows within its own iteration —
 * the number of groups it processed. Global task and region map totals are
 * framework-level aggregates computed from the task list, not expander outputs.
 */
export interface PermutationProjectPaint extends WorkerProjectDomain {
   /** Number of permutation groups processed. */
   readonly termPairSourceCount: number

   /**
    * App-specific project domain contribution.
    * Absent for applications with no project-level expression context.
    */
   readonly domain?: PermutationProjectDomain
}
