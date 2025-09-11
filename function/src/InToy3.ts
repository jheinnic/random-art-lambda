import { Module, Injectable, Inject, DynamicModule } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import {
   DynamicConduitModule,
   IConduitModuleBuilder,
} from "./di/DynamicConduitModule.js"

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

export interface ConfigOne {
   theConduit: DynamicModule
}

export interface ConfigTwo {
   theBox: DynamicModule
   anotherBox: DynamicModule
   moduleThree: DynamicModule
}

const conduitModule = DynamicConduitModule.registerModule(
   (builder: IConduitModuleBuilder): void => {
      builder
         .addProviders(
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
         .addExports(theBox, anotherBox)
   },
)

@Module({})
export class ModuleThree {
   public static register(config: ConfigOne): DynamicModule {
      return {
         module: ModuleThree,
         imports: [config.theConduit],
         providers: [
            {
               provide: anotherBoxThree,
               useFactory: (anotherBox: Box): Box => anotherBox,
               inject: [anotherBox],
            },
            {
               provide: theBoxThree,
               useFactory: (theBox: Box): Box => theBox,
               inject: [theBox],
            },
            Crate,
         ],
         exports: [Crate],
      }
   }
}

@Module({})
export class ModuleFour {
   public static register(config: ConfigOne): DynamicModule {
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

@Module({
   imports: [
      conduitModule,
      ModuleOne.register({
         theConduit: conduitModule,
      }),
      ModuleTwo.register({
         theConduit: conduitModule,
      }),
      ModuleThree.register({
         theConduit: conduitModule,
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
