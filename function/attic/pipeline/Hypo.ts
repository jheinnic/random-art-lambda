type UnusedKey<
   Context extends object,
   Candidate extends string,
> = Candidate extends keyof Context ? never : Candidate

type CompatibleExtension<Context extends object, Candidate extends object> = [
   keyof Context & keyof Candidate,
] extends [never]
   ? Candidate
   : never

type Merged<Context extends object, Candidate extends object> = [
   keyof Context & keyof Candidate,
] extends [never]
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

type StepParams<
   Context extends object,
   ParamNames extends ReadonlyArray<keyof Context>,
> = {
   [N in keyof ParamNames]: Context[ParamNames[N]]
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
      defaults: CompatibleExtension<StepContext, InitialContext>,
   ) => PipelineBuilder<
      InitialContext & ExtraInitial,
      InjectedContext,
      ExprContext & ExtraInitial,
      StepContext & ExtraInitial
   >

   addStep: <
      ExprOut extends object,
      NameOut extends string,
      NamesIn extends ReadonlyArray<keyof StepContext>,
      StepOut extends ValidateJustData<ExprOut> = ValidateJustData<ExprOut>,
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      namesIn: NamesIn,
      step: (...input: StepParams<StepContext, NamesIn>) => StepOut,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof ExprOut] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, ValidateJustData<ExprOut>>,
      WithProp<StepContext, typeof nameOut, StepOut>
   >

   addContextAwareStep: <
      ExprOut extends object,
      NameOut extends string,
      StepIn extends Partial<StepContext>,
      StepOut extends ValidateJustData<ExprOut> = ValidateJustData<ExprOut>,
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      step: (input: StepIn) => StepOut,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof ExprOut] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, ValidateJustData<ExprOut>>,
      WithProp<StepContext, typeof nameOut, StepOut>
   >

   addPublicExpression: <ExprOut, NameOut extends string>(
      nameOut: UnusedKey<StepContext, NameOut>,
      expression: string | [string],
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      WithProp<ExprContext, typeof nameOut, ValidateJustData<ExprOut>>,
      WithProp<StepContext, typeof nameOut, ValidateJustData<ExprOut>>
   >

   addPrivateExpression: <ExprOut, NameOut extends string>(
      nameOut: UnusedKey<StepContext, NameOut>,
      expression: string | [string],
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      ExprContext,
      WithProp<StepContext, typeof nameOut, ExprOut>
   >

   addExpressions: <
      ExprOut extends object,
      NameOut extends string,
      StepOut extends ValidateJustData<ExprOut> = ValidateJustData<ExprOut>,
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      expressions: Record<keyof StepOut, string | [string]>,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof ExprOut] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, ValidateJustData<ExprOut>>,
      WithProp<StepContext, typeof nameOut, StepOut>
   >

   addPublicInjection: <InjectedType, NameOut extends string>(
      nameOut: UnusedKey<StepContext, NameOut>,
      injection: ValidateJustData<InjectedType>,
   ) => PipelineBuilder<
      InitialContext,
      WithProp<InjectedContext, typeof nameOut, ValidateJustData<InjectedType>>,
      WithProp<ExprContext, typeof nameOut, ValidateJustData<InjectedType>>,
      WithProp<StepContext, typeof nameOut, ValidateJustData<InjectedType>>
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
         | Record<keyof ValidateJustData<ResultOut>, string | [string]>
         | ((context: ExprContext) => ValidateJustData<ResultOut>),
   ) => (
      initial: InitialContext,
      injections: InjectedContext,
   ) => ValidateJustData<ResultOut>
}

export interface FileStore {
   save: (name: string, content: Buffer) => void
}

export interface BuiltIn {
   suffix: string
   prefix: string
}

export interface Paths {
   pathOne: string
   pathTwo: string
}

export interface Result {
   filename: string
   status: number
}

const foo: PipelineBuilder<BuiltIn> = {} as unknown as PipelineBuilder<BuiltIn>
const s3Store1: FileStore = {} as unknown as FileStore
const s3Store2: FileStore = {} as unknown as FileStore
export const k: ValidateJustData<FileStore> = s3Store1

export const method = foo
   .addPrivateInjection("store1", s3Store1)
   .addPrivateInjection("store2", s3Store2)
   .addPrivateExpression<FileStore, "selectedStore">(
      "selectedStore",
      "(suffix === prefix) ? store1 : store2",
   )
   .addExpressions<Paths, "targets">("targets", {
      // eslint-disable-next-line no-template-curly-in-string
      pathOne: "`${suffix}/${prefix}`",
      // eslint-disable-next-line no-template-curly-in-string
      pathTwo: "`${prefix}/${suffix}`",
   })
   .addStep(
      "progress",
      ["selectedStore"],
      (store: FileStore): { status: number } => {
         return { status: 5 }
      },
   )
   .buildPipeline<Result>({
      filename: "targets.pathTwo",
      status: "progress.status",
   })

export const lala = method(
   { prefix: "aa", suffix: "bb" },
   { store1: s3Store1, store2: s3Store2 },
)
