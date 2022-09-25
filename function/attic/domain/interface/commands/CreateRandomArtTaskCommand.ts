import { IRandomArtTaskCommand } from "./IRandomArtTaskCommand"

export class CreateRandomArtTaskCommand implements IRandomArtTaskCommand {
  constructor (
    public readonly prefixBytes: Uint8Array,
    public readonly suffixBytes: Uint8Array,
    public readonly plotMapCid: string
  ) {}
}
