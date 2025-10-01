import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "./SeedTypeExtensionPoint.js"
import { IExtension } from "../../extensions/interface/IExtension.js"
import { SeedTypeByExtension } from "./SeedTypeByExtension.js"
import { SeedType } from "./SeedTypes.js"

export interface IGenModelSeedExtension<
   Extension extends string,
   M extends SeedTypeByExtension<Extension>,
   S extends SeedType = SeedType,
> extends IExtension<GEN_MODEL_SEED_TYPE_EXTENSION_POINT, Extension> {
   // readonly extensionFor: Extension

   validate: (input: M) => void

   // returnsIterator: (input: M) => boolean

   // isAsync: (input: M) => boolean

   // outputTypes: (input: M) => SeedType[]

   // noPrefixSuffix: (
   //    input: M,
   // ) => IGenModelSeedExtension<K, M, Exclude<S, PrefixSuffix>>

   // noSinglePhrase: (
   //    input: M,
   // ) => IGenModelSeedExtension<K, M, Exclude<S, SinglePhrase>>

   // noPhrasePair: (
   //    input: M,
   // ) => IGenModelSeedExtension<K, M, Exclude<S, PhrasePair>>

   toSeedModel: (input: M) => S | Iterable<S> | Promise<S> | AsyncIterable<S>
}
