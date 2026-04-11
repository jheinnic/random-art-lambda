/* eslint-disable @typescript-eslint/no-extraneous-class */
import { DynamicModule } from "@nestjs/common"
import { DynamicModuleBlueprint } from "./DynamicModuleBlueprint.js"
import { Identity } from "../interface/Utility.js"
import type { IDynamicModuleDirector } from "../interface/IDynamicModuleBuilder.js"
import type {
   Context,
   IModuleBaseClassBlueprint,
} from "../interface/IModuleClassBlueprint.js"
import {
   FeatureConduitModule,
   RootAndFeatureConduitModule,
   RootConduitModule,
} from "../interface/IConduitModule.js"

type ModuleDirectorExtension = Identity<IDynamicModuleDirector>

/**
 * This obsolete Class creation pattern has a very different style to creating Module classes than its
 * successor, the InjectableModuleClassFactory.  Both use the DynamicModuleBlueprint for the DynamicModule
 * metadata work, but have different ideas about how to create reusable Classes.
 *
 * The Root to Feature sharing concept attempted here does not seem to work, beware.  This will be removed when its
 * last consumer has been migrated away!
 */
export class ModuleClassBlueprint<
   RootParams extends unknown[] = [IDynamicModuleDirector],
   FeatureParams extends unknown[] = [IDynamicModuleDirector],
   RootMethodName extends string = "forRoot",
   FeatureMethodName extends string = "forFeature",
> implements
      IModuleBaseClassBlueprint<
         Context<RootParams, FeatureParams, RootMethodName, FeatureMethodName>
      >
{
   private built: boolean = false

   private useFeatureRootImport: boolean = false

   private rootFactoryImpl?: (...args: RootParams) => IDynamicModuleDirector
   private featureFactoryImpl?: (
      ...args: FeatureParams
   ) => IDynamicModuleDirector

   private readonly defaultRootProto: ModuleDirectorExtension = (
      director: IDynamicModuleDirector,
   ): IDynamicModuleDirector => director

   private readonly defaultFeatureProto: ModuleDirectorExtension = (
      director: IDynamicModuleDirector,
   ): IDynamicModuleDirector => director

   implementRootMethod(
      body?: (...args: RootParams) => IDynamicModuleDirector,
   ): ModuleClassBlueprint<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   > {
      this._verifyMutability()

      if (body === undefined) {
         // eslint-disable-next-line no-constant-condition
         if (false) {
            this.rootFactoryImpl = ((
               director: IDynamicModuleDirector,
            ): IDynamicModuleDirector => director) as unknown as (
               ...args: RootParams
            ) => IDynamicModuleDirector
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
      body?: (...args: FeatureParams) => IDynamicModuleDirector,
   ): ModuleClassBlueprint<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   > {
      this._verifyMutability()

      if (body === undefined) {
         // eslint-disable-next-line no-constant-condition
         if (true) {
            this.featureFactoryImpl = ((
               director: IDynamicModuleDirector,
            ): IDynamicModuleDirector => director) as unknown as (
               ...arg: FeatureParams
            ) => IDynamicModuleDirector
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

   public implementFeatureRootImport(): ModuleClassBlueprint<
      RootParams,
      FeatureParams,
      RootMethodName,
      FeatureMethodName
   > {
      this.useFeatureRootImport = true
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

      const hasFeatureMethod: boolean =
         this.useFeatureRootImport || this.featureFactoryImpl !== undefined
      const hasRootMethod: boolean = this.rootFactoryImpl !== undefined
      if (!hasFeatureMethod && !hasRootMethod) {
         throw new Error("Cannot build conduit module with no dynamic behavior")
      }
      const featureFactoryImpl:
         | ((...args: FeatureParams) => IDynamicModuleDirector)
         | undefined = this.featureFactoryImpl
      const rootFactoryImpl:
         | ((...args: RootParams) => IDynamicModuleDirector)
         | undefined = this.rootFactoryImpl
      const useFeatureRootImport = this.useFeatureRootImport
      let resolveRootModule: (value: DynamicModule) => void
      const rootImportPromise: Promise<DynamicModule> | undefined =
         useFeatureRootImport
            ? new Promise((resolve, _reject) => {
                 resolveRootModule = resolve
              })
            : undefined
      let BaseDynamicConduitModule

      if (hasFeatureMethod && !hasRootMethod) {
         BaseDynamicConduitModule = class BaseDynamicConduitModule {
            static forFeature(...args: FeatureParams): DynamicModule {
               const builder: DynamicModuleBlueprint =
                  new DynamicModuleBlueprint(this)
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
      } else if (!hasFeatureMethod && hasRootMethod) {
         BaseDynamicConduitModule = class BaseDynamicConduitModule {
            static forRoot(...args: RootParams): DynamicModule {
               const builder: DynamicModuleBlueprint =
                  new DynamicModuleBlueprint(this)

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
               const builder: DynamicModuleBlueprint =
                  new DynamicModuleBlueprint(this)

               if (rootFactoryImpl !== undefined) {
                  const director: IDynamicModuleDirector = rootFactoryImpl(
                     ...args,
                  )

                  if (director !== undefined) {
                     director(builder)
                  }
               }

               builder.identifyAs(this)
               const retVal = builder.build()
               if (resolveRootModule !== undefined) {
                  resolveRootModule(retVal)
               }
               return retVal
            }

            static forFeature(...args: FeatureParams): DynamicModule {
               const builder: DynamicModuleBlueprint =
                  new DynamicModuleBlueprint(this)
               if (featureFactoryImpl !== undefined) {
                  const director = featureFactoryImpl(...args)

                  if (director !== undefined) {
                     director(builder)
                  }
               }
               if (rootImportPromise !== undefined) {
                  builder.importModules(rootImportPromise)
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
   }
}
