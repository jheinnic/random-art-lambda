export class FlowConfiguration {
   constructor(
      readonly scatterPartsQueue: string,
      readonly pixelsPerTask: number,

      /**
       * This queue is used to assemble painted parts and commit to a filestore.  It
       * may be in the work pool or local.  The work pool can only gather to an S3
       * repository.
       */
      readonly gatherPartsQueue: string,

      /**
       * This queue is an origin destination where a worker will be called after all
       * per task files have been committed and the entire project fileset is ready
       */
      readonly gatherProjectQueue: string,

      /**
       * This queue is available when gatherParts is done to S3 at the Worker pool and
       * the application also wants to stage copies in a local filesystem at the origin.
       * The gatherPartsQueue must be a work pool destination in order to set this to
       * an origin destination queue.
       */
      readonly gatherTasksQueue?: string,

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
   ) {}
}
