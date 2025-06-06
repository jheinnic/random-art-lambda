var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import * as fs from "fs";
import { CID } from "multiformats";
import { Injectable } from "@nestjs/common";
import { Canvas } from "canvas";
import { CanvasPixelPainter } from './CanvasPixelPainter.js';
import { GenModelArtist } from './GenModelArtist.js';
import { newPicture } from "./genjs6.js";
let RandomArtTaskHelper = class RandomArtTaskHelper {
    canvasFactory;
    plotterFactory;
    constructor(canvasFactory, plotterFactory) {
        this.canvasFactory = canvasFactory;
        this.plotterFactory = plotterFactory;
    }
    async beginTask(regionMap, prefix, suffix) {
        // const prefix = [ ...prefix ]
        // const suffix = [ ...suffix ]
        const genModel = newPicture(prefix, suffix);
        const canvas = new Canvas(regionMap.pixelWidth, regionMap.pixelHeight, 'image');
        const canvasPainter = new CanvasPixelPainter(canvas);
        const artist = new GenModelArtist(genModel, canvasPainter);
        regionMap.director(artist);
        // canvas.
        const cid1 = CID.parse('QmXPV4uU34qMVnj3DhQFT1s1766eFK8y95DE7oFZvrbbZ3');
        const cid2 = CID.parse('QmQ9LT1MW4jfFbettuP7T9qxpNYDBfahvetf8y4ZqbiAtw');
        return {
            cid: cid1,
            prefix: Uint8Array.from([84, 81, 81, 190]),
            suffix: Uint8Array.from([182, 81, 143, 94, 88, 104]),
            regionMap: cid2,
            engineVersion: '0.0.1',
            buffer: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
            stream: fs.createReadStream('fdoc.proto')
        };
    }
};
RandomArtTaskHelper = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Function, Function])
], RandomArtTaskHelper);
export { RandomArtTaskHelper };
//# sourceMappingURL=RandomArtTaskHelper.js.map