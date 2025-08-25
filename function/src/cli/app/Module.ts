import { Module } from "@nestjs/common"
import { CliMainModule } from "../main/di/Module.js"

import { cliMainModuleAsyncOptions } from "./Imports.js"

@Module({
   imports: [CliMainModule.registerAsync(cliMainModuleAsyncOptions)],
   providers: [],
   exports: [CliMainModule],
})
export class CliAppModule {}
