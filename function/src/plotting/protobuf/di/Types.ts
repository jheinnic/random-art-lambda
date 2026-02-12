const PROTOBUF_REGION_MAP_FACTORY: unique symbol = Symbol(
   "Protobuf::Plotting::RegionMapFactory",
)
// const PROTOBUF_REGION_MAP_REPOSITORY: unique symbol = Symbol(
//    "Protobuf::Plotting::RegionMapRepository",
// )
// const PROTOBUF_SOURCE_CONFIGURATION: unique symbol = Symbol(
//    "Protobuf::ISourceConfiguration",
// )
// const ENROLL_SOURCE_FILE_CALL_CHANNEL: unique symbol = Symbol(
//    "Protobuf::Plotting::Chan<EnrollSourceFileCall>",
// )
// const ENROLL_SOURCE_FILE_REPLY_CHANNEL: unique symbol = Symbol(
//    "Protobuf::Plotting::Chan<EnrollSourceFileReply>",
// )
const PROTOBUF_PLOTTING_MODULE_CONFIGURATION: unique symbol = Symbol(
   "Protobuf::Plotting::ModuleConfiguration",
)

/**
 * This module provides an Embedded lite version of the RegionMap repository that is only
 * designed to handle a small number of locally stored protobuf-backed RegionMap instances.
 *
 * It is scoped for reuse with an early version of the CLI, and instead of a functional
 * load() method, it is injected with a finite list of known CID->Protobuf mappings.  The
 * mappings are genuine and will hold up if the repository implementation is later replaced
 * with a service (Thank You Content Based Identity!)
 *
 * We reuse tokens from the main PlottingModule where there is overlap and interchangeability
 * desired, and only define those needed to inject alternate configuration and the ProtoBuf
 * adapter factory itself here.   There are no IPLD Serdes or Blockstore requirements for
 * this use case, so we disregard those tokens entirely.
 */
export const ProtobufPlottingModuleTypes = {
   ProtobufRegionMapFactory: PROTOBUF_REGION_MAP_FACTORY,
   // ProtobufRegionMapRepository: PROTOBUF_REGION_MAP_REPOSITORY,
   // ProtobufSourceConfiguration: PROTOBUF_SOURCE_CONFIGURATION,
   // EnrollSourceFileCallChannel: ENROLL_SOURCE_FILE_CALL_CHANNEL,
   // EnrollSourceFileReplyChannel: ENROLL_SOURCE_FILE_REPLY_CHANNEL,
   ModuleConfiguration: PROTOBUF_PLOTTING_MODULE_CONFIGURATION,
} as const
