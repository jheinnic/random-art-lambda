import { INestApplicationContext, Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { Chan, put, take } from "medium"
import { CliChannelsModuleTypes } from "./channels/Types.js"
import { CliAppModule } from "./app/Module.js"
import { GenericService } from "./main/components/GenericService.js"

process.on("unhandledRejection", (reason, promise) => {
   console.error("UNHANDLED REJECTION:", reason)
   promise
      .then((x) => {
         console.error(x)
      })
      .catch((x) => {
         console.error(x)
      })
   process.exit(2)
   // throw reason;
})
process.on("uncaughtException", (error) => {
   console.error("UNCAUGHT EXCEPTION:", error)
   // Safely exit the process
   process.exit(1)
})

async function bootstrap(): Promise<INestApplicationContext> {
   try {
      console.log("Loading")
      const app: INestApplicationContext =
         await NestFactory.createApplicationContext(CliAppModule, {
            abortOnError: false,
            snapshot: true,
            logger: ["fatal", "error", "warn", "log", "verbose", "debug"],
         })
      const logger: Logger = new Logger("Bootstrap")
      logger.log("Application context loaded")
      const callChan: Chan = app
         .get(CliChannelsModuleTypes.EnrollSourceFileCallChannel)
         .unwrap()
      await put(callChan, 7)
      logger.warn(await take(callChan))
      const genericService: GenericService = app.get(GenericService)

      logger.log(genericService)
      logger.log(await genericService.run())
      logger.log("Exiting...")
      return app
   } catch (err) {
      console.error("Exception thrown?")
      throw err
   }
}

await bootstrap()

// .catch((x) => console.error(x))
// tn / 9V / 1v / zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJ
