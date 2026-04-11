type UnusedKey<
   Context extends object,
   Candidate extends string,
> = Candidate extends keyof Context ? never : Candidate

type CompatibleForMixin<Context extends object, Candidate extends object> = [
   keyof Context & keyof Candidate,
] extends [never]
   ? Candidate
   : never

type Mixin<Context extends object, Candidate extends object> = [
   Candidate,
] extends [never]
   ? Context
   : [keyof Context & keyof Candidate] extends [never]
     ? {
          [K in keyof Context | keyof Candidate]: K extends keyof Context
             ? Context[K]
             : K extends keyof Candidate
               ? Candidate[K]
               : never
       }
     : never

type WithProp<Context extends object, NewKey extends string, NewValue> =
   NewKey extends UnusedKey<Context, NewKey>
      ? {
           [K in NewKey | keyof Context]: K extends keyof Context
              ? Context[K]
              : NewValue
        }
      : never

type ContextKeyPairs<Context extends object> = {
   [K in keyof Context]: [K, keyof Context[K]]
}[keyof Context]

type ContextKeysAndPairs<Context extends object> = {
   [K in keyof Context]: K | [K, keyof Context[K]]
}[keyof Context]

// type ContextPath<Context extends object, TopKey extends keyof Context> = [
//    TopKey,
//    keyof Context[TopKey],
// ]

type CallableParams<
   Context extends object,
   ParamSelectors extends ReadonlyArray<ContextKeysAndPairs<Context>>,
> = {
   [N in keyof ParamSelectors]: ParamSelectors[N] extends keyof Context
      ? Context[ParamSelectors[N]]
      : ParamSelectors[N] extends ContextKeyPairs<Context>
        ? Context[ParamSelectors[N][0]][ParamSelectors[N][1]]
        : never
}

interface ContextualMethod<
   Context extends object,
   ReturnedType,
   ParamSelectors extends ReadonlyArray<ContextKeysAndPairs<Context>>,
> {
   method: (...args: CallableParams<Context, ParamSelectors>) => ReturnedType
   selectors: ParamSelectors
}

// 1. Define the "Leaf" types
type AtomicData = string | number | boolean

// 2. Create a recursive check that maps over keys rather than requiring a string index signature.
type ValidateJustData<T> = T extends AtomicData
   ? T
   : T extends Array<infer U>
     ? U extends ValidateJustData<U>
        ? T
        : never
     : T extends (...args: any) => any
       ? never
       : T extends {
              [K in keyof T]: ValidateJustData<T[K]>
           }
         ? T
         : never
// type JustData =
//    | string
//    | number
//    | boolean
//    | JustData[]
//    | { [K in string]: JustData }

export interface PipelineBuilder<
   InitialContext extends object,
   InjectedContext extends object = object,
   ExprContext extends object = InitialContext,
   StepContext extends object = ExprContext,
> {
   extendInitial: <ExtraInitial extends object>(
      defaults: CompatibleForMixin<StepContext, ExtraInitial>,
   ) => PipelineBuilder<
      Mixin<InitialContext, ExtraInitial>,
      InjectedContext,
      Mixin<ExprContext, ExtraInitial>,
      Mixin<StepContext, ExtraInitial>
   >

   addStep: <
      StepOut extends object,
      NameOut extends string,
      NamesIn extends ReadonlyArray<ContextKeysAndPairs<StepContext>>,
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      implementation: ContextualMethod<StepContext, StepOut, NamesIn>,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof StepOut] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, StepOut>,
      [keyof StepOut] extends [never]
         ? StepContext
         : WithProp<StepContext, typeof nameOut, StepOut>
   >

   addContextAwareStep: <
      StepOut extends object,
      NameOut extends string,
      StepIn extends Partial<StepContext>,
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      step: (input: StepIn) => StepOut,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof StepOut] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, StepOut>,
      [keyof StepOut] extends [never]
         ? StepContext
         : WithProp<StepContext, typeof nameOut, StepOut>
   >
   T
   addPublicFeature: <ExprOut, NameOut extends string>(
      nameOut: UnusedKey<StepContext, NameOut>,
      properties: {
         [K in keyof ExprOut]:
            | string
            | [string]
            | ContextualMethod<
                 StepContext,
                 ExprOut[K],
                 ReadonlyArray<ContextKeysAndPairs<StepContext>>
              >
      },
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      WithProp<ExprContext, typeof nameOut, ExprOut>,
      WithProp<StepContext, typeof nameOut, ExprOut>
   >

   addPrivateFeature: <ExprOut, NameOut extends string>(
      nameOut: UnusedKey<StepContext, NameOut>,
      properties: {
         [K in keyof ExprOut]:
            | string
            | [string]
            | ContextualMethod<
                 StepContext,
                 ExprOut[K],
                 ReadonlyArray<ContextKeysAndPairs<StepContext>>
              >
      },
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      ExprContext,
      WithProp<StepContext, typeof nameOut, ExprOut>
   >

   addFeature: <
      ExprOut extends object,
      NameOut extends string,
      StepOut extends ExprOut = ExprOut,
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      publicProperties: {
         [K in keyof ExprOut]:
            | string
            | [string]
            | ContextualMethod<
                 StepContext,
                 ExprOut[K],
                 ReadonlyArray<ContextKeysAndPairs<StepContext>>
              >
      },
      privateProperties: {
         [K in Exclude<keyof StepOut, keyof ExprOut>]:
            | string
            | [string]
            | ContextualMethod<
                 StepContext,
                 StepOut[K],
                 ReadonlyArray<ContextKeysAndPairs<StepContext>>
              >
      },
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof ExprOut] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, ExprOut>,
      WithProp<StepContext, typeof nameOut, StepOut>
   >

   addPublicInjection: <InjectedType, NameOut extends string>(
      nameOut: UnusedKey<StepContext, NameOut>,
      injection: InjectedType,
   ) => PipelineBuilder<
      InitialContext,
      WithProp<InjectedContext, typeof nameOut, InjectedType>,
      WithProp<ExprContext, typeof nameOut, InjectedType>,
      WithProp<StepContext, typeof nameOut, InjectedType>
   >

   addPrivateInjection: <InjectedType, NameOut extends string>(
      nameOut: UnusedKey<StepContext, NameOut>,
      injection: InjectedType,
   ) => PipelineBuilder<
      InitialContext,
      WithProp<InjectedContext, typeof nameOut, InjectedType>,
      ExprContext,
      WithProp<StepContext, typeof nameOut, InjectedType>
   >

   buildPipeline: <ResultOut extends object>(
      expressions:
         | Record<keyof ResultOut, ContextKeysAndPairs<ExprContext>>
         | ((context: ExprContext) => ResultOut),
   ) => (initial: InitialContext, injections: InjectedContext) => ResultOut
}

