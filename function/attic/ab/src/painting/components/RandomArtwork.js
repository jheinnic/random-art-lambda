export class RandomArtwork {
    cid;
    prefix;
    suffix;
    regionMap;
    engineVersion;
    canvas;
    constructor(cid, prefix, suffix, regionMap, engineVersion, canvas) {
        this.cid = cid;
        this.prefix = prefix;
        this.suffix = suffix;
        this.regionMap = regionMap;
        this.engineVersion = engineVersion;
        this.canvas = canvas;
    }
    get buffer() {
        const canvas = this.canvas;
        return canvas.toBuffer();
    }
    get stream() {
        const canvas = this.canvas;
        return canvas.createPNGStream({ compressionLevel: 9 });
    }
}
//# sourceMappingURL=RandomArtwork.js.map