/**
 * The ExtensibleModuleFactory was a precursor to the Zod refactoring attempt and was an
 * attempt to inject dependency token handlers by adding them to the forRoot() registration
 * function Tuple.  This was complicated, and did not have a solution for accepting data
 * configuration or for combining that with dependency injection.   It was abandoned to
 * attempt to use zod to manipulate a single schema object.   Focusing on a single object
 * interface would prove to be a better, but zod was unnecessary and problematic, so
 * the InjectableModuleClassFactory that follows dropped the use of a Fluent API for
 * contract definition and is found in InToy5.ts
 */
import {
   Module,
   Injectable,
   Inject,
   DynamicModule,
   Logger,
} from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { SimpleDynamicModule } from "./modules/di/SimpleDynamicModule.js"

import {
   DependencySolution,
   DependentModuleFactory,
} from "../attic/common/di/ExtensibleModuleFactory.js"
import { IDynamicModuleBuilder } from "./modules/index.js"

const theBoxOne: unique symbol = Symbol("TheOneBox")
const anotherBoxOne: unique symbol = Symbol("AnotherOneBox")
const theBoxTwo: unique symbol = Symbol("TheTwoBox")
const anotherBoxTwo: unique symbol = Symbol("AnotherTwoBox")
// const theBoxThree: unique symbol = Symbol("TheThreeBox")
// const anotherBoxThree: unique symbol = Symbol("AnotherThreeBox")

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
      @Inject(theBox)
      public readonly boxOne: Box,
      @Inject(anotherBox)
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

interface DependentsThree {
   [theBox]: Box
   [anotherBox]: Box
}

export const ModuleThreeHost = new DependentModuleFactory<DependentsThree>([
   theBox,
   anotherBox,
]).build()

@Module({
   providers: [
      Crate,
      ModuleThreeHost.dependentProviders[theBox],
      ModuleThreeHost.dependentProviders[anotherBox],
   ],
   exports: [Crate],
})
export class ModuleThree extends ModuleThreeHost.moduleClass {
   static forRoot(options: DependencySolution<DependentsThree>): DynamicModule {
      const retVal = super.forRoot(options)
      return {
         ...retVal,
         module: ModuleThree,
      }
   }
}

@Module({
   imports: [ModuleThree],
   exports: [Crate],
})
export class ModuleFour {}

@Module({})
export class ModuleTwo {
   public static register(config: ConfigOne): DynamicModule {
      return {
         module: ModuleTwo,
         imports: [config.theConduit, ModuleThree],
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
         exports: [theBoxTwo, anotherBoxTwo],
      }
   }
}

@Module({})
export class ModuleOne {
   public static register(config: ConfigOne): DynamicModule {
      return {
         module: ModuleOne,
         imports: [config.theConduit],
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
         exports: [theBoxOne, anotherBoxOne],
      }
   }
}

const innerConduitModule: DynamicModule = SimpleDynamicModule.registerModule(
   "InnerConduitModule",
   (builder: IDynamicModuleBuilder): void => {
      builder.exportProviders(
         {
            provide: theBox,
            useFactory: () => {
               console.log("Created the 100 box")
               return new Box(100)
            },
         },
         {
            provide: anotherBox,
            useFactory: () => {
               console.log("Created the 150 box")
               return new Box(150)
            },
         },
      )
   },
)
const temp = ModuleThree.forRoot({
   [theBox]: { module: innerConduitModule, export: theBox },
   [anotherBox]: { module: innerConduitModule, export: theBox },
})

@Module({
   imports: [
      innerConduitModule,
      temp,
      ModuleOne.register({
         theConduit: innerConduitModule,
      }),
      ModuleTwo.register({
         theConduit: innerConduitModule,
      }),
      ModuleThree,
   ],
   providers: [CrateService],
   exports: [temp, CrateService],
})
export class AppModule {}

async function bootstrap(): Promise<void> {
   try {
      const app = await NestFactory.createApplicationContext(AppModule, {
         abortOnError: false,
         snapshot: true,
      })
      // const theBoxInst = app.get(theBox)
      // const theBoxOneA = app.get(theBoxOne)
      // const anotherBoxOneA = app.get(anotherBoxOne)
      // const theBoxTwoA = app.get(theBoxTwo)
      // const anotherBoxTwoA = app.get(anotherBoxTwo)
      // const theBoxThreeA = app.get(theBoxThree)
      // const anotherBoxThreeA = app.get(anotherBoxThree)
      // console.log([
      //    theBoxInst,
      //    theBoxOneA,
      //    anotherBoxOneA,
      //    theBoxTwoA,
      //    anotherBoxTwoA,
      //    theBoxThreeA,
      //    anotherBoxThreeA,
      // ])
      console.log("Application context is ready!")
      const appSvc = app.get(CrateService)
      console.log(appSvc)
      console.log(appSvc.crate)
      console.log(appSvc.crate.boxOne)
      console.log(appSvc.crate.boxOne.value)
      console.log(appSvc.crate.boxTwo)
      console.log(appSvc.crate.boxTwo.value)
      console.log(appSvc.crate.value)
      console.log("Done")
   } catch (err) {
      const logger = new Logger("root")
      logger.error(err)
   }
}

bootstrap().catch((x: unknown): void => console.error(x))
