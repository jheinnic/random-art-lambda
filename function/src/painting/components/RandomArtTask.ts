import { CID } from "multiformats"

export class RandomArtTask {
  constructor (
    public readonly prefix: Uint8Array,
    public readonly suffix: Uint8Array,
    public readonly plotMap: CID
  ) { }
}
