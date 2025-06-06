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
import { Canvas } from "canvas";
import { sha256 as hasher } from "multiformats/hashes/sha2";
import crypto from 'crypto';
import fs from 'fs';
import { PlottingModuleTypes } from "../../plotting/di/index.js";
import { PBufAdapterFactory } from "../../plotting/protobuf/PBufAdapterFactory.js";
import { CanvasPixelPainter } from "../../painting/components/CanvasPixelPainter.js";
import { CanvasPersister } from "../../painting/components/CanvasPersister.js";
import { GenModelArtist } from "../../painting/components/GenModelArtist.js";
import { newPicture, oldPicture } from "../../painting/components/genjs6.js";
let AppServiceTwo = class AppServiceTwo {
    mapRepo;
    adapterFactory;
    cidCache = new Map();
    constructor(mapRepo, adapterFactory) {
        this.mapRepo = mapRepo;
        this.adapterFactory = adapterFactory;
    }
    async testRepo(cid) {
        if (!this.cidCache.has(cid)) {
            await this.mapRepo.load(cid).then((loadedMap) => {
                console.log("Repo loaded:");
                console.log(loadedMap);
                if (!this.cidCache.has(cid)) {
                    this.cidCache.set(cid, loadedMap);
                }
            });
        }
        // const adapter: PBufAdapter = this.adapterFactory.adapt( "./qdoc2.proto" )
        // const modelCid: CID = await this.mapRepo.import(
        // adapter.asDirector()
        // )
        // const regionMap2: IRegionMap = await this.mapRepo.load( modelCid )
        return this.cidCache.get(cid);
    }
    async testRun0() {
        const beginString = "Happy Thanksgiving Burger";
        const beginBuf = Buffer.from(beginString);
        const beginArray = Uint8Array.from(beginBuf);
        const adapter = this.adapterFactory.adapt("./qdoc2.proto");
        const regionMap = adapter.asRegionMap();
        let hashBuf = beginArray;
        while (true) {
            hashBuf = await hasher.encode(hashBuf);
            const prefix = hashBuf.slice(0, 16);
            const suffix = hashBuf.slice(16);
            const prefStr = Buffer.from(prefix).toString('hex');
            const suffStr = Buffer.from(suffix).toString('hex');
            const fileName = `./${prefStr}_${suffStr}.png`;
            const genModel = newPicture([...prefix], [...suffix]);
            await this.doOne(genModel, regionMap, fileName);
        }
    }
    testRun1() {
        const workList = JSON.parse(fs.readFileSync("source.list").toString());
        const taskList = workList.map((task) => {
            let buf = Buffer.from(task.prefix, "hex");
            const prefix = Uint8Array.from(buf);
            buf = Buffer.from(task.suffix, "hex");
            const suffix = Uint8Array.from(buf);
            return {
                genModel: newPicture([...prefix], [...suffix]),
                fileName: `${task.prefix}_${task.suffix}.png`
            };
        });
        const sourceNames = ["qdoc4", "qdoc5", "qdoc6"];
        const regionList = sourceNames.map((sourceName) => {
            const adapter = this.adapterFactory.adapt(`./${sourceName}.proto`);
            return { name: sourceName, regionMap: adapter.asRegionMap() };
        });
        return this.runCombinations(taskList, regionList);
    }
    testRun() {
        const workList = JSON.parse(fs.readFileSync("source2.list").toString());
        const taskList = workList.map((task) => {
            const fileName = crypto.createHash('md5')
                .update(task.phrase)
                .digest()
                .toString('base64')
                .replaceAll('/', '_')
                .replaceAll('=', '');
            return {
                genModel: oldPicture(task.phrase),
                fileName: `${fileName}.png`
            };
        });
        // const sourceNames: string[] = [ "qdoc4", "qdoc5", "qdoc6" ]
        const sourceNames = ["qdoc2"];
        const regionList = sourceNames.map((sourceName) => {
            const adapter = this.adapterFactory.adapt(`./${sourceName}.proto`);
            return { name: sourceName, regionMap: adapter.asRegionMap() };
        });
        return this.runCombinations(taskList, regionList);
    }
    async runCombinations(taskList, regionList) {
        let task;
        for (task of taskList) {
            await Promise.all(regionList.map((region) => {
                const fileName = `./${region.name}/${task.fileName}`;
                return this.doOne(task.genModel, region.regionMap, fileName);
            }));
        }
    }
    async doOne(genModel, regionMap, fileName) {
        const canvas = new Canvas(regionMap.pixelWidth, regionMap.pixelHeight, 'image');
        const canvasPainter = new CanvasPixelPainter(canvas);
        const artist = new GenModelArtist(genModel, canvasPainter);
        regionMap.oldDirector(artist);
        const stream = fs.createWriteStream(fileName);
        const persister = new CanvasPersister(canvas, stream);
        await persister.finish();
    }
};
AppServiceTwo = __decorate([
    Injectable(),
    __param(0, Inject(PlottingModuleTypes.IRegionMapRepository)),
    __param(1, Inject(PlottingModuleTypes.ProtoBufAdapterFactory)),
    __metadata("design:paramtypes", [Object, PBufAdapterFactory])
], AppServiceTwo);
export { AppServiceTwo };
//# sourceMappingURL=AppServiceTwo.js.map
