import { CID } from "multiformats"

export interface BlockAssets {
  rootFolder?: CID // UnixFSDirectory
  plotMapFile?: CID // UnixFSFile
  prefixFile?: CID // UnixFSFile
  suffixFile?: CID // UnixFSFile
}
