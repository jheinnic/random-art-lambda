import { regionMapRepositoryAlias } from "./../../plotting/protobuf/di/Providers"
import {
   PlottingModuleTypes,
   I_REGION_MAP_REPOSITORY,
} from "./../../plotting/di/Types"
import { StringFormatParams } from "zod/v4/core"
import { Subject } from "rxjs"
export interface InitialPaintInjection {
   RegionMapRepo: typeof PlottingModuleTypes.IRegionMapRepository
}

export interface BaseRequest {
   rootId: string
   parentId: string
}

export interface DefaultPathLabel<Optional extends Boolean = false> {
   readonly defaultPathLabel: Optional extends true
      ? string | undefined
      : string
}

export interface DefaultPlotLabel<Optional extends Boolean = false> {
   readonly defaultPlotLabel: Optional extends true
      ? string | undefined
      : string
}

export interface PlotSelections {
   readonly plotSelections: {
      readonly [K in string]: string[]
   }
}

export interface PathExpressions {
   readonly pathExpressions: {
      readonly [K in string]: string
   }
}

export interface ReturnChannel {
   readonly returnChannel: Subject<Buffer>
}

export interface TenantAssociated {
   readonly tenantUuid: string
}

export interface IEngineBuilder<
   RequestMessage = BaseRequest,
   AppInjection = InitialPaintInjection,
   AppConfig = {},
   TaskContext = {},
   TaskConfig = {},
   JobContext = {},
   JobConfig = {},
   PostContext = {},
   PostConfig = {},
> {}
