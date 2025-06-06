var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from "@nestjs/common";
import { IpfsModule } from "../../ipfs/di/IpfsModule.js";
import { SharedBlockstoresModuleTypes } from "./SharedBlockstoresModuleTypes.js";
let SharedBlockstoresModule = class SharedBlockstoresModule {
};
SharedBlockstoresModule = __decorate([
    Module({
        imports: [
            IpfsModule.register({ rootPath: "/home/ionadmin/Documents/artBlocks", cacheSize: 500, injectToken: SharedBlockstoresModuleTypes.SharedArtBlockstore }),
            IpfsModule.register({ rootPath: "/home/ionadmin/Documents/mapBlocks", cacheSize: 4000, injectToken: SharedBlockstoresModuleTypes.SharedMapBlockstore }),
            IpfsModule.register({ rootPath: "/home/ionadmin/Documents/taskBlocks", cacheSize: 500, injectToken: SharedBlockstoresModuleTypes.SharedTaskBlockstore })
        ],
        exports: [IpfsModule]
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-extraneous-class
], SharedBlockstoresModule);
export { SharedBlockstoresModule };
//# sourceMappingURL=SharedBlockstoresModule.js.map