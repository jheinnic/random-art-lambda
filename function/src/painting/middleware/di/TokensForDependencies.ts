import type { Logger, InjectionToken } from "@nestjs/common"

/**
 * Extract dependency injection tokens for constructor parameters after params and logger
 *
 * All middleware must follow the constructor signature:
 * constructor(params: ParamsType, logger: Logger, ...dependencies)
 *
 * Note: Logger and all dependencies are mandatory (not optional) since they are
 * always provided by the DI framework.
 */

export type TokensForDependencies<M> = M extends new (
   params: any,
   logger: Logger,
   ...deps: infer Deps
) => any
   ? Deps extends []
      ? never // No dependencies after logger
      : {
           [K in keyof Deps]: InjectionToken<Deps[K]>
        }
   : never
