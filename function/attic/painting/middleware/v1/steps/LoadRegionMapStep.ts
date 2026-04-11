import { Injectable, Inject } from "@nestjs/common"
import type { CID } from "multiformats"

import {
   MiddlewareStep,
   FromContext,
} from "../annotations/MiddlewareAnnotations.js"
import type { IMiddlewareStep } from "../components/AnnotatedChainExecutor.js"
import type { IRegionMap, IRegionMapRepository } from "../../../plotting/interface/index.js"
import { CIDUtil } from "../../utility/CIDUtil.js"
import type { CIDString } from "../../../messages/interface/NamedValues.js"
import { PlottingModuleTypes } from "../../../plotting/di/Types.js"

/**
 * Context fields this step REQUIRES to execute
 */
export interface RequiresPlotRef {
   regionMapCID: CIDString
}

/**
 * Context fields this step PROVIDES after execution
 */
export interface ProvidesRegionMap {
   regionMap: IRegionMap
   parsedCID: CID
}

/**
 * Middleware step that loads a RegionMap from a CID reference.
 *
 * The @MiddlewareStep decorator registers this with the middleware registry,
 * declaring what it needs (regionMapCID) and what it provides (regionMap, parsedCID).
 *
 * The @FromContext decorator marks fields that should be injected from the
 * accumulated context before execute() is called.
 */
@Injectable()
@MiddlewareStep({
   provides: ["regionMap", "parsedCID"],
   requires: ["regionMapCID"],
   name: "LoadRegionMap",
})
export class LoadRegionMapStep
   implements IMiddlewareStep<RequiresPlotRef, ProvidesRegionMap>
{
   /**
    * This field will be automatically populated from the context
    * before execute() is called.
    */
   @FromContext("regionMapCID")
   private regionMapCID!: CIDString

   constructor(
      @Inject(PlottingModuleTypes.IRegionMapRepository)
      private readonly repository: IRegionMapRepository,
   ) {}

   async execute(_context: RequiresPlotRef): Promise<ProvidesRegionMap> {
      // Parse the CID string into a CID object
      const parsedCID: CID = CIDUtil.parseCID(this.regionMapCID)

      // Load the region map from the repository
      const regionMap: IRegionMap = await this.repository.load(parsedCID)

      // Return what we provide - these get merged into the context
      return {
         regionMap,
         parsedCID,
      }
   }
}
