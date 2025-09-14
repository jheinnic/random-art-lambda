import { If, IsType } from "simplytyped"
import { DefaultDirector } from "./IConduitModuleFactory.js"

export type Identity<T> = (director: T) => T

export type DefaultIdentity = Identity<DefaultDirector>
export type DefaultParams = [DefaultDirector]

export type ProtoParams<RootParams, FeatureParams> = If<
   IsType<DefaultParams, RootParams>,
   If<
      IsType<DefaultParams, FeatureParams>,
      undefined,
      { featureProto: FeatureParams }
   >,
   If<
      IsType<DefaultParams, FeatureParams>,
      { rootProto: RootParams },
      { rootProto: RootParams; featureProto: FeatureParams }
   >
>
