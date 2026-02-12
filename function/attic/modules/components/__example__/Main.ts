import { NestFactory } from "@nestjs/core"
import { INestApplicationContext, Logger } from "@nestjs/common"
import { exit } from "node:process"

import { AppModule } from "./AppModule.js"
import { Service } from "./Service.js"
import { ServiceModuleTypes } from "./ServiceModuleTypes.js"

const outerLogger: Logger = new Logger("Outer Bootstrap")

process.on(
   "unhandledRejection",
   (reason: Error, promise: Promise<unknown>): never => {
      outerLogger.error("Beep!")
      outerLogger.error("UNHANDLED REJECTION:", reason)
      outerLogger.error(reason.message)
      promise
         .then((x) => {
            outerLogger.error("ThenHandler")
            outerLogger.error(x)
         })
         .catch((x) => {
            outerLogger.error("CatchHandler")
            outerLogger.error(x)
         })
      exit(2)
   },
)
process.on("uncaughtException", (error: Error): never => {
   // outerLogger.error("Beep!")
   outerLogger.error("UNCAUGHT EXCEPTION:", error.message)
   // outerLogger.error(error.message)
   // Safely exit the process
   exit(1)
})

async function bootstrap(): Promise<INestApplicationContext> {
   const logger: Logger = new Logger("Inner Bootstrap")
   try {
      logger.log("Loading")

      const app: INestApplicationContext =
         await NestFactory.createApplicationContext(AppModule, {
            abortOnError: false,
            snapshot: true,
            logger: ["fatal", "error", "warn", "log", "verbose", "debug"],
         })
      logger.log("Application context loaded")

      const appSvc: Service = app.get(ServiceModuleTypes.Service)
      logger.log("Got Service")
      logger.log(appSvc.doSongAndDance())
      logger.log("Walk of Shame")

      return app
   } catch (err) {
      logger.error("Exiting through caught exception", err)
      if (process.exitCode === 0) {
         exit(255)
      }
      throw err
   }
}

function goAway(): never {
   return null as never
}

console.log("Go away: ", goAway())

const myApp = await bootstrap()
outerLogger.log("Safe startup")
await myApp.close()
outerLogger.log("Safe shutdown")
