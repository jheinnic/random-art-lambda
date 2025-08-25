const RANDOM_ART_TASK_CALL_CHANNEL: unique symbol = Symbol(
   "CliChannels::Chan<RandomArtTaskCall>",
)
const RANDOM_ART_TASK_REPLY_CHANNEL: unique symbol = Symbol(
   "CliChannels::Chan<RandomArtTaskReply>",
)
const ENROLL_SOURCE_FILE_CALL_CHANNEL: unique symbol = Symbol(
   "CliChannels::Chan<EnrollSourceFileCall>",
)
const ENROLL_SOURCE_FILE_REPLY_CHANNEL: unique symbol = Symbol(
   "CliChannels::Chan<EnrollSourceFileReply>",
)
export const CliChannelsModuleTypes = {
   RandomArtTaskCallChannel: RANDOM_ART_TASK_CALL_CHANNEL,
   RandomArtTaskReplyChannel: RANDOM_ART_TASK_REPLY_CHANNEL,
   EnrollSourceFileCallChannel: ENROLL_SOURCE_FILE_CALL_CHANNEL,
   EnrollSourceFileReplyChannel: ENROLL_SOURCE_FILE_REPLY_CHANNEL,
} as const

// export const CliChannelsModuleTypes = {
//    RandomArtTaskCallChannel: Symbol("CliChannels::Chan<RandomArtTaskCall>"),
//    RandomArtTaskReplyChannel: Symbol("CliChannels::Chan<RandomArtTaskReply>"),
//    EnrollSourceFileCallChannel: Symbol(
//       "CliChannels::Chan<EnrollSourceFileCall>",
//    ),
//    EnrollSourceFileReplyChannel: Symbol(
//       "CliChannels::Chan<EnrollSourceFileReply>",
//    ),
// } as const
