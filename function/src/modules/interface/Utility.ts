import { If, IsType } from "simplytyped"
import { DefaultDirector } from "./IDynamicModuleBuilder.js"

export type Director<T> = (builder: T) => void
export type Identity<in out T> = (...args: [T]) => T

// export type ProtoParams<RootParams, FeatureParams> = If<
//    IsType<DefaultParams, RootParams>,
//    If<
//       IsType<DefaultParams, FeatureParams>,
//       undefined,
//       { featureProto: FeatureParams }
//    >,
//    If<
//       IsType<DefaultParams, FeatureParams>,
//       { rootProto: RootParams },
//       { rootProto: RootParams; featureProto: FeatureParams }
//    >
// >
