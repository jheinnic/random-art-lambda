import { Type } from "@nestjs/common"

export interface TaskConfigurationBuilder {
   singleTask: () => SingleTaskConfigBuilder
   multiTask: () => MultiTaskConfigBuilder
}

export interface SingleTaskConfigBuilder {
   workPoolStaged: () => StagedTaskConfigBuilder<false, true>

   originStaged: () => StagedTaskConfigBuilder<false, false>

   // streaming(): SingleStreamedTaskConfigBuilder
}

export interface MultiTaskConfigBuilder {
   workPoolStaged: () => StagedTaskConfigBuilder<true, true>

   originStaged: () => StagedTaskConfigBuilder<true, false>
}

export type StagedTaskConfigBuilder<
   IsMulti extends boolean,
   IsUnitPooled extends boolean,
> = (IsUnitPooled extends false
   ? LocalStorageOptionBuilder<IsMulti>
   : undefined) &
   S3StorageOptionBuilder<IsMulti, IsUnitPooled>

export interface LocalStorageOptionBuilder<IsMulti extends boolean> {
   localStorage: (path: string) => UnitHandlingOptionsBuilder<IsMulti, false>
}

export interface S3StorageOptionBuilder<
   IsMulti extends boolean,
   IsUnitPooled extends boolean,
> {
   s3Bucket: (
      bucket: string,
      prefix: string,
   ) => UnitHandlingOptionsBuilder<IsMulti, IsUnitPooled>
}

export type UnitHandlingOptionsBuilder<
   IsMulti extends boolean,
   IsUnitPool extends boolean,
> = IsMulti extends true
   ? MultiUnitOptionsBuilder<IsUnitPool>
   : SingleUnitOptionsBuilder<IsUnitPool>

export enum ParserContext {
   UNDEFINED = "UNDEFINED",
   CORE_MODEL = "CORE_MODEL",
   SOURCE_MODEL = "SOURCE_MODEL",
   OUTPUT_MODEL = "OUTPUT_MODEL",
}

interface TransformSemantics<
   SourceModel extends object | undefined,
   OutputModel extends object | SourceModel = SourceModel,
   E extends Type<any> | undefined = undefined,
> {
   transformExtension: SourceModel extends OutputModel ? undefined : E
}

interface ExpressionSemantics<
   S extends ParserContext,
   SourceModel extends object | undefined,
   OutputModel extends object | SourceModel = SourceModel,
   PSE extends Type<any> | undefined = undefined,
   POE extends Type<any> | undefined = undefined,
> {
   parserContext: S extends ParserContext.UNDEFINED ? undefined : S
   expression: S extends ParserContext.UNDEFINED ? undefined : string
   parserExtension: S extends ParserContext.UNDEFINED
      ? undefined
      : ParserKind<S, SourceModel, OutputModel, PSE, POE>
}

type ParserKind<
   S extends ParserContext,
   SourceModel extends object | undefined = undefined,
   OutputModel extends object | SourceModel = SourceModel,
   PSE extends Type<any> | undefined = undefined,
   POE extends Type<any> | undefined = undefined,
> = S extends ParserContext.UNDEFINED | ParserContext.CORE_MODEL
   ? undefined
   : S extends ParserContext.OUTPUT_MODEL
     ? POE extends ParserExtension<"Basic" | SourceModel | OutputModel, POE>
        ? POE
        : never
     : PSE extends ParserExtension<"Basic" | SourceModel, PSE>
       ? PSE
       : never

type ParserExtension<Visible, E extends Type<any> | undefined> =
   E extends Type<any>
      ? {
           [K in keyof E]: E[K] & ((this: Visible, ...args: any[]) => any)
        }
      : never

interface SingleContentDependence<
   SourceModel extends object | undefined = undefined,
   PSE extends Type<any> | undefined = undefined,
   OutputModel extends object | SourceModel = SourceModel,
   TE extends Type<any> | undefined = undefined,
   POE extends Type<any> | undefined = undefined,
   NC extends ParserContext = ParserContext.UNDEFINED,
   CC extends ParserContext = ParserContext.UNDEFINED,
> {
   nameBy: ExpressionSemantics<NC, SourceModel, OutputModel, PSE, POE>
   cacheBy: ExpressionSemantics<CC, SourceModel, OutputModel, PSE, POE>
   outputAs: TransformSemantics<SourceModel, OutputModel, TE>
}

