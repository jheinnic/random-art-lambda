import { computePixel } from "./genjs6.js";
const CHARS = "0123456789ABCDEF".split("");
const BYTES = Array(256);
for (let ii = 0, idx = 0; ii < 16; ii++) {
    for (let jj = 0; jj < 16; jj++, idx++) {
        BYTES[idx] = `${CHARS[ii]}${CHARS[jj]}`;
    }
}
const COLORS = Array(256 * 256 * 256);
for (let ii = 0, idx = 0; ii < 256; ii++) {
    for (let jj = 0; jj < 256; jj++) {
        for (let kk = 0; kk < 256; kk++, idx++) {
            COLORS[idx] = `#${BYTES[ii]}${BYTES[jj]}${BYTES[kk]}`;
        }
    }
}
export class GenModelArtist {
    genModel;
    painter;
    constructor(genModel, painter) {
        this.genModel = genModel;
        this.painter = painter;
    }
    plot(pixelX, pixelY, regionX, regionY) {
        const rgb = computePixel(this.genModel, regionX, regionY);
        // console.log(`${pixelX}, ${pixelY}) => (${regionX}, ${regionY}) => ${rgb} => ${strv}`)
        // this.painter.paint(pixelX, pixelY, `#${BYTES[rgb[0]]}${BYTES[rgb[1]]}${BYTES[rgb[2]]}`)
        this.painter.paint(pixelX, pixelY, COLORS[(rgb[0] << 16) + (rgb[1] << 8) + rgb[2]]);
    }
}
//# sourceMappingURL=GenModelArtist.js.map