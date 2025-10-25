// export const I_RANDOM_ART_PAINTER_FACTORY: unique symbol = Symbol(
// "IRandomArtPainterFactory",
// )
// export const I_RANDOM_ART_PAINTER: unique symbol = Symbol("IRandomArtPainter")
// export const I_GEN_MODEL_ADAPTER: unique symbol = Symbol("IGenModelAdapter")
// export const I_CANVAS_FACTORY: unique symbol = Symbol("ICanvasFactory")
// export const PAINTING_MODULE_CONFIGURATION: unique symbol = Symbol(
//    "Painting::ModuleConfiguration",
// )

export const PaintingModuleTypes = {
   IRandomArtTaskEngine: Symbol("Painting::IRandomArtTaskEngine"),
   // IGenModelFactory: Symbol("Painting::IGenModelFactory"),
   // IGenModelSeedRegistry: Symbol("Painting::IGenModelSeedRegistry"),
   RandomArtTaskCallChannel: Symbol("Painting::Chan<RandomArtTaskCall>"),
   RandomArtTaskReplyChannel: Symbol("Painting::Chan<RandomArtTaskReply>"),
   InjectedRegionMapRepository: Symbol("Painting::IRegionMapRepository"),
   InjectedGenModelSeedExtensionPoint: Symbol(
      "Painting::IGenModelSeedExtensionPoint",
   ),
   // ModuleConfiguration: PAINTING_MODULE_CONFIGURATION,
   // ModuleConfiguration: INJECTED_REGION_MAP_REPOSITORY,
   // IRandomArtPainterFactory: I_RANDOM_ART_PAINTER_FACTORY,
   // IRandomArtPainter: I_RANDOM_ART_PAINTER,
   // IGenModelAdapter: I_GEN_MODEL_ADAPTER,
   // ICanvasFactory: I_CANVAS_FACTORY,
} as const
