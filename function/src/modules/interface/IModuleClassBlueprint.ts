import { Bool, False, If, True } from "simplytyped"
import {
   FeatureConduitModule,
   RootAndFeatureConduitModule,
   RootConduitModule,
} from "./IConduitModule.js"
import { IDynamicModuleDirector } from "./IDynamicModuleBuilder.js"

export interface Context<
   RootParams extends unknown[] = unknown[],
   FeatureParams extends unknown[] = unknown[],
   RootMethodName extends string = string,
   FeatureMethodName extends string = string,
> {
   rootParams: RootParams
   featureParams: FeatureParams
   rootMethodName: RootMethodName
   featureMethodName: FeatureMethodName
}

type RootParams<C extends Context> =
   C extends Context<infer Params, any, any, any> ? Params : never

type RootMethodName<C extends Context> =
   C extends Context<any, any, infer Name, any> ? Name : never

type FeatureParams<C extends Context> =
   C extends Context<any, infer Params, any, any> ? Params : never

type FeatureMethodName<C extends Context> =
   C extends Context<any, any, any, infer Name> ? Name : never

type Variations<
   Initial extends {} = {},
   Root extends {} = Initial,
   Feature extends {} = Initial,
   Shared extends {} = Initial,
   RootFeature extends {} = Root & Feature,
   RootShared extends {} = Root & Shared,
   FeatureShared extends {} = Feature & Shared,
   RootFeatureShared extends {} = Root & Feature & Shared,
> = SharingVariations<
   RootVariations<
      FeatureVariations<Initial, Feature>,
      FeatureVariations<Root, RootFeature>
   >,
   RootVariations<
      FeatureVariations<Shared, FeatureShared>,
      FeatureVariations<RootShared, RootFeatureShared>
   >
>

type IfSharing<HasSharing extends Bool> = If<
   HasSharing,
   "hasSharing",
   "noSharing"
>
type IfRoot<HasRoot extends Bool> = If<HasRoot, "hasRoot", "noRoot">
type IfFeature<HasFeature extends Bool> = If<
   HasFeature,
   "hasFeature",
   "noFeature"
>
type Selection<
   HasRoot extends Bool,
   HasFeature extends Bool,
   HasSharing extends Bool,
   BuilderVariations extends Variations,
   FactoryVariations extends Variations,
> = {
   build: () => FactoryVariations[IfSharing<HasSharing>][IfRoot<HasRoot>][IfFeature<HasFeature>]
} & BuilderVariations[IfSharing<HasSharing>][IfRoot<HasRoot>][IfFeature<HasFeature>]

interface SharingVariations<
   NoSharing extends {} = {},
   HasSharing extends {} = {},
> {
   hasSharing: HasSharing
   noSharing: NoSharing
}

interface FeatureVariations<
   NoFeature extends {} = {},
   HasFeature extends {} = {},
> {
   hasFeature: HasFeature
   noFeature: NoFeature
}

interface RootVariations<NoRoot extends {} = {}, HasRoot extends {} = {}> {
   hasRoot: HasRoot
   noRoot: NoRoot
}

type IBlueprint<
   HasRoot extends Bool,
   HasFeature extends Bool,
   HasSharing extends Bool,
   BuilderVariations extends Variations,
   FactoryVariations extends Variations,
> = Selection<
   HasRoot,
   HasFeature,
   HasSharing,
   BuilderVariations,
   FactoryVariations
>

interface ForRootBuilder<
   C extends Context,
   HasFeature extends Bool,
   HasSharing extends Bool,
> {
   implementRootMethod: (
      body?: (...args: RootParams<C>) => IDynamicModuleDirector,
   ) => IModuleBaseClassBlueprint<C, True, HasFeature, HasSharing>
}

interface ForFeatureBuilder<
   C extends Context,
   HasRoot extends Bool,
   HasSharing extends Bool,
> {
   implementFeatureMethod: (
      body?: (...args: FeatureParams<C>) => IDynamicModuleDirector,
   ) => IModuleBaseClassBlueprint<C, HasRoot, True, HasSharing>
}

interface ForSharingBuilder<
   C extends Context,
   HasRoot extends Bool,
   HasFeature extends Bool,
> {
   implementFeatureRootImport: () => IModuleBaseClassBlueprint<
      C,
      HasRoot,
      HasFeature,
      True
   >
}

type BuilderVariations<C extends Context> = Variations<
   {},
   ForRootBuilder<C, False, False>,
   ForFeatureBuilder<C, False, False>,
   ForSharingBuilder<C, False, False>,
   ForRootBuilder<C, True, False> & ForFeatureBuilder<C, True, False>,
   ForRootBuilder<C, False, True> & ForSharingBuilder<C, True, False>,
   ForFeatureBuilder<C, False, True> & ForSharingBuilder<C, False, True>,
   ForRootBuilder<C, True, True> &
      ForFeatureBuilder<C, True, True> &
      ForSharingBuilder<C, True, True>
>

interface BuildRoot<C extends Context> {
   build: () => RootConduitModule<RootParams<C>, RootMethodName<C>>
}

interface BuildFeature<C extends Context> {
   build: () => FeatureConduitModule<FeatureParams<C>, FeatureMethodName<C>>
}

interface BuildBoth<C extends Context> {
   build: () => RootAndFeatureConduitModule<
      RootParams<C>,
      FeatureParams<C>,
      RootMethodName<C>,
      FeatureMethodName<C>
   >
}

type FactoryVariations<C extends Context> = Variations<
   {},
   BuildRoot<C>,
   BuildFeature<C>,
   {},
   BuildBoth<C>,
   BuildBoth<C>,
   BuildFeature<C>,
   BuildBoth<C>
>

export type IModuleBaseClassBlueprint<
   C extends Context,
   HasRoot extends Bool = False,
   HasFeature extends Bool = False,
   HasShared extends Bool = False,
> = IBlueprint<
   HasRoot,
   HasFeature,
   HasShared,
   BuilderVariations<C>,
   FactoryVariations<C>
>
