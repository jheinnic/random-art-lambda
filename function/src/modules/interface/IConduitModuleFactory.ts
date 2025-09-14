import {
   FeatureConduitModule,
   RootAndFeatureConduitModule,
   RootConduitModule,
} from "./IConduitModule.js"
import { IConduitModuleBuilder } from "./IConduitModuleBuilder.js"

export interface IConduitModuleFactory<
   RootParams extends unknown[],
   FeatureParams extends unknown[],
   RootMethodName extends string,
   FeatureMethodName extends string,
> {
   implementRootMethod: (
      body?: (...args: RootParams) => DefaultDirector,
   ) => IRootConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   implementFeatureMethod: (
      body?: (...args: FeatureParams) => DefaultDirector,
   ) => IFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >
   implementFeatureRootImport: () => IRootAndFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >
}

export type Director<T> = (builder: T) => void

export type DefaultDirector = Director<IConduitModuleBuilder>

export interface IRootConduitFactory<
   RootParams extends unknown[],
   FeatureParams extends unknown[],
   RootMethodName extends string,
   FeatureMethodName extends string,
> {
   implementRootMethod: (
      body?: (...args: RootParams) => DefaultDirector,
   ) => IRootConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   implementFeatureMethod: (
      body?: (...args: FeatureParams) => DefaultDirector,
   ) => IRootAndFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   implementFeatureRootImport: () => IRootAndFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   build: () => RootConduitModule<RootParams, RootMethodName>
}

export interface IFeatureConduitFactory<
   RootParams extends unknown[],
   FeatureParams extends unknown[],
   RootMethodName extends string,
   FeatureMethodName extends string,
> {
   implementRootMethod: (
      body?: (...args: RootParams) => DefaultDirector,
   ) => IRootAndFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   implementFeatureMethod: (
      body?: (...args: FeatureParams) => DefaultDirector,
   ) => IFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   implementFeatureRootImport: () => IRootAndFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   build: () => FeatureConduitModule<FeatureParams, FeatureMethodName>
}

export interface IRootAndFeatureConduitFactory<
   RootParams extends unknown[],
   FeatureParams extends unknown[],
   RootMethodName extends string,
   FeatureMethodName extends string,
> {
   implementRootMethod: (
      body?: (...args: RootParams) => DefaultDirector,
   ) => IRootAndFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   implementFeatureMethod: (
      body?: (...args: FeatureParams) => DefaultDirector,
   ) => IRootAndFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   implementFeatureRootImport: () => IRootAndFeatureConduitFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >

   build: () => RootAndFeatureConduitModule<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   >
}
