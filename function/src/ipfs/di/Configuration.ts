import { InjectionToken } from "@nestjs/common"

export interface FsBlockstoreConfiguration {
   readonly rootPath: string
   readonly cacheSize: number
}

export interface ModuleInjectionConfiguration {
   readonly injectToken: InjectionToken
}

export type ModuleConfiguration = FsBlockstoreConfiguration &
   ModuleInjectionConfiguration
