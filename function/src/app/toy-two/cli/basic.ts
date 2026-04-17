import { INestApplicationContext, Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { CliAppModule } from "../di/CliAppModule.js"
import { GenericService } from "../components/GenericService.js"

process.on("unhandledRejection", (reason, promise) => {
   console.error("UNHANDLED REJECTION:", reason)
   promise
      .then((x) => {
         console.error(x)
      })
      .catch((x) => {
         console.error(x)
      })
   // Safely exit the process
   process.exit(2)
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
      const genericService: GenericService = app.get(GenericService)
      logger.log("Running genericService.run()")
      logger.log(await genericService.run())
      logger.log("Exiting...")
      return app
   } catch (err) {
      console.error("Exception thrown?")
      throw err
   }
}

await bootstrap()

// tn / 9V / 1v / zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJ
