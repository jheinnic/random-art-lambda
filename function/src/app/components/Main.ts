import { NestFactory } from "@nestjs/core"
// import { sha256 as hash } from "multiformats/hashes/sha2"

// import { CID } from "multiformats"
import { AppModule } from "../di/index.js"
import { AppServiceTwo } from "./AppServiceTwo.js"
import { INestApplicationContext, Logger } from "@nestjs/common"

const outerLogger: Logger = new Logger("Bootstrap")

process.on("unhandledRejection", (reason: Error, promise) => {
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
   process.exit(2)
   // throw reason;
})
process.on("uncaughtException", (error) => {
   outerLogger.error("Beep!")
   outerLogger.error("UNCAUGHT EXCEPTION:", error)
   outerLogger.error(error.message)
   // Safely exit the process
   process.exit(1)
})

async function bootstrap(): Promise<INestApplicationContext> {
   const logger: Logger = new Logger("Bootstrap")
   try {
      console.log("Loading")
      const app: INestApplicationContext =
         await NestFactory.createApplicationContext(AppModule, {
            abortOnError: false,
            snapshot: true,
            logger: ["fatal", "error", "warn", "log", "verbose", "debug"],
         })
      logger.log("Application context loaded")
      const appSvc = app.get(AppServiceTwo)
      console.log(appSvc)

      // await appSvc.testRun()
      await appSvc.loadRepo()

      // This has not been tried
      // const regionMap = appSvc.testRepo( CID.parse( "zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJtn9V1v" ) )

      // This exists, but does not follow the model
      // const regionMap = appSvc.testRepo( CID.parse( "zdpuB381N99CGFwmnVCXfubQANt8ZnSW3sk3Hy8YEYyB1fRGP" ) )

      // These do not exist
      // const regionMap = appSvc.testRepo( CID.parse( "zdj7WVuzaY8f6J53yJpjM8H1hFq9QRZKBWKukdGZFMiScp8AM" ) )
      // const regionMap = appSvc.testRepo( CID.parse( "QmeXewWTbGUnvAPQ5VUcJ2uF3PX1uWbZg1Yjk9EJzQqzXF" ) )

      // This is current
      // const regionMap = appSvc.testRepo( CID.parse( "bafyreicqvrftolzvv3jhmqptkezch7f7dlfomu6mmv3cihqmerg274x3ky" ) )
      // console.log( regionMap )

      // appSvc.testRepoSave()
      return app
   } catch (err) {
      logger.error(err.message)
      logger.error("Exception thrown?", err)
      throw err
   }
}

bootstrap().catch((x: unknown): void => console.error(x))
// tn / 9V / 1v / zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJ
