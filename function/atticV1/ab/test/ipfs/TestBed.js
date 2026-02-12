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
import { Inject, Injectable } from '@nestjs/common';
import { CID } from "multiformats";
import { BaseBlockstore } from "blockstore-core";
import { MY_BLOCK_STORE } from "./TestTypes.js";
// import { FsBlockstore } from './../../src/ipfs/components/FsBlockstore.js'
const vals1 = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const vals2 = Uint8Array.from([11, 21, 31, 41, 51, 61, 71, 81, 91, 101]);
const key1 = CID.parse("QmNpkD74ocpUBFztzcAf9KRGXCE7be6C3SDjtSy3dBFDzR");
const key2 = CID.parse("QmeXewWTbGUnvAPQ5VUcJ2uF3PX1uWbZg1Yjk9EJzQqzXF");
let TestBed = class TestBed {
    blockStore;
    constructor(blockStore) {
        this.blockStore = blockStore;
    }
    async initTest() {
        console.log("Initting");
        console.log(this.blockStore);
        console.log("Initted");
        // this.blockStore.open()
        console.log(await this.blockStore.put(key1, vals1));
        console.log(await this.blockStore.get(key1));
        try {
            console.log(await this.blockStore.get(key2));
        }
        catch {
            await this.blockStore.put(key2, vals2);
            console.log(await this.blockStore.get(key2));
        }
        return "Ok";
    }
};
TestBed = __decorate([
    Injectable(),
    __param(0, Inject(MY_BLOCK_STORE)),
    __metadata("design:paramtypes", [BaseBlockstore])
], TestBed);
export { TestBed };
//# sourceMappingURL=TestBed.js.map