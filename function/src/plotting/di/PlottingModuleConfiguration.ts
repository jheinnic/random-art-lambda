import { Blockstore } from "interface-blockstore"

export class PlottingModuleConfiguration {
  constructor (public readonly blockStore: Blockstore) { }
}
