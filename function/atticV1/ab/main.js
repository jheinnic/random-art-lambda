import { NestFactory } from "@nestjs/core"
import { AppService } from "./app/components/AppService.js"
import { AppModule } from "./app/di/AppModule.js"
async function bootstrap() {
    const app = await NestFactory.create( AppModule )
    const appService = app.get( AppService )
    console.log( appService.testCommand() )
}
bootstrap();
//# sourceMappingURL=main.js.map