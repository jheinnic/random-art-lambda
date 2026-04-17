import { NestFactory } from "@nestjs/core"
import { ConfigService } from "@nestjs/config"
import { INestApplicationContext, Logger } from "@nestjs/common"
import { exit } from "node:process"

import { AppModule } from "../di/index.js"
import { AppService } from "../components/AppService.js"
import { AppConfigModule } from "../../shared/di/AppConfigModule.js"
import { appModuleImports } from "../../shared/di/Imports.js"

const outerLogger: Logger = new Logger("Bootstrap")

process.on(
   "unhandledRejection",
   (reason: Error, promise: Promise<unknown>): never => {
      outerLogger.error("Beep!")
      outerLogger.error("UNHANDLED REJECTION:", reason)
      outerLogger.error(reason.message)
      promise
         .then((x) => {
            outerLogger.error(x)
         })
         .catch((x) => {
            outerLogger.error(x)
         })
      exit(2)
   },
)
process.on("uncaughtException", (error: Error): never => {
   outerLogger.error("UNCAUGHT EXCEPTION:", error.message)
   exit(1)
})

async function bootstrap(): Promise<INestApplicationContext> {
   const logger: Logger = new Logger("Bootstrap")
   try {
      logger.log("Loading")

      // const AppConfigModule = await import("../di/ConfigModule.js") // as IEntryNestModule
      const config: INestApplicationContext =
         await NestFactory.createApplicationContext(AppConfigModule.forRoot(), {
            abortOnError: false,
            snapshot: true,
            logger: ["fatal", "error", "warn", "log", "verbose", "debug"],
         })
      const configSvc: ConfigService = config.get(ConfigService)
      configSvc.get("paint")
      await config.close()
      logger.log("Configured...")
      const dynamicImports = appModuleImports(configSvc)
      const app: INestApplicationContext =
         await NestFactory.createApplicationContext(
            AppModule.registerRoot(
               dynamicImports.plottingModule,
               // paintChannelModule,
               dynamicImports.paintingModule,
               dynamicImports.queueModule,
            ),
            {
               abortOnError: false,
               snapshot: true,
               logger: ["fatal", "error", "warn", "log", "verbose", "debug"],
            },
         )
      logger.log("Application context loaded")
      const appSvc: AppService = app.get(AppService)

      // await appSvc.testRun()
      // await appSvc.useSeeder()
      // while (true) {
      await appSvc.fromKeys()
      // }
      // await appSvc.loadRepo()
      // spinOnMe()

      // This has not been tried
      // const regionMap = appSvc.testRepo( CIDUtil.parse( "zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJtn9V1v" ) )

      // This exists, but does not follow the model
      // const regionMap = appSvc.testRepo( CIDUtil.parse( "zdpuB381N99CGFwmnVCXfubQANt8ZnSW3sk3Hy8YEYyB1fRGP" ) )

      // These do not exist
      // const regionMap = appSvc.testRepo( CIDUtil.parse( "zdj7WVuzaY8f6J53yJpjM8H1hFq9QRZKBWKukdGZFMiScp8AM" ) )
      // const regionMap = appSvc.testRepo( CIDUtil.parse( "QmeXewWTbGUnvAPQ5VUcJ2uF3PX1uWbZg1Yjk9EJzQqzXF" ) )

      // This is current
      // const regionMap = appSvc.testRepo( CIDUtil.parse( "bafyreicqvrftolzvv3jhmqptkezch7f7dlfomu6mmv3cihqmerg274x3ky" ) )
      // console.log( regionMap )

      // appSvc.testRepoSave()
      return app
   } catch (err) {
      logger.error("Exiting through caught exception", err)
      if (process.exitCode === 0) {
         exit(255)
      }
      // throw err
      exit()
   }
}

function goAway(): never {
   const f: never = {} as unknown as never
   return f
}

console.log(goAway())

const myApp = await bootstrap()
//    .catch((x: Error): Error => {
//    console.error(x)
//    return x
// })
// if ("close" in myApp) {
console.log("Safe startup")
// await myApp.close()
// console.log("Safe shutdown")
// } else {
//    console.error("Error shutdown")
//    throw myApp
// }
// tn / 9V / 1v / zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJ
