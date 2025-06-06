export class RandomArtPaintTask {
    cid;
    prefixCid;
    prefixBytes;
    suffixCid;
    suffixBytes;
    plotMapCid;
    plotMapBytes;
    constructor(cid, prefixCid, prefixBytes, suffixCid, suffixBytes, plotMapCid, plotMapBytes) {
        this.cid = cid;
        this.prefixCid = prefixCid;
        this.prefixBytes = prefixBytes;
        this.suffixCid = suffixCid;
        this.suffixBytes = suffixBytes;
        this.plotMapCid = plotMapCid;
        this.plotMapBytes = plotMapBytes;
    }
}
// partitionSpecUrl?: string;
// assignedIndices: number[];
// priorityModifier: number;
// writerType: 'cloudinary'|'s3'|'ipfs'|'post';
// storagePath?: string;
// accessSecret?: string;
//# sourceMappingURL=RandomArtPaintTask.js.map