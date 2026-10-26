import type { AppDomainMemento } from "../sdk/index.js"
import type { LiteCIDString } from "../../messages/interface/index.js"
import type { PaintingTask, PlotDataNameRef } from "../messages/values/index.js"

/**
 * Project spec consumed by the RandomArt FlowProducer.
 *
 * Produced by PermutationsExpander after serializing PermutationTaskPaint to
 * AppDomainMemento. The FlowProducer never inspects the domain contents.
 *
 * Encoding and filename expression are NOT fields here. They are pipeline
 * configuration concerns — hardcoded from ConfigService at pipeline build time
 * for the initial implementation. Future pipeline variants that expose these
 * as caller-controlled values would add them here, but only when the pipeline
 * is configured to consume them. The pipeline's InitialContext type is the
 * authoritative definition of what fields a given deployment's spec must carry.
 */
export interface WorkerProjectSpec {
   /**
    * Project-level plugin domain — opaque to RandomArt.
    * Serialized by PermutationsExpander; carried through FlowProducer unchanged.
    */
   readonly projectDomain: AppDomainMemento

   /**
    * Catalog of friendly names to content addresses for all region maps
    * referenced by at least one task. CID validation deferred to FlowProducer.
    */
   readonly regionMapNames: Record<string, LiteCIDString>

   /**
    * One entry per painting task. The domainExtension carries the opaque
    * task-level plugin domain (PermutationTaskPaint serialized).
    */
   readonly taskUnits: ReadonlyArray<PaintingTask<AppDomainMemento, PlotDataNameRef>>
}
