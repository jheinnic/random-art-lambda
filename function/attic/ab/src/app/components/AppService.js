var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from "@nestjs/common";
import { PlottingModuleTypes } from "../../plotting/di/index.js";
let AppService = class AppService {
    mapRepo;
    constructor(mapRepo) {
        this.mapRepo = mapRepo;
    }
    testRepo() {
        // const artTask = this.repository.create(
        //   "cidBits",
        //   Uint8Array.of(84, 81, 81, 190),
        //   Uint8Array.of(182, 81, 143, 94, 88, 104),
        // )
        console.log("Finished execute!");
    }
    testCommand() {
        console.log("Finish him!");
    }
};
AppService = __decorate([
    Injectable(),
    __param(0, Inject(PlottingModuleTypes.IRegionMapRepository)),
    __metadata("design:paramtypes", [Object])
], AppService);
export { AppService };
//# sourceMappingURL=AppService.js.map