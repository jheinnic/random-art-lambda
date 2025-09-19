export const CliMainModuleTypes = {
   RandomArtTaskCallChannel: Symbol("CliMain::Chan<RandomArtTaskCall>"),
   RandomArtTaskReplyChannel: Symbol("CliMain::Chan<RandomArtTaskReply>"),
   RegionMapRepository: Symbol("IRegionMapRepository"),
   RandomArtTaskEngine: Symbol("CliMain::RandomArtTaskEngine"),
   ModuleConfiguration: Symbol("CliMain::ModuleConfiguration"),
} as const
