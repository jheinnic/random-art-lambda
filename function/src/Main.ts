import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/di/AppModule';
import { AppService } from './app/components/AppService';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appService = app.get(AppService);
  console.log(appService.testCommand());
}
bootstrap();
