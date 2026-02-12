import { Subject } from "rxjs"
import { ReplyMessage } from "../../messages/interface/ReplyMessage.js"
import { RxLocalCallChannelConfig } from "../interface/RxLocalCallChannelConfig.js"
import { IRxLocalCallChannel } from "./../interface/IRxLocalCallChannel"

// const RANDOM_ART_TASK_CALL_CHANNEL: unique symbol = Symbol(
//    "CliChannels::Chan<RandomArtTaskCall>",
// )
// const RANDOM_ART_TASK_REPLY_CHANNEL: unique symbol = Symbol(
//    "CliChannels::Chan<RandomArtTaskReply>",
// )
// const ENROLL_SOURCE_FILE_CALL_CHANNEL: unique symbol = Symbol(
//    "CliChannels::Chan<EnrollSourceFileCall>",
// )
// const ENROLL_SOURCE_FILE_REPLY_CHANNEL: unique symbol = Symbol(
//    "CliChannels::Chan<EnrollSourceFileReply>",
// )
const LOCAL_CALL_CHANNEL: unique symbol = Symbol("RxLocalCallChannel")
const LOCAL_CALL_CHANNEL_CONFIG: unique symbol = Symbol(
   "RxLocalCallChannelConfig",
)
const LOCAL_REPLIES_SUBJECT: unique symbol = Symbol("Subject<ReplyMessage>")

export const ChannelsModuleTypes = {
   // RandomArtTaskCallChannel: RANDOM_ART_TASK_CALL_CHANNEL,
   // RandomArtTaskReplyChannel: RANDOM_ART_TASK_REPLY_CHANNEL,
   // EnrollSourceFileCallChannel: ENROLL_SOURCE_FILE_CALL_CHANNEL,
   // EnrollSourceFileReplyChannel: ENROLL_SOURCE_FILE_REPLY_CHANNEL,
   RxLocalCallChannel: LOCAL_CALL_CHANNEL,
   RxLocalCallChannelConfig: LOCAL_CALL_CHANNEL_CONFIG,
   RepliesChannel: LOCAL_REPLIES_SUBJECT,
}

export interface ChannelsModuleSymbols {
   [LOCAL_CALL_CHANNEL_CONFIG]: RxLocalCallChannelConfig
   [LOCAL_CALL_CHANNEL]: IRxLocalCallChannel<any, any>
   [LOCAL_REPLIES_SUBJECT]: Subject<ReplyMessage<unknown>>
}

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
