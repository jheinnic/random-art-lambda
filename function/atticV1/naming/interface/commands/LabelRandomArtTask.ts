export interface LabelRandomArtTask {
    prefixBits: Uint8Array;
    suffixBits: Uint8Array;
    plotMapSpecLabel: string;
    partitionSpecLabel?: string;
    assignedIndices?: number[];
}