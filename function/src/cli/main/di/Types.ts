export const CliMainModuleTypes = {
   RandomArtTaskCallChannel: Symbol(
      "CliMain::IRxLocalCallChannel<PartialPaintRequest, PartialPaintResult>",
   ),
   RegionMapRepository: Symbol("IRegionMapRepository"),
   RandomArtTaskEngine: Symbol("CliMain::RandomArtTaskEngine"),
   RandomArtQueueFlowProducer: Symbol("CliMain::QueueFlowProducer"),
   ModuleConfiguration: Symbol("CliMain::ModuleConfiguration"),
} as const