export interface FileStore {
   save: (name: string, content: Buffer) => void
}

export interface BuiltIn {
   suffix: Uint8ClampedArray
   prefix: Uint8ClampedArray
}

export interface Paths {
   pathOne: string
   pathTwo: string
}

export interface PathExpressions {
   pathOne: string
}

export interface FileStoreSelection {
   selected: FileStore
}

export interface OriginalEncoding {
   originalEncoding: BufferEncoding
}

export interface TranscodedTerms {
   prefix: string
   suffix: string
}

export interface Result {
   filename: string
   status: number
}

const foo: PipelineBuilder<BuiltIn> = {} as unknown as PipelineBuilder<BuiltIn>
const s3Store1: FileStore = {} as unknown as FileStore
const s3Store2: FileStore = {} as unknown as FileStore
export const k: FileStore = s3Store1

export const method = foo
   .extendInitial<OriginalEncoding>({
      originalEncoding: "utf8",
   })
   .extendInitial<PathExpressions>({
      // eslint-disable-next-line no-template-curly-in-string
      pathOne: "`${transcodedTerms.prefix}/${transcodedTerms.suffix}`",
   })
   .addPublicFeature<TranscodedTerms, "transcodedTerms">("transcodedTerms", {
      prefix: {
         method: (
            binary: Uint8ClampedArray,
            encoding: BufferEncoding,
         ): string => {
            return Buffer.from(binary.buffer).toString(encoding)
         },
         selectors: ["prefix", "originalEncoding"] as const,
      },
      suffix: {
         method: (
            binary: Uint8ClampedArray,
            encoding: BufferEncoding,
         ): string => {
            return Buffer.from(binary.buffer).toString(encoding)
         },
         selectors: ["suffix", "originalEncoding"] as const,
      },
   })
   .addPrivateInjection("store1", s3Store1)
   .addPrivateInjection("store2", s3Store2)
   .addPrivateFeature<FileStoreSelection, "selectedStore">("selectedStore", {
      selected: "(suffix === prefix) ? store1 : store2",
   })
   .addFeature<Paths, "targets">(
      "targets",
      {
         // eslint-disable-next-line no-template-curly-in-string
         pathOne: ["`${pathOne}`"],
         // eslint-disable-next-line no-template-curly-in-string
         pathTwo: "`${prefix}/${suffix}`",
      },
      {},
   )
   .addStep("progress", {
      method: (_store: FileStore): { status: number } => {
         return { status: 5 }
      },
      selectors: [["selectedStore", "selected"]],
   })
   .buildPipeline<Result>({
      filename: ["targets", "pathTwo"],
      status: ["progress", "status"],
   })

export const lala = method(
   {
      prefix: Uint8ClampedArray.of(1, 2, 3),
      suffix: Uint8ClampedArray.of(8, 7, 6),
      originalEncoding: "hex",
      // eslint-disable-next-line no-template-curly-in-string
      pathOne: "`${transcodedTerms.prefix}/${transcodedTerms.suffix}`",
   },
   { store1: s3Store1, store2: s3Store2 },
)
