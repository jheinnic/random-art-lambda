import { Module, Injectable, Inject, DynamicModule } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import {
   SimpleDynamicModule,
   IDynamicModuleBuilder,
   DefaultDirector,
} from "./modules/index.js"
import z from "zod"
import { ZodModuleClassBlueprint } from "./modules/di/ZodModuleClassBlueprint.js"
import { InjectableModuleClassFactory } from "./modules/di/InjectableModuleClassFactory.js"

const theBoxOne: unique symbol = Symbol("TheOneBox")
const anotherBoxOne: unique symbol = Symbol("AnotherOneBox")
const theBoxTwo: unique symbol = Symbol("TheTwoBox")
const anotherBoxTwo: unique symbol = Symbol("AnotherTwoBox")
const theBoxThree: unique symbol = Symbol("TheThreeBox")
const anotherBoxThree: unique symbol = Symbol("AnotherThreeBox")

const theBox: unique symbol = Symbol("TheBox")
const anotherBox: unique symbol = Symbol("AnotherBox")

@Injectable()
export class Box {
   constructor(public readonly value: number = 25) {}
}

@Injectable()
export class Crate {
   public readonly value: number = Math.random()
   constructor(
      @Inject(theBoxThree)
      public readonly boxOne: Box,
      @Inject(anotherBoxThree)
      public readonly boxTwo: Box,
   ) {
      console.log("This crate is: " + this.value.toString())
   }
}

@Injectable()
export class CrateService {
   constructor(public readonly crate: Crate) {}
}

const configOne = z.object()

// export interface ConfigOne {
// theConduit: DynamicModule
// }
const moduleThreeHost = new InjectableModuleClassFactory(
   configOne,
   { theBox, anotherBox },
   "forRootImpl",
)

type ConfigOneExternal = typeof moduleThreeHost.externalConfigType
type ConfigOne = typeof moduleThreeHost.internalConfigType
const ModuleThreeBase = moduleThreeHost.build()

@Module({})
export class ModuleThree extends ModuleThreeBase {
   public static forRootImpl(config: ConfigOne): DefaultDirector {
      return (builder: IDynamicModuleBuilder) => {
         builder.exportProviders(Crate)
      }
   }
}

@Module({})
export class ModuleFour extends new InjectableModuleClassFactory(
   configOne,
   { theBox, anotherBox },
   "forRootImpl",
).build() {
   public static forRootImpl(config: ConfigOne): DefaultDirector {
      return {
         module: ModuleFour,
         imports: [config.theConduit, ModuleThree.register(config)],
         providers: [
            {
               provide: anotherBoxTwo,
               useExisting: anotherBox,
            },
            {
               provide: theBoxTwo,
               useExisting: theBox,
            },
         ],
         exports: [theBoxTwo, anotherBoxTwo, ModuleThree],
      }
   }
}

@Module({})
export class ModuleTwo {
   public static register(config: ConfigOne): DynamicModule {
      return {
         module: ModuleTwo,
         imports: [config.theConduit, ModuleThree.register(config)],
         providers: [
            {
               provide: anotherBoxTwo,
               useExisting: anotherBox,
            },
            {
               provide: theBoxTwo,
               useExisting: theBox,
            },
         ],
         exports: [theBoxTwo, anotherBoxTwo, ModuleThree],
      }
   }
}

@Module({})
export class ModuleOne {
   public static register(config: ConfigOne): DynamicModule {
      return {
         module: ModuleOne,
         imports: [config.theConduit, ModuleFour.register(config)],
         providers: [
            {
               provide: theBoxOne,
               useExisting: theBox,
            },
            {
               provide: anotherBoxOne,
               useExisting: anotherBox,
            },
         ],
         exports: [theBoxOne, anotherBoxOne, ModuleFour],
      }
   }
}

const innerConduitModule: DynamicModule = SimpleDynamicModule.registerModule(
   (builder: IDynamicModuleBuilder): void => {
      builder.exportProviders(
         {
            provide: theBox,
            useFactory: () => {
               console.log("The 100 box")
               return new Box(100)
            },
         },
         {
            provide: anotherBox,
            useFactory: () => {
               console.log("The 150 box")
               return new Box(150)
            },
         },
      )
   },
)
const conduitModule = SimpleDynamicModule.registerModule(
   (builder: IDynamicModuleBuilder): void => {
      builder
         .exportModules(
            ModuleThree.register({ theConduit: innerConduitModule }),
         )
         .exportModules(innerConduitModule)
   },
)

@Module({
   imports: [
      innerConduitModule,
      conduitModule,
      ModuleOne.register({
         theConduit: conduitModule,
      }),
      ModuleTwo.register({
         theConduit: innerConduitModule,
      }),
   ],
   providers: [CrateService],
   exports: [CrateService],
})
export class AppModule {}

async function bootstrap(): Promise<void> {
   const app = await NestFactory.createApplicationContext(AppModule)
   const theBoxInst = app.get(theBox)
   const theBoxOneA = app.get(theBoxOne)
   const anotherBoxOneA = app.get(anotherBoxOne)
   const theBoxTwoA = app.get(theBoxTwo)
   const anotherBoxTwoA = app.get(anotherBoxTwo)
   const theBoxThreeA = app.get(theBoxThree)
   const anotherBoxThreeA = app.get(anotherBoxThree)
   console.log([
      theBoxInst,
      theBoxOneA,
      anotherBoxOneA,
      theBoxTwoA,
      anotherBoxTwoA,
      theBoxThreeA,
      anotherBoxThreeA,
   ])
   const appSvc = app.get(CrateService)
   console.log(appSvc)
   console.log(appSvc.crate)
   console.log(appSvc.crate.boxOne)
   console.log(appSvc.crate.boxOne.value)
   console.log(appSvc.crate.boxTwo)
   console.log(appSvc.crate.boxTwo.value)
   console.log(appSvc.crate.value)
   console.log("Done")
}

bootstrap().catch((x: unknown): void => console.error(x))
