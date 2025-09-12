import { DynamicModule } from "@nestjs/common"

type RootConduitModule<
   RootParams extends unknown[],
   RootMethodName extends string,
> = (new () => any) &
   Record<RootMethodName, (...args: RootParams) => DynamicModule>
type FeatureConduitModule<
   FeatureParams extends unknown[],
   FeatureMethodName extends string,
> = (new () => any) &
   Record<FeatureMethodName, (...args: FeatureParams) => DynamicModule>

type RootAndFeatureConduitModule<
   RootParams extends unknown[],
   FeatureParams extends unknown[],
   RootMethodName extends string,
   FeatureMethodName extends string,
> = (new () => any) &
   Record<RootMethodName, (...args: RootParams) => DynamicModule> &
   Record<FeatureMethodName, (...args: FeatureParams) => DynamicModule>
