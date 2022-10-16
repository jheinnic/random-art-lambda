import { CID } from "multiformats"

export interface IRandomArtTaskBuilder {
  prefix: (bytes: Uint8Array) => IRandomArtTaskBuilder
  suffix: (bytes: Uint8Array) => IRandomArtTaskBuilder
  plotMap: (link: CID) => IRandomArtTaskBuilder
}
