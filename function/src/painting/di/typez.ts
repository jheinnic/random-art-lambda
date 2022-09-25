export const I_RANDOM_ART_PAINTER_FACTORY: unique symbol = Symbol("IRandomArtPainterFactory")
export const I_RANDOM_ART_PAINTER: unique symbol = Symbol("IRandomArtPainter")
export const I_GEN_MODEL_ADAPTER: unique symbol = Symbol("IGenModelAdapter")
export const I_CANVAS_FACTORY: unique symbol = Symbol("ICanvasFactory")

export const PaintingModuleTypes = {
  IRandomArtPainterFactory: I_RANDOM_ART_PAINTER_FACTORY,
  IRandomArtPainter: I_RANDOM_ART_PAINTER,
  IGenModelAdapter: I_GEN_MODEL_ADAPTER,
  ICanvasFactory: I_CANVAS_FACTORY
}
