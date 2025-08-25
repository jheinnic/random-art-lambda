import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
// import { sha256 as hash } from "multiformats/hashes/sha2"
// import { CID } from "multiformats"
import { CliAppModule } from "./app/Module.js"
import { GenericService } from "./main/components/GenericService.js"


async function bootstrap(): Promise<void> {
   try {
      console.log("Loading")
      const app = await NestFactory.createApplicationContext(CliAppModule, {
         abortOnError: false,
         logger: ["error", "warn", "log", "verbose", "debug"],
      })
      const logger: Logger = app.get(Logger)
      logger.log("Application context loaded")
      const genericService: GenericService = app.get(GenericService)

      logger.log(genericService)
      logger.log(await genericService.run())
      logger.log("Exiting...")
   } catch {
      console.error("Exception thrown?")
   }
}

bootstrap().catch((x) => console.error(x))
// tn / 9V / 1v / zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJ
