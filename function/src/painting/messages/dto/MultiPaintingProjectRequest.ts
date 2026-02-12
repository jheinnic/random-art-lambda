import { LiteCIDString } from "../../../messages/interface/index.js"
import { PaintingTask, PlotDataNameRef } from "../values/index.js"

export interface MultiTaskRequestModel<
   PaintingDomain extends object,
   ProjectDomain extends object,
> {
   // projectId: ULIDString

   /**
    * A model owned by the task origin with any information it needs later to group
    * individual paint tasks, filter post-rendering, assign names, etc.   Random Art
    * will return the ULID it assigns when it receives this request.
    *
    * This domain model should have anything a stakeholder at the source of this
    * request that might be unaware of the assigned ULID would need echoed back to
    * identify the source and purpose of this request.  Callers should still take
    * notice of retaining the ULID as key for making future API calls about this
    * request, which will not use elements from this domain model as identification
    * arguments.
    */
   projectDomain: ProjectDomain
   /**
    * A small local catalog of friendly names to the content addresses
    * of all standard plotting point sets used by at least one paint
    * request from this workspace.  Names are informal and often will
    * not resolve to the same artifact if reused between any two run
    * RandomArt Project submissions.
    *
    * Uses LiteCIDString - CID format validation is deferred to the FlowProducer.
    */
   regionMapNames: Record<string, LiteCIDString>

   /**
    * Pairs of cross-domain model pairs.  One side has the random
    * art engine's configuration that informs about how to
    * play out a rendering task.  The other side is a subgraph
    * of the originating domain model that it submitted with each
    * task for context with generating file names, grouping
    * rendered outputs, and deciding what to cache beyond
    * completion.
    */
   taskUnits: Array<PaintingTask<PaintingDomain, PlotDataNameRef>>
}
