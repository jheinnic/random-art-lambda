import { GenModelSeed } from "./index.js"
import { PlotDataCIDRef, PlotDataRef } from "./PlotDataRef.js"

export interface PaintingTask<
   DomainExtension extends object,
   RefPlotData extends PlotDataRef = PlotDataCIDRef,
> {
   /*
    * Seed data for the GenModel artifact that determines what is painted
    */
   readonly genSeed: GenModelSeed

   /**
    * Reference to what plane will be rendered, and at what resolution.
    */
   readonly plotDataRef: RefPlotData

   /**
    * A subgraph of domain model content belonging to this request's
    * submitting stakeholder, making it available for middleware
    * handlers that individual places in the paint pipeline.
    * submitted this instance, which may be used to do things like
    * store default file naming rules.  Your mileage may vary.
    *
    * It is recommended that this model contain any identifiers needed
    * to locate the semantic origin for a particular request in the
    * caller's own source entity domain model.   It will not be
    * echoed back with the ULIDs that RandomArt assigns each task,
    * but those assignments will maintain position-wise orientation
    * with the contents of the request DTO for which they were
    * allocated, so retaining this structure from the original
    * request provides the caller with a means to correlate
    * accurately.   It's appearance in RandomArt debug logging may
    * therefore also be valuable when investigation any potential
    * problem scenarios that are encountered.
    */
   readonly domainExtension: DomainExtension
}
