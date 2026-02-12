import { STAGING_POST_PAINT_STRATEGY } from "./Constants"
/**
 * A built-in or plugged in strategy for an initiator channel.  Configuration for
 * the ResultHandlingConfig is derived from this by the abstraction owner, much
 * like the way built-in seed models are derived from their extension sources.
 */
export interface PostProcessConfig {
   readonly processType: string
}

export interface StagingPostProcessConfig extends PostProcessConfig {
   readonly processType: STAGING_POST_PAINT_STRATEGY
   readonly stageToPath: string
}

export type KnownPostProcessConfig = StagingPostProcessConfig
