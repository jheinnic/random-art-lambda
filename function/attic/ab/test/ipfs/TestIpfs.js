import { NestFactory } from "@nestjs/core";
import { MY_TEST_BED } from './TestTypes.js';
import { TestModule } from './TestMod.js';
async function bootstrap() {
    const app = await NestFactory.createApplicationContext(TestModule);
    const testBed = app.get(MY_TEST_BED);
    console.log(testBed.initTest());
    console.log("Returning");
}
await bootstrap();
//# sourceMappingURL=TestIpfs.js.map