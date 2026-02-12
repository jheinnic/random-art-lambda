import { InjectionToken } from "@nestjs/common"

export interface FsBlockstoreConfiguration {
   readonly rootPath: string
   readonly cacheSize: number
   readonly readOnly: boolean
}

export interface ModuleInjectionConfiguration {
   readonly injectToken: InjectionToken
}

export type ModuleConfiguration = FsBlockstoreConfiguration &
   ModuleInjectionConfiguration