interface MultiContentDependence<
   SourceModel extends object | undefined = undefined,
   PSE extends Type<any> | undefined = undefined,
   OutputModel extends object | SourceModel = SourceModel,
   TE extends Type<any> | undefined = undefined,
   POE extends Type<any> | undefined = undefined,
   GC extends ParserContext = ParserContext.UNDEFINED,
   FC extends ParserContext = ParserContext.UNDEFINED,
   NC extends ParserContext = ParserContext.UNDEFINED,
   CC extends ParserContext = ParserContext.UNDEFINED,
> extends SingleContentDependence<
      SourceModel,
      PSE,
      OutputModel,
      TE,
      POE,
      NC,
      CC
   > {
   groupBy: ExpressionSemantics<GC, SourceModel, OutputModel, PSE, POE>
   filterBy: ExpressionSemantics<FC, SourceModel, OutputModel, PSE, POE>
}

export interface MultiUnitOptionsBuilder<IsUnitPool extends boolean> {
   contentDependence: <
      SourceModel extends object | undefined = undefined,
      PSE extends Type<any> | undefined = undefined,
      OutputModel extends object | SourceModel = SourceModel,
      TE extends Type<any> | undefined = undefined,
      POE extends Type<any> | undefined = undefined,
      GC extends ParserContext = ParserContext.UNDEFINED,
      FC extends ParserContext = ParserContext.UNDEFINED,
      NC extends ParserContext = ParserContext.UNDEFINED,
      CC extends ParserContext = ParserContext.UNDEFINED,
   >(
      config: MultiContentDependence<
         SourceModel,
         PSE,
         OutputModel,
         POE,
         TE,
         GC,
         FC,
         NC,
         CC
      >,
   ) => ModuleConfiguration<
      true,
      IsUnitPool,
      SourceModel,
      PSE,
      OutputModel,
      POE,
      TE,
      GC,
      FC,
      NC,
      CC
   >
}

export interface SingleUnitOptionsBuilder<IsUnitPool extends boolean> {
   contentDependence: <
      SourceModel extends object | undefined = undefined,
      PSE extends Type<any> | undefined = undefined,
      OutputModel extends object | SourceModel = SourceModel,
      TE extends Type<any> | undefined = undefined,
      POE extends Type<any> | undefined = undefined,
      NC extends ParserContext = ParserContext.UNDEFINED,
      CC extends ParserContext = ParserContext.UNDEFINED,
   >(
      config: SingleContentDependence<
         SourceModel,
         PSE,
         OutputModel,
         POE,
         TE,
         NC,
         CC
      >,
   ) => ModuleConfiguration<
      false,
      IsUnitPool,
      SourceModel,
      PSE,
      OutputModel,
      POE,
      TE,
      ParserContext.UNDEFINED,
      ParserContext.UNDEFINED,
      NC,
      CC
   >
}

export interface ModuleConfiguration<
   IsMulti extends boolean,
   IsUnitPooled extends boolean,
   RawModel extends object,
   SourceModel extends object | undefined,
   ITE extends IsMulti extends true
      ? Type<{ process: (input: RawModel) => MultiModel<SourceModel> }>
      : Type<{ process: (input: RawModel) => SingleModel<SourceModel> }>,
   PSE extends Type<any> | undefined,
   OutputModel extends object | SourceModel,
   TE extends Type<any> | undefined,
   POE extends Type<any> | undefined,
   GC extends ParserContext,
   FC extends ParserContext,
   NC extends ParserContext,
   CC extends ParserContext,
> {
   isMulti: IsMulti
   isUnitPooled: IsUnitPooled
   sourceModel: SourceModel extends undefined ? undefined : Type<SourceModel>
   inputTransformExtension: ITE
   outputModel: OutputModel extends undefined ? undefined : Type<OutputModel>
   sourceParserExtension: PSE extends undefined ? undefined : PSE
   outputParserExtension: POE extends undefined ? undefined : POE
   outputTransformExtension: TE extends undefined ? undefined : TE
   groupBy: ExpressionSemantics<GC, SourceModel, OutputModel, PSE, POE>
   filterBy: ExpressionSemantics<FC, SourceModel, OutputModel, PSE, POE>
   nameBy: ExpressionSemantics<NC, SourceModel, OutputModel, PSE, POE>
   cacheBy: ExpressionSemantics<CC, SourceModel, OutputModel, PSE, POE>
}
