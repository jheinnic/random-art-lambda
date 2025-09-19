import { Module, Injectable, Inject, DynamicModule } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import {
   SimpleDynamicModule,
   IDynamicModuleBuilder,
   DefaultDirector,
   InjectionConfig,
} from "./modules/index.js"
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

// const configOne = z.object()

export interface ConfigOne {
   value: string
   // theConduit: DynamicModule
}
const importTokens = {
   theBox,
   anotherBox,
} as const
const moduleThreeHost = InjectableModuleClassFactory.create(
   importTokens,
   (_config: ConfigOne): DefaultDirector => {
      return (builder: IDynamicModuleBuilder) => {
         builder
            .exportProviders(Crate)
            .exportProviders({
               provide: theBoxThree,
               useExisting: theBox,
            })
            .exportProviders({
               provide: anotherBoxThree,
               useExisting: anotherBox,
            })
      }
   },
)

type PublicConfigThree = typeof moduleThreeHost.externalConfig

@Module({})
export class ModuleThree extends moduleThreeHost.build() {
   public static forRoot(config: PublicConfigThree): DynamicModule {
      return super.forRoot(config)
   }
}

const hostFour = InjectableModuleClassFactory.create(
   importTokens,
   (
      _config: ConfigOne,
      injectConfig: InjectionConfig<typeof importTokens>,
   ): DefaultDirector => {
      return (builder: IDynamicModuleBuilder) => {
         builder.exportModules(
            ModuleThree.forRoot({
               value: "thrown",
               anotherBox: injectConfig.anotherBox,
               theBox: injectConfig.theBox,
            }),
         )
      }
   },
)

export type PublicConfigFour = typeof hostFour.externalConfig

@Module({})
export class ModuleFour extends hostFour.build() {
   public static forRoot(config: PublicConfigFour): DynamicModule {
      return super.forRoot(config)
   }
}

const injectionTwo = {
   anotherBox: anotherBoxTwo,
}
const hostTwo = InjectableModuleClassFactory.create(
   injectionTwo,
   (_config: ConfigOne): DefaultDirector => {
      return (builder: IDynamicModuleBuilder) => {
         builder.exportProviders({
            provide: anotherBoxOne,
            useExisting: anotherBoxTwo,
         })
      }
   },
)

export type PublicConfigTwo = typeof hostTwo.externalConfig

@Module({})
class ModuleTwo extends hostTwo.build() {
   static forRoot(config: PublicConfigTwo): DynamicModule {
      return super.forRoot(config)
   }
}

const injectionOne = {
   theBox: theBoxOne,
}
const hostOne = InjectableModuleClassFactory.create(
   injectionOne,
   (_config: ConfigOne): DefaultDirector => {
      return (builder: IDynamicModuleBuilder) => {
         builder.exportProviders({
            provide: theBoxTwo,
            useExisting: theBoxOne,
         })
      }
   },
)
export type PublicConfigOne = typeof hostOne.externalConfig

@Module({})
class ModuleOne extends hostOne.build() {
   static forRoot(config: PublicConfigOne): DynamicModule {
      return super.forRoot(config)
   }
}

const innerConduitModule: DynamicModule = SimpleDynamicModule.registerModule(
   (builder: IDynamicModuleBuilder): void => {
      builder.exportProviders({
         provide: theBox,
         useFactory: () => {
            console.log("The 100 box")
            return new Box(100)
         },
      })
   },
)

@Module({})
class ModuleZero extends InjectableModuleClassFactory.create(
   {},
   (_config: ConfigOne): DefaultDirector => {
      return (builder: IDynamicModuleBuilder): void => {
         builder.exportProviders({
            provide: anotherBox,
            useFactory: () => {
               console.log("The 150 box")
               return new Box(150)
            },
         })
      }
   },
).build() {}

const appImports = [
   innerConduitModule,
   ModuleOne.forRoot({
      value: "thing",
      theBox: {
         use: "token",
         for: "value",
         token: theBox,
         module: innerConduitModule,
      },
   }),
   ModuleTwo.forRoot({
      value: "water",
      anotherBox: {
         use: "token",
         for: "value",
         token: anotherBox,
         module: ModuleZero.forRoot({
            value: "zero",
         }),
      },
   }),
]
appImports.push(
   ModuleFour.forRoot({
      value: "truth",
      theBox: {
         use: "token",
         for: "value",
         token: theBoxOne,
         module: appImports[1],
      },
      anotherBox: {
         use: "token",
         for: "value",
         token: theBoxTwo,
         module: appImports[2],
      },
   }),
)
@Module({
   imports: appImports,
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
