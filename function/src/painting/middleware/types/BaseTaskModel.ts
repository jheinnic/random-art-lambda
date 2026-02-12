import {
   SeedEncodingUtil,
   type AnyAffixString,
   type CIDString,
   type PrefixString,
   type SuffixString,
} from "../../../messages/index.js"
import type { PaintTaskId } from "../../messages/values/PaintTaskId.js"
import type {
   GenModelSeed,
   SpatialBoundary,
   PaintResolution,
} from "../../messages/values/index.js"
import type { IRegionMap } from "../../../plotting/index.js"
import { Canvas } from "canvas"
import { PlotDataCIDRef } from "../../messages/values/PlotDataRef.js"

/**
 * Combined context for item-level middleware.
 *
 * This is a convenience type that combines readonly input with mutable state.
 * Handlers can work with this unified type, but the separation makes it clear
 * which fields are immutable vs which can be modified.
 */
// export type BaseItemModel1 = CombineObjects<
// CombineObjects<GenModelSeed, PlotDataBothRef>,
// PaintedCanvas
// >
export class BaseTaskModel {
   constructor(public readonly context: IBaseTaskModel) {}

   public get topBound(): number {
      return this.context.top
   }

   public get bottomBound(): number {
      return this.context.bottom
   }

   public get leftBound(): number {
      return this.context.left
   }

   public get rightBound(): number {
      return this.context.right
   }

   public get pixelWidth(): number {
      return this.context.width * this.context.size
   }

   public get pixelHeight(): number {
      return this.context.height * this.context.size
   }

   public get pixelSize(): number {
      return this.context.size
   }

   public get seedPrefix(): AnyAffixString {
      return SeedEncodingUtil.reuseTerm(this.context.seedPrefix)
   }

   public get seedSuffix(): SuffixString {
      return SeedEncodingUtil.reuseTerm(this.context.seedSuffix)
   }

   public get regionMapName(): string {
      return this.context.regionMapName ?? this.context.regionMapCID
   }

   public get regionMapCID(): string {
      return this.context.regionMapName ?? this.context.regionMapCID
   }
}

export interface IBaseTaskModel
   extends GenModelSeed,
      SpatialBoundary,
      PaintResolution,
      PlotDataCIDRef {
   taskId: PaintTaskId
}
