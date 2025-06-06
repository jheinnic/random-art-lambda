var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from "@nestjs/common";
import { IpldModule } from "../../ipld/di/index.js";
import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js";
import { PBufAdapterFactory } from "../protobuf/PBufAdapterFactory.js";
import { ConfigurableModuleClass } from "./PlottingModuleDefinition.js";
import { PlottingModuleTypes } from "./PlottingModuleTypes.js";
import { configProvider } from "./IpldRegionMapSchemaDsl.js";
let PlottingModule = class PlottingModule extends ConfigurableModuleClass {
    registerAsync(options) {
        return super.registerAsync(options);
    }
};
PlottingModule = __decorate([
    Module({
        imports: [IpldModule.register(configProvider)],
        providers: [
            {
                provide: PlottingModuleTypes.IRegionMapRepository,
                useClass: IpldRegionMapRepository
            },
            /*{
              provide: PlottingModuleTypes.IModelEnvelopeSerdes,
              useClass: IpldRegionMapSchemaDsl
            },*/
            {
                provide: PlottingModuleTypes.ProtoBufAdapterFactory,
                useClass: PBufAdapterFactory
            },
            {
                provide: PlottingModuleTypes.InjectedBlockStore,
                useFactory: (config) => {
                    return config.blockStore;
                },
                inject: [PlottingModuleTypes.PlottingModuleConfiguration]
            }
        ],
        exports: [PlottingModuleTypes.IRegionMapRepository, PlottingModuleTypes.ProtoBufAdapterFactory, IpldModule]
    })
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class, @typescript-eslint/no-unused-vars
], PlottingModule);
export { PlottingModule };
//# sourceMappingURL=PlottingModule.js.map