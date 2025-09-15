import { DynamicModule } from "@nestjs/common"

type RCM<in RootParams extends {}, in RootMethodName extends string> = {
   [K in RootMethodName]: (...args: [RootParams]) => DynamicModule
}

export type RootConduitModule<
   RootParams extends {},
   RootMethodName extends string,
> = (new () => any) & RCM<RootParams, RootMethodName>

export type FeatureConduitModule<
   FeatureParams extends unknown[],
   FeatureMethodName extends string,
> = (new () => any) &
   Record<FeatureMethodName, (...args: FeatureParams) => DynamicModule>

export type RootAndFeatureConduitModule<
   RootParams extends unknown[],
   FeatureParams extends unknown[],
   RootMethodName extends string,
   FeatureMethodName extends string,
> = (new () => any) &
   Record<RootMethodName, (...args: RootParams) => DynamicModule> &
   Record<FeatureMethodName, (...args: FeatureParams) => DynamicModule>
