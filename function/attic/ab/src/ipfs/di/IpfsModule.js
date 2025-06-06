var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from "@nestjs/common";
import { buildLruCache, FsBlockstore } from "../components/FsBlockstore.js";
import { ConfigurableModuleClass } from "./IpfsModuleDefinition.js";
import { IpfsModuleTypes } from "./IpfsModuleTypes.js";
let IpfsModule = class IpfsModule extends ConfigurableModuleClass {
    // static module = initializer(IpfsModule)
    static register(config) {
        return super.register(config);
    }
    static registerAsync(options) {
        return super.registerAsync(options);
    }
};
IpfsModule = __decorate([
    Module({
        providers: [
            {
                provide: IpfsModuleTypes.LruCache,
                useFactory: buildLruCache,
                inject: [IpfsModuleTypes.FsBlockstoreConfiguration]
            },
            { provide: IpfsModuleTypes.AbstractBlockstore, useClass: FsBlockstore }
        ],
        exports: [IpfsModuleTypes.AbstractBlockstore]
    })
], IpfsModule);
export { IpfsModule };
//# sourceMappingURL=IpfsModule.js.map