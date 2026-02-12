import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"

import { AppService } from "./app/components/AppService.js"
import { AppModule } from "./app/di/AppModule2.js"
import { IncomingMessage, Server } from "node:http"

async function bootstrap(): Promise<void> {
   const app: NestExpressApplication<Server<typeof IncomingMessage>> =
      await NestFactory.create<NestExpressApplication>(AppModule)
   const appService = app.get(AppService)
   console.log(appService.getAWorkList())
}
void bootstrap()
