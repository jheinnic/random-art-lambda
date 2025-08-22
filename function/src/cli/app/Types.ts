const I_REGION_MAP_REPOSITORY: unique symbol = Symbol(
   "CliApp::IRegionMapRepository",
)
const RANDOM_ART_TASK_ENGINE: unique symbol = Symbol(
   "CliApp::RandomArtTaskEngine",
)

const RANDOM_ART_TASK_CALL_CHANNEL: unique symbol = Symbol(
   "CliApp::Chan<RandomArtTaskCall>",
)
const RANDOM_ART_TASK_REPLY_CHANNEL: unique symbol = Symbol(
   "CliApp::Chan<RandomArtTaskReply>",
)
const ENROLL_SOURCE_FILE_CALL_CHANNEL: unique symbol = Symbol(
   "CliApp::Chan<EnrollSourceFileCall>",
)
const ENROLL_SOURCE_FILE_REPLY_CHANNEL: unique symbol = Symbol(
   "CliApp::Chan<EnrollSourceFileReply>",
)
const CLI_APP_MODULE_CONFIGURATION: unique symbol = Symbol(
   "CliApp::ModuleConfiguration",
)

export const CliAppModuleTypes: Record<string, symbol> = {
   IRegionMapRepository: I_REGION_MAP_REPOSITORY,
   RandomArtTaskEngine: RANDOM_ART_TASK_ENGINE,
   RandomArtTaskCallChannel: RANDOM_ART_TASK_CALL_CHANNEL,
   RandomArtTaskReplyChannel: RANDOM_ART_TASK_REPLY_CHANNEL,
   EnrollSourceFileCallChannel: ENROLL_SOURCE_FILE_CALL_CHANNEL,
   EnrollSourceFileReplyChannel: ENROLL_SOURCE_FILE_REPLY_CHANNEL,
   ModuleConfiguration: CLI_APP_MODULE_CONFIGURATION,
   // IRegionMapRepository: I_REGION_MAP_REPOSITORY,
   // PaintingModuleConfigurationFactory: PAINTING_MODULE_CONFIGURATION_FACTORY,
}
