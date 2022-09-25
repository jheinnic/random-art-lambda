import { NestFactory } from "@nestjs/core";
import { AppService } from "./components/AppService";
import { AppModule } from "./di/AppModule";

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const appSvc = app.get(AppService);
    appSvc.testCommand();
}

bootstrap();