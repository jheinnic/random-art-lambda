import { NestFactory } from "@nestjs/core"

import { AppService } from "./app/components/AppService"
import { AppModule } from "./app/di/AppModule"

async function bootstrap (): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule)
  const appService = app.get(AppService)
  console.log(appService.testCommand())
}
bootstrap()
