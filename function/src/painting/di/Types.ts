export const I_RANDOM_ART_TASK_ENGINE: unique symbol = Symbol(
   "Painting::IRandomArtTaskEngine",
)
export const RANDOM_ART_TASK_CALL_CHANNEL: unique symbol = Symbol(
   "Painting::Chan<RandomArtTaskCall>",
)
export const RANDOM_ART_TASK_REPLY_CHANNEL: unique symbol = Symbol(
   "Painting::Chan<RandomArtTaskReply>",
)
export const INJECTED_REGION_MAP_REPOSITORY: unique symbol = Symbol(
   "Painting::IRegionMapRepository",
)
// export const I_RANDOM_ART_PAINTER_FACTORY: unique symbol = Symbol(
// "IRandomArtPainterFactory",
// )
// export const I_RANDOM_ART_PAINTER: unique symbol = Symbol("IRandomArtPainter")
// export const I_GEN_MODEL_ADAPTER: unique symbol = Symbol("IGenModelAdapter")
// export const I_CANVAS_FACTORY: unique symbol = Symbol("ICanvasFactory")
export const PAINTING_MODULE_CONFIGURATION: unique symbol = Symbol(
   "Painting::ModuleConfiguration",
)

export const PaintingModuleTypes = {
   IRandomArtTaskEngine: I_RANDOM_ART_TASK_ENGINE,
   RandomArtTaskCallChannel: RANDOM_ART_TASK_CALL_CHANNEL,
   RandomArtTaskReplyChannel: RANDOM_ART_TASK_REPLY_CHANNEL,
   InjectedRegionMapRepository: INJECTED_REGION_MAP_REPOSITORY,
   ModuleConfiguration: PAINTING_MODULE_CONFIGURATION,
   // ModuleConfiguration: INJECTED_REGION_MAP_REPOSITORY,
   // IRandomArtPainterFactory: I_RANDOM_ART_PAINTER_FACTORY,
   // IRandomArtPainter: I_RANDOM_ART_PAINTER,
   // IGenModelAdapter: I_GEN_MODEL_ADAPTER,
   // ICanvasFactory: I_CANVAS_FACTORY,
}
