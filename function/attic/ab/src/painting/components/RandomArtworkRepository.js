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
import * as codec from "@ipld/dag-cbor";
import { Inject, Injectable } from "@nestjs/common";
import { decode } from "multiformats/block";
import { sha256 as hasher } from "multiformats/hashes/sha2";
import { SharedBlockstoresModuleTypes } from "../../app/di/index.js";
import { BUILD_VERSION, RELEASE_VERSION } from "../../app/interfaces/index.js";
import { PaintingModuleTypes } from "../di/PaintingModuleTypes";
let RandomArtworkRepository = class RandomArtworkRepository {
    blockStore;
    schemaDsl;
    constructor(blockStore, schemaDsl) {
        this.blockStore = blockStore;
        this.schemaDsl = schemaDsl;
    }
    async save(source) {
        // validate and transform ro block-encodable representation form
        const sourceData = {
            prefix: source.prefix,
            suffix: source.suffix,
            regionMap: source.regionMap,
            engineVersion: `${RELEASE_VERSION}.${BUILD_VERSION}`
        };
        // Encode
        const rootBlock = await this.schemaDsl.toBlock(sourceData);
        // Store
        await this.blockStore.put(rootBlock.cid, rootBlock.bytes, {});
        return rootBlock.cid;
    }
    async load(cid) {
        const bytes = await this.blockStore.get(cid);
        const rootBlock = await decode({ codec, hasher, bytes });
        const typedData = this.schemaDsl.fromBlock(rootBlock);
        console.dir(typedData, { depth: Infinity });
        console.log(typedData.constructor.name);
        return typedData;
    }
};
RandomArtworkRepository = __decorate([
    Injectable(),
    __param(0, Inject(SharedBlockstoresModuleTypes.SharedArtBlockstore)),
    __param(1, Inject(PaintingModuleTypes.IRandomArtworkSchemaDsl)),
    __metadata("design:paramtypes", [Object, Object])
], RandomArtworkRepository);
export { RandomArtworkRepository };
//# sourceMappingURL=RandomArtworkRepository.js.map