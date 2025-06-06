var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from "@nestjs/common";
import { PlottingModule, PlottingModuleConfiguration } from "../../plotting/di/index.js";
import { PaintingModule } from "../../painting/di/index.js";
import { AppService } from "../components/AppService.js";
import { AppController } from "../components/AppController.js";
import { SharedBlockstoresModule } from "./SharedBlockstoresModule.js";
import { SharedBlockstoresModuleTypes } from "./SharedBlockstoresModuleTypes.js";
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            SharedBlockstoresModule,
            PlottingModule.registerAsync({
                imports: [SharedBlockstoresModule],
                useFactory: (blockstore) => new PlottingModuleConfiguration(blockstore),
                inject: [SharedBlockstoresModuleTypes.SharedMapBlockstore]
            }),
            PaintingModule
        ],
        providers: [AppService, AppController],
        exports: [AppService, AppController, PlottingModule, PaintingModule]
        // providers: [ AppService, AppServiceTwo, AppController ],
        // exports: [ AppServiceTwo, AppService, AppController, PlottingModule, PaintingModule ]
    })
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
], AppModule);
export { AppModule };
//# sourceMappingURL=AppModule2.js.map