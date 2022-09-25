export class ndomArtPaintTask {
  constructor (
    public readonly cid: string,
    public readonly prefixCid: string,
    public readonly prefixBytes: Uint8Array,
    public readonly suffixCid: string,
    public readonly suffixBytes: Uint8Array,
    public readonly plotMapCid: string,
    public readonly plotMapBytes: Uint8Array
  ) {}
}
// partitionSpecUrl?: string;
// assignedIndices: number[];
// priorityModifier: number;
// writerType: 'cloudinary'|'s3'|'ipfs'|'post';
// storagePath?: string;
// accessSecret?: string;
