var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import { PBufAdapter } from "./PBufAdapter.js";
import { PointPlotDocument } from "./PBufUtil.js";
// import { PointPlotDocument, PointPlotData } from "./plot_mapping_pb.js"
let PBufAdapterFactory = class PBufAdapterFactory {
    adapt(sourceFile) {
        const modelBuf = fs.readFileSync(sourceFile);
        const plotDocument = PointPlotDocument.deserializeBinary(modelBuf);
        const plotData = plotDocument.getData();
        if ((plotData === undefined) || (plotData === null)) {
            console.error("Not Plot Data!");
            throw new Error("Not Plot Data!");
        }
        return new PBufAdapter(plotData);
    }
};
PBufAdapterFactory = __decorate([
    Injectable()
], PBufAdapterFactory);
export { PBufAdapterFactory };
//# sourceMappingURL=PBufAdapterFactory.js.map