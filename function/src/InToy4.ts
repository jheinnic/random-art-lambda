import { Module, Injectable, Inject, DynamicModule } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import {
   SimpleDynamicModule,
   IDynamicModuleBuilder,
   DefaultDirector,
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
const moduleThreeHost = new InjectableModuleClassFactory<
   ConfigOne,
   typeof importTokens,
   "forRootImpl"
>(importTokens, "forRootImpl")

// type foo = typeof moduleZeroHost.externalConfigType
// const af: foo = {
//    value: "false",
// theBox: { use: "value", a: 8, value: theBoxTwo },
// anotherBox: { use: "token", token: anotherBoxThree },
// }
// type ConfigOneExternal = typeof moduleThreeHost.externalConfigType
// type ConfigOne = typeof moduleThreeHost.internalConfigType
const ModuleThreeBase = moduleThreeHost.build()

@Module({})
export class ModuleThree extends ModuleThreeBase {
   public static forRootImpl(_config: ConfigOne): DefaultDirector {
      return (builder: IDynamicModuleBuilder) => {
         builder.exportProviders(Crate)
      }
   }
}

@Module({})
export class ModuleFour extends new InjectableModuleClassFactory<
   ConfigOne,
   typeof importTokens,
   "forRootImpl"
>(importTokens, "forRootImpl").build() {
   public static forRootImpl(_config: ConfigOne): DefaultDirector {
      return (builder: IDynamicModuleBuilder) => {
         builder.exportModules(
            ModuleThree.forRoot({
               value: "thrown",
               anotherBox: {
                  use: "token",
                  for: "value",
                  token: anotherBox,
               },
               theBox: {
                  use: "token",
                  for: "value",
                  token: theBox,
               },
            }),
         )
      }
   }
}

const injectionTwo = {
   anotherBox: anotherBoxTwo,
}
@Module({})
class ModuleTwo extends new InjectableModuleClassFactory<
   ConfigOne,
   typeof injectionTwo,
   "forRootImpl"
>(injectionTwo, "forRootImpl", false).build() {
   public static forRootImpl(_config: ConfigOne): DefaultDirector {
      return (builder: IDynamicModuleBuilder) => {
         builder.exportProviders({
            provide: anotherBoxOne,
            useExisting: anotherBoxTwo,
         })
      }
   }
}

const injectionOne = {
   theBox: theBoxOne,
}
@Module({})
class ModuleOne extends new InjectableModuleClassFactory<
   ConfigOne,
   typeof injectionOne,
   "forRootImpl"
>(injectionOne, "forRootImpl", false).build() {
   public static forRootImpl(_config: ConfigOne): DefaultDirector {
      return (builder: IDynamicModuleBuilder) => {
         builder.exportProviders({
            provide: theBoxTwo,
            useExisting: theBoxOne,
         })
      }
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

class ModuleZero extends new InjectableModuleClassFactory<
   ConfigOne,
   {},
   "forRootImpl"
>({}, "forRootImpl", false).build() {
   static forRootImpl(_config: ConfigOne): DefaultDirector {
      return (builder: IDynamicModuleBuilder): void => {
         builder.exportProviders({
            provide: anotherBox,
            useFactory: () => {
               console.log("The 150 box")
               return new Box(150)
            },
         })
      }
   }
}

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
