export type ProjectCardinality = "single" | "multi"
export type GatherStyle = "notParallel" | "simpleGather" | "hybridGather"

abstract class AbstractFlowConfiguration {
   public abstract readonly projectCardinality: ProjectCardinality
   public abstract readonly gatherStyle: GatherStyle

   protected constructor() {}
}

abstract class SingleThreadedFlowConfiguration extends AbstractFlowConfiguration {
   public readonly gatherStyle: "notParallel" = "notParallel"

   protected constructor(
      /**
       * This queue is used to directly paint a task that has fewer than pixelsPerTask pixels.
       * The task associated with each job queued here may either belong to a multi-task or
       * define a single-task project.
       *
       * If this queue is not provided, small paint jobs will be assigned to a single
       * part and rendered through scatterPartsQueue/gatherPartsQueue.
       */
      readonly paintTaskQueue: string,
   ) {
      super()
   }
}

abstract class ParallelFlowConfiguration extends AbstractFlowConfiguration {
   protected constructor(
      /**
       * The number of pixels used as the ideal number to assign per part when breaking a paint
       * task into multiple parts, or 0 if tasks must never be split into parts.   When set to a
       * non-zero value, any paint job with a width greater than this value will be rejected since
       * at least one full row must fit into each part.  If the pixelPerTask is not an even multiple
       * a given task's width, parts will contain as many rows as possible without exceeding
       * pixelsPerTask.
       */
      readonly pixelsPerJob: number,

      /**
       * This queue is used to scatter jobs resulting from splitting a paint task into parts of
       * up to pixelsPerTask size each.  The tasks of a multi-task project or the single task of
       * a single-task project may be split here.  The named queue may belong to a worker pool or
       * a the origin node
       */
      readonly scatterPartsQueue: string,

      /**
       * This queue is used to assemble painted parts from single tasks and commit to a filestore.
       * It may be for a worker pool or the origin node.  The work pool can only gather to an S3
       * repository.
       *
       * If scatterPartsQueue is processed on the origin node, this queue must be as well,
       * otherwise it may be processed on the origin node or a worker pool node.
       */
      readonly gatherPartsQueue: string,
   ) {
      super()
   }
}

abstract class SimpleGatherFlowConfiguration extends ParallelFlowConfiguration {
   public readonly gatherStyle: "simpleGather" = "simpleGather"

   protected constructor(
      pixelsPerJob: number,
      scatterPartsQueue: string,
      gatherPartsQueue: string,
   ) {
      super(pixelsPerJob, scatterPartsQueue, gatherPartsQueue)
   }
}

abstract class HybridGatherFlowConfiguration extends ParallelFlowConfiguration {
   public readonly gatherStyle: "hybridGather" = "hybridGather"

   protected constructor(
      pixelsPerJob: number,
      scatterPartsQueue: string,
      gatherPartsQueue: string,
      public readonly postTaskQueue: string,
   ) {
      super(pixelsPerJob, scatterPartsQueue, gatherPartsQueue)
   }
}

export class MultiTaskSimpleGatherFlowConfiguration extends SimpleGatherFlowConfiguration {
   public readonly projectCardinality: "multi" = "multi"

   constructor(
      pixelsPerJob: number,
      scatterPartsPerQueue: string,
      gatherPartsQueue: string,
      public readonly gatherTasksQueue: string,
   ) {
      super(pixelsPerJob, scatterPartsPerQueue, gatherPartsQueue)
   }
}

export class MultiTaskSingleThreadFlowConfiguration extends SingleThreadedFlowConfiguration {
   public readonly projectCardinality: "multi" = "multi"

   constructor(
      paintTaskQueue: string,
      public readonly gatherTasksQueue: string,
   ) {
      super(paintTaskQueue)
   }
}

export class MultiTaskHybridGatherFlowConfiguration extends HybridGatherFlowConfiguration {
   public readonly projectCardinality: "multi" = "multi"

   constructor(
      pixelsPerJob: number,
      scatterPartsPerQueue: string,
      gatherPartsQueue: string,
      postTaskQueue: string,
      public readonly gatherTasksQueue: string,
   ) {
      super(pixelsPerJob, scatterPartsPerQueue, gatherPartsQueue, postTaskQueue)
   }
}

export class SingleTaskSimpleGatherFlowConfiguration extends SimpleGatherFlowConfiguration {
   public readonly projectCardinality: "single" = "single"

   // eslint-disable-next-line @typescript-eslint/no-useless-constructor
   constructor(
      pixelsPerJob: number,
      scatterPartsPerQueue: string,
      gatherPartsQueue: string,
   ) {
      super(pixelsPerJob, scatterPartsPerQueue, gatherPartsQueue)
   }
}

export class SingleTaskSingleThreadFlowConfiguration extends SingleThreadedFlowConfiguration {
   public readonly projectCardinality: "single" = "single"

   // eslint-disable-next-line @typescript-eslint/no-useless-constructor
   constructor(paintTaskQueue: string) {
      super(paintTaskQueue)
   }
}

export class SingleTaskHybridGatherFlowConfiguration extends HybridGatherFlowConfiguration {
   public readonly projectCardinality: "single" = "single"

   // eslint-disable-next-line @typescript-eslint/no-useless-constructor
   constructor(
      pixelsPerJob: number,
      scatterPartsPerQueue: string,
      gatherPartsQueue: string,
      postTaskQueue: string,
   ) {
      super(pixelsPerJob, scatterPartsPerQueue, gatherPartsQueue, postTaskQueue)
   }
}

export type FlowConfiguration =
   | MultiTaskFlowConfiguration
   | SingleTaskFlowConfiguration

export type MultiTaskFlowConfiguration =
   | MultiTaskSimpleGatherFlowConfiguration
   | MultiTaskHybridGatherFlowConfiguration
   | MultiTaskSingleThreadFlowConfiguration
export type SingleTaskFlowConfiguration =
   | SingleTaskSimpleGatherFlowConfiguration
   | SingleTaskHybridGatherFlowConfiguration
   | SingleTaskSingleThreadFlowConfiguration

// TODO:
// If a receiving worker has been configured somewhere with knowledge about the use cases that
// will receive images, this configuration must inform the flow producer to expect that delegation.
// TODO:
// If a receiving worker will need to setup and resolve an expression context to find out what
// file it is expected to write to or what secondary service it should notify, that comes from
// config, not caller input.
// Callers can only provide configuration for a customization if this component has been
// configured to anticipate that possibility.
// TODO:
// CLI use cases may support staging to a local filesystem or to S3, in which case it will be necessary to
// examine the configuration content in order for the application to determine whether it must:
// -- Perform gathering at the Origin to satisfy local filesystem staging capability
// -- Perform gathering at the Origin to configure S3 repository staging not provided by any known
//    worker pool queue
// -- Perform gathering at a Work Pool queue because a Work Pool exists with required S3 access, and
//    the local origin would lack S3 write permission if it were to be used.
// will often need routing back to a specific recipient queue where that node
// has been set up with a Queue-to-Observable publishing component that will route replies back
// to the CLI.
// -- The gathering component must expect to exist
