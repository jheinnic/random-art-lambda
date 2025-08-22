import { Blockstore } from "interface-blockstore"

export class IpldPlottingModuleConfiguration {
   constructor(public readonly blockStore: Blockstore) {}
}
