import { DynamicModule } from "@nestjs/common"

export type RootConduitModule<
   RootParams extends unknown[],
   RootMethodName extends string,
> = (new () => any) &
   Record<RootMethodName, (...args: RootParams) => DynamicModule>
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
