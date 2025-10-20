import { Bool, False, If, True } from "simplytyped"
import {
   FeatureConduitModule,
   RootAndFeatureConduitModule,
   RootConduitModule,
} from "./IConduitModule.js"
import { DefaultDirector } from "./IDynamicModuleBuilder.js"

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

type RootParams<C extends Context> = C extends { rootParams: infer Params }
   ? Params
   : never

type RootMethodName<C extends Context> = C extends {
   rootMethodName: infer Name
}
   ? Name
   : never

type FeatureParams<C extends Context> = C extends {
   featureParams: infer Params
}
   ? Params
   : never

type FeatureMethodName<C extends Context> = C extends {
   featureMethodName: infer Name
}
   ? Name
   : never

type Variations<
   Initial extends {} = {},
   Root extends {} = {},
   Feature extends {} = {},
   Shared extends {} = {},
   RootFeature extends {} = {},
   RootShared extends {} = {},
   FeatureShared extends {} = {},
   RootFeatureShared extends {} = {},
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
   Options extends Variations,
> = Options[IfSharing<HasSharing>][IfRoot<HasRoot>][IfFeature<HasFeature>]

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
   C extends Context,
   HasRoot extends Bool,
   HasFeature extends Bool,
   HasSharing extends Bool,
   Assembler extends Variations,
> = If<HasRoot, {}, ForRootBuilder<C, HasFeature, HasSharing, Assembler>> &
   If<HasFeature, {}, ForFeatureBuilder<C, HasRoot, HasSharing, Assembler>> &
   If<HasSharing, {}, ForSharingBuilder<C, HasRoot, HasFeature, Assembler>> &
   Selection<HasRoot, HasFeature, HasSharing, Assembler>

interface ForRootBuilder<
   C extends Context,
   HasFeature extends Bool,
   HasSharing extends Bool,
   Assembler extends Variations,
> {
   implementRootMethod: (
      body?: (...args: RootParams<C>) => DefaultDirector,
   ) => IBlueprint<C, True, HasFeature, HasSharing, Assembler>
}

interface ForFeatureBuilder<
   C extends Context,
   HasRoot extends Bool,
   HasSharing extends Bool,
   Assembler extends Variations,
> {
   implementFeatureMethod: (
      body?: (...args: FeatureParams<C>) => DefaultDirector,
   ) => IBlueprint<C, HasRoot, True, HasSharing, Assembler>
}

interface ForSharingBuilder<
   C extends Context,
   HasRoot extends Bool,
   HasFeature extends Bool,
   Assembler extends Variations,
> {
   implementFeatureRootImport: () => IBlueprint<
      C,
      HasRoot,
      HasFeature,
      True,
      Assembler
   >
}

type BuildVariations<C extends Context> = Variations<
   {},
   BuildRoot<C>,
   BuildFeature<C>,
   {},
   BuildBoth<C>,
   BuildBoth<C>,
   BuildFeature<C>,
   BuildBoth<C>
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

export type IModuleBaseClassBlueprint<C extends Context> = IBlueprint<
   C,
   False,
   False,
   False,
   BuildVariations<C>
>
