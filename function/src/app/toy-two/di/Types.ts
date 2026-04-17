// const CLI_APP_MODULE_CONFIGURATION: unique symbol = Symbol(
// "CliApp::ModuleConfiguration",
// )

export const CliAppModuleTypes = {
   IRegionMapRepository: Symbol("CliApp::IRegionMapRepository"),
   RandomArtTaskEngine: Symbol("CliApp::RandomArtTaskEngine"),
   RandomArtTaskCallChannel: Symbol("CliApp::Chan<RandomArtTaskCall>"),
   RandomArtTaskReplyChannel: Symbol("CliApp::Chan<RandomArtTaskReply>"),
   // ModuleConfiguration: CLI_APP_MODULE_CONFIGURATION,
   // IRegionMapRepository: I_REGION_MAP_REPOSITORY,
   // PaintingModuleConfigurationFactory: PAINTING_MODULE_CONFIGURATION_FACTORY,
} as const
export const CliMainModuleTypes = {
   RandomArtTaskCallChannel: Symbol(
      "CliMain::IRxLocalCallChannel<PartialPaintRequest, PartialPaintResult>",
   ),
   RegionMapRepository: Symbol("IRegionMapRepository"),
   RandomArtTaskEngine: Symbol("CliMain::RandomArtTaskEngine"),
   RandomArtQueueFlowProducer: Symbol("CliMain::QueueFlowProducer"),
   ModuleConfiguration: Symbol("CliMain::ModuleConfiguration"),
} as const
