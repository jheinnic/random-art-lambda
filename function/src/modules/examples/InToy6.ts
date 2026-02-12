import {
   Module,
   Injectable,
   Inject,
   DynamicModule,
   Logger,
} from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import {
   simpleDynamicModule,
   IDynamicModuleBuilder,
   ModuleDependenciesOption,
} from "../index.js"

const theBoxOne: unique symbol = Symbol("TheOneBox")
const anotherBoxOne: unique symbol = Symbol("AnotherOneBox")
const theBoxTwo: unique symbol = Symbol("TheTwoBox")
const anotherBoxTwo: unique symbol = Symbol("AnotherTwoBox")
const theBoxThree: unique symbol = Symbol("TheThreeBox")
const anotherBoxThree: unique symbol = Symbol("AnotherThreeBox")

const theBox: unique symbol = Symbol("TheBox")
const anotherBox: unique symbol = Symbol("AnotherBox")

const logger: Logger = new Logger("GlobalLogs")

@Injectable()
export class Box {
   constructor(public readonly value: number = 25) {
      logger.log(`Created a box with ${value}`)
   }
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
      logger.log("This crate is: " + this.value.toString())
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

export interface PublicConfigThree {
   value: string
   theBox: ModuleDependenciesOption
   anotherBox: ModuleDependenciesOption
}

@Module({})
export class ModuleThree extends simpleDynamicModule("ModuleThree") {
   static register(config: PublicConfigThree): DynamicModule {
      return this.registerModule((builder: IDynamicModuleBuilder) => {
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
            .importDependencies(
               [theBox, config.theBox],
               [anotherBox, config.anotherBox],
            )
      })
   }
}

@Module({})
export class ModuleFour extends simpleDynamicModule("ModuleFour") {
   public static forRoot(config: PublicConfigThree): DynamicModule {
      return this.registerModule((builder: IDynamicModuleBuilder): void => {
         builder.exportModules(
            ModuleThree.register({
               value: "thrown",
               anotherBox: config.anotherBox,
               theBox: config.theBox,
            }),
         )
         // .exportProviders(Crate)
      })
   }
}

export interface PublicConfigTwo {
   value: string
   anotherBox: ModuleDependenciesOption // anotherBoxTwo,
}

@Module({})
class ModuleTwo extends simpleDynamicModule("ModuleTwo") {
   static forRoot(config: PublicConfigTwo): DynamicModule {
      return this.registerModule((builder: IDynamicModuleBuilder) => {
         builder
            .exportProviders({
               provide: anotherBoxOne,
               useExisting: anotherBoxTwo,
            })
            .importDependencies([anotherBoxTwo, config.anotherBox])
      })
   }
}

export interface PublicConfigOne {
   value: string
   theBox: ModuleDependenciesOption
}

@Module({})
class ModuleOne extends simpleDynamicModule("ModuleOne") {
   static forRoot(config: PublicConfigOne): DynamicModule {
      return this.registerModule((builder: IDynamicModuleBuilder) => {
         builder
            .exportProviders({
               provide: theBoxTwo,
               useExisting: theBoxOne,
            })
            .importDependencies([theBoxOne, config.theBox])
      })
   }
}

@Module({})
export class InnerConduitModule extends simpleDynamicModule(
   "InnerConduitModule",
) {}

const innerConduitModule: DynamicModule = InnerConduitModule.registerModule(
   (builder: IDynamicModuleBuilder): void => {
      builder.exportProviders({
         provide: theBox,
         useFactory: () => {
            logger.log("Creating the 100 box")
            return new Box(100)
         },
      })
   },
)

@Module({})
class ModuleZero extends simpleDynamicModule("ModuleZero") {
   static forRoot(_config: { value: string }): DynamicModule {
      return this.registerModule((builder: IDynamicModuleBuilder): void => {
         builder.exportProviders({
            provide: anotherBox,
            useFactory: () => {
               logger.log("Creating the 150 box")
               return new Box(150)
            },
         })
      })
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
   logger.log([
      theBoxInst,
      theBoxOneA,
      anotherBoxOneA,
      theBoxTwoA,
      anotherBoxTwoA,
      theBoxThreeA,
      anotherBoxThreeA,
   ])
   const appSvc = app.get(CrateService)
   logger.log(appSvc)
   logger.log(appSvc.crate)
   logger.log(appSvc.crate.boxOne)
   logger.log(appSvc.crate.boxOne.value)
   logger.log(appSvc.crate.boxTwo)
   logger.log(appSvc.crate.boxTwo.value)
   logger.log(appSvc.crate.value)
   logger.log("Done")
}

bootstrap().catch((x: unknown): void => console.error(x))
