/* eslint-disable @typescript-eslint/no-extraneous-class */
import { DynamicModule, Type } from "@nestjs/common"
import { ConduitModuleBuilder } from "./ConduitModuleBuilder.js"
import type {
   DefaultDirector,
   IConduitModuleFactory,
   IFeatureConduitFactory,
   IRootConduitFactory,
   IRootAndFeatureConduitFactory,
} from "../interface/IConduitModuleFactory.js"
import {
   DefaultIdentity,
   DefaultParams,
   FeatureConduitModule,
   ProtoParams,
   RootAndFeatureConduitModule,
   RootConduitModule,
} from "../index.js"

export class ConduitModuleFactory<
      RootParams extends unknown[] = DefaultParams,
      FeatureParams extends unknown[] = DefaultParams,
      RootMethodName extends string = "forRoot",
      FeatureMethodName extends string = "forFeature",
   >
   implements
      IConduitModuleFactory<
         RootParams,
         FeatureParams,
         RootMethodName,
         FeatureMethodName
      >,
      IRootConduitFactory<
         RootParams,
         FeatureParams,
         RootMethodName,
         FeatureMethodName
      >,
      IFeatureConduitFactory<
         RootParams,
         FeatureParams,
         RootMethodName,
         FeatureMethodName
      >,
      IRootAndFeatureConduitFactory<
         RootParams,
         FeatureParams,
         RootMethodName,
         FeatureMethodName
      >
{
   private built: boolean = false
   private frozen: boolean = false
   private staticRootBuilder?: ConduitModuleBuilder
   private staticFeatureBuilder?: ConduitModuleBuilder

   private rootFactoryImpl?: (...args: RootParams) => DefaultDirector
   private featureFactoryImpl?: (...args: FeatureParams) => DefaultDirector

   protoRootParams: RootParams
   protoFeatureParams: FeatureParams

   private readonly defaultRootProto: DefaultIdentity = (
      director: DefaultDirector,
   ): DefaultDirector => director

   private readonly defaultFeatureProto: DefaultIdentity = (
      director: DefaultDirector,
   ): DefaultDirector => director

   constructor(paramProtos: ProtoParams<RootParams, FeatureParams>) {
      this.protoRootParams = paramProtos?.rootProto ?? [this.defaultRootProto]
      this.protoFeatureParams = paramProtos?.featureProto ?? [
         this.defaultFeatureProto,
      ]
   }

   implementRootMethod(
      body?: (...args: RootParams) => DefaultDirector,
   ): ConduitModuleFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   > {
      this._verifyMutability()

      if (body === undefined) {
         if (
            Array.isArray(this.protoRootParams) &&
            this.protoRootParams.length === 1 &&
            this.protoRootParams[0] === this.defaultRootProto
         ) {
            this.rootFactoryImpl = ((
               director: DefaultDirector,
            ): DefaultDirector => director) as unknown as (
               ...args: RootParams
            ) => DefaultDirector
         } else {
            throw new Error(
               "With non-default root signature, a body is required to enable root generation",
            )
         }
      } else {
         this.rootFactoryImpl = body
      }

      return this
   }

   implementFeatureMethod(
      body?: (...args: FeatureParams) => DefaultDirector,
   ): ConduitModuleFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   > {
      this._verifyMutability()

      if (body === undefined) {
         if (
            Array.isArray(this.protoFeatureParams) &&
            this.protoFeatureParams.length === 1 &&
            this.protoFeatureParams[0] === this.defaultFeatureProto
         ) {
            this.featureFactoryImpl = ((
               director: DefaultDirector,
            ): DefaultDirector => director) as unknown as (
               ...arg: FeatureParams
            ) => DefaultDirector
         } else {
            throw new Error(
               "With non-default feature signature, a body is required to enable feature generation",
            )
         }
      } else {
         this.featureFactoryImpl = body
      }

      return this
   }

   setStaticRootContent(
      director: DefaultDirector,
   ): ConduitModuleFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   > {
      this._verifyMutability()

      this.staticRootBuilder = new ConduitModuleBuilder(ConduitModuleFactory)
      director(this.staticRootBuilder)
      this.staticRootBuilder.freeze()
      return this
   }

   setStaticFeatureContent(
      director: DefaultDirector,
   ): ConduitModuleFactory<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   > {
      this._verifyMutability()

      this.staticFeatureBuilder = new ConduitModuleBuilder(ConduitModuleFactory)
      director(this.staticFeatureBuilder)
      this.staticFeatureBuilder.freeze()
      return this
   }

   createTypeProxy(typeName: string): {} {
      const proxy = new Proxy(
         {},
         {
            get: () => {
               throw new Error(
                  `"${typeName}" is not supposed to be used as a value.`,
               )
            },
         },
      )
      return proxy
   }

   build():
      | any
      | FeatureConduitModule<FeatureParams, FeatureMethodName>
      | RootConduitModule<RootParams, RootMethodName>
      | RootAndFeatureConduitModule<
           RootParams,
           FeatureParams,
           RootMethodName,
           FeatureMethodName
        > {
      this._verifyMutability()

      const hasFeatureMethod = this.featureFactoryImpl !== undefined
      if (!hasFeatureMethod && this.staticFeatureBuilder !== undefined) {
         throw new Error(
            "Cannot use static feature builder without a hasFeature() method",
         )
      }
      const hasRootMethod =
         this.staticRootBuilder !== undefined || this.rootFactoryImpl !== null
      if (!hasFeatureMethod && !hasRootMethod) {
         throw new Error("Cannot build conduit module with no dynamic behavior")
      }
      const featureFactoryImpl:
         | ((...args: FeatureParams) => DefaultDirector)
         | undefined = this.featureFactoryImpl
      const rootFactoryImpl:
         | ((...args: RootParams) => DefaultDirector)
         | undefined = this.rootFactoryImpl
      const staticRootBuilder = this.staticRootBuilder
      let selfActivateRoot = !hasRootMethod && staticRootBuilder !== undefined
      let injectRootModule =
         hasFeatureMethod && (hasRootMethod || staticRootBuilder !== undefined)
      let rootResolver: (module: DynamicModule) => void
      const rootPromise = injectRootModule
         ? new Promise<DynamicModule>((resolve, _reject) => {
              rootResolver = resolve
           })
         : undefined
      const staticFeatureBuilder =
         injectRootModule && this.staticFeatureBuilder === undefined
            ? new ConduitModuleBuilder(
                 ConduitModuleFactory,
                 this.staticFeatureBuilder,
              )
            : this.staticFeatureBuilder
      if (
         injectRootModule &&
         rootPromise !== undefined &&
         staticFeatureBuilder !== undefined
      ) {
         staticFeatureBuilder.importModules(rootPromise)
      }
      let BaseDynamicConduitModule
      if (hasFeatureMethod && !hasRootMethod) {
         BaseDynamicConduitModule = class BaseDynamicConduitModule {
            static forFeature(...args: FeatureParams): DynamicModule {
               const builder: ConduitModuleBuilder = new ConduitModuleBuilder(
                  this,
                  staticFeatureBuilder,
               )
               if (featureFactoryImpl !== undefined) {
                  const director = featureFactoryImpl(...args)

                  if (director !== undefined) {
                     director(builder)
                  }
               }
               if (selfActivateRoot && staticRootBuilder !== undefined) {
                  selfActivateRoot = false
                  rootResolver(staticRootBuilder.build())
               }

               builder.identifyAs(this)
               return builder.build()
            }
         }
      } else if (!hasFeatureMethod && hasRootMethod) {
         BaseDynamicConduitModule = class BaseDynamicConduitModule {
            static forRoot(...args: RootParams): DynamicModule {
               const builder: ConduitModuleBuilder = new ConduitModuleBuilder(
                  this,
                  staticRootBuilder,
               )

               if (rootFactoryImpl !== undefined) {
                  const director = rootFactoryImpl(...args)

                  if (director !== undefined) {
                     director(builder)
                  }
               }

               builder.identifyAs(this)
               return builder.build()
            }
         }
      } else {
         BaseDynamicConduitModule = class BaseDynamicConduitModule {
            static forRoot(...args: RootParams): DynamicModule {
               const builder: ConduitModuleBuilder = new ConduitModuleBuilder(
                  this,
                  staticRootBuilder,
               )

               if (rootFactoryImpl !== undefined) {
                  const director: DefaultDirector = rootFactoryImpl(...args)

                  if (director !== undefined) {
                     director(builder)
                  }
               }

               builder.identifyAs(this)
               const retVal = builder.build()
               if (injectRootModule) {
                  rootResolver(retVal)
                  injectRootModule = false
               }
               return retVal
            }

            static forFeature(...args: FeatureParams): DynamicModule {
               const builder: ConduitModuleBuilder = new ConduitModuleBuilder(
                  this,
                  staticFeatureBuilder,
               )
               if (featureFactoryImpl !== undefined) {
                  const director = featureFactoryImpl(...args)

                  if (director !== undefined) {
                     director(builder)
                  }
               }

               builder.identifyAs(this)
               return builder.build()
            }
         }
      }

      this.built = true
      return BaseDynamicConduitModule
   }

   private _verifyMutability(): void {
      if (this.built) {
         throw new Error("This unit has already been built.")
      }
      if (this.frozen) {
         throw new Error(
            "This unit has been frozen for use as a fixed precursor.",
         )
      }
   }

   freeze(): void {
      if (this.built) {
         throw new Error(
            "Cannot freeze this for use as a precursor because it was already used for build()",
         )
      }
      this.frozen = true
   }
}
