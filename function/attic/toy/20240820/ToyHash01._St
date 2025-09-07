import { NestFactory } from "@nestjs/core"

import { GCHashFactory } from "./ToyComps01.js"
import { AppModule } from "./ToyModule01.js"

async function bootstrap (): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule)
  const appService = app.get(GCHashFactory)
  // appService.run()
  console.log("Shut 'er down or you're fired!")
}
bootstrap()
