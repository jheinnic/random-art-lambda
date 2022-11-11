import { NestFactory } from "@nestjs/core"

import { AppModule } from "../di/index.js"
import { AppServiceTwo } from "./AppServiceTwo.js"

async function bootstrap (): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule)
  const appSvc = app.get(AppServiceTwo)
  console.log(appSvc)
}

bootstrap().catch((x) => console.error(x))
