import { Inject } from "@nestjs/common"
import { Get, Controller, Render } from '@nestjs/common'

import { AppService } from '../components/AppService.js'

@Controller()
export class AppController {
    public constructor (
        @Inject( AppService )
        private readonly service: AppService
    ) {
        console.log( service, "controller" )
    }

    @Get()
    @Render( 'index.hbs' )
    root() {
        return { message: 'Hello world' }
    }
}