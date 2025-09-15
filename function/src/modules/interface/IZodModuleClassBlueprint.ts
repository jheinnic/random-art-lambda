import { DefaultDirector } from "./IModuleBaseClassBlueprint.js"
import { IZodModuleClassBuilder } from "./IZodModuleClassBuilder.js"
import { DynamicModule } from "@nestjs/common"

export interface IZodModuleClassBlueprint<
   in out M extends string,
   out B extends IZodModuleClassBuilder<M> = IZodModuleClassBlueprint<
      M,
      IZodModuleClassBlueprint<M, any>
   >,
> extends IZodModuleClassBuilder<M, B> {
   build: <External extends {}, Internal extends {}>() => BaseZodModule<
      External,
      Internal,
      M
   >
}

interface DynamicModulePart<in Params extends {}> {
   forRoot: (...args: [Params]) => DynamicModule
}

type ExtensionPart<in Params extends {}, in MethodName extends string> = {
   [K in MethodName]: (...args: [Params]) => DefaultDirector
}

export type BaseZodModule<
   ExternalConfig extends {},
   InternalConfig extends {},
   ExtensionMethodName extends string,
> = (new () => any) &
   DynamicModulePart<ExternalConfig> &
   ExtensionPart<InternalConfig, ExtensionMethodName>
