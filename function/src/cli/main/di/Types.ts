// const I_REGION_MAP_REPOSITORY: unique symbol = Symbol("IRegionMapRepository")
const RANDOM_ART_TASK_CALL_CHANNEL: unique symbol = Symbol(
   "CliMain::Chan<RandomArtTaskCall>",
)
const RANDOM_ART_TASK_REPLY_CHANNEL: unique symbol = Symbol(
   "CliMain::Chan<RandomArtTaskReply>",
)
const ENROLL_SOURCE_FILE_CALL_CHANNEL: unique symbol = Symbol(
   "CliMain::Chan<EnrollSourceFileCall>",
)
const ENROLL_SOURCE_FILE_REPLY_CHANNEL: unique symbol = Symbol(
   "CliMain::Chan<EnrollSourceFileReply>",
)

const RANDOM_ART_TASK_ENGINE: unique symbol = Symbol(
   "CliMain::RandomArtTaskEngine",
)

const CLI_MAIN_MODULE_CONFIGURATION: unique symbol = Symbol(
   "CliMain::ModuleConfiguration",
)

export const CliMainModuleTypes: Record<string, symbol> = {
   RandomArtTaskCallChannel: RANDOM_ART_TASK_CALL_CHANNEL,
   RandomArtTaskReplyChannel: RANDOM_ART_TASK_REPLY_CHANNEL,
   EnrollSourceFileCallChannel: ENROLL_SOURCE_FILE_CALL_CHANNEL,
   EnrollSourceFileReplyChannel: ENROLL_SOURCE_FILE_REPLY_CHANNEL,
   RandomArtTaskEngine: RANDOM_ART_TASK_ENGINE,
   ModuleConfiguration: CLI_MAIN_MODULE_CONFIGURATION,
   // InjectedRegionMapRepository: I_REGION_MAP_REPOSITORY,
   // IRegionMapRepository: I_REGION_MAP_REPOSITORY,
   // PaintingModuleConfigurationFactory: PAINTING_MODULE_CONFIGURATION_FACTORY,
}
