import { Inject, Get, Controller, Render, StreamableFile } from "@nestjs/common"

import { AppService } from "../components/AppService.js"

@Controller()
export class AppController {
   public constructor(
      @Inject(AppService)
      private readonly service: AppService,
   ) {
      console.log(service, "controller")
   }

   @Get()
   @Render("index.hbs")
   root(): { message: string } {
      return { message: "Hello world" }
   }

   // @Get()
   // paintAndDownload(): StreamableFile {
   //    StreamableFile
   // }
}
