import { IRandomArtworkSchemaDsl } from "../interface/IRandomArtworkSchemaDsl"

export const I_RANDOM_ART_REPOSITORY: unique symbol = Symbol("IRandomArtworkRepository")
export const I_RANDOM_ART_SCHEMA_DSL: unique symbol = Symbol("IRandomArtworkSchemaDsl")
export const I_RANDOM_ART_TASK_ENGINE: unique symbol = Symbol("IRandomArtTaskEngine")
export const I_RANDOM_ART_PAINTER_FACTORY: unique symbol = Symbol("IRandomArtPainterFactory")
export const I_RANDOM_ART_PAINTER: unique symbol = Symbol("IRandomArtPainter")
export const I_GEN_MODEL_ADAPTER: unique symbol = Symbol("IGenModelAdapter")
export const I_CANVAS_FACTORY: unique symbol = Symbol("ICanvasFactory")

export const PaintingModuleTypes = {
  IRandomArtworkRepository: I_RANDOM_ART_REPOSITORY,
  IRandomArtworkSchemaDsl: I_RANDOM_ART_SCHEMA_DSL,
  IRandomArtTaskEngine: I_RANDOM_ART_TASK_ENGINE,
  IRandomArtPainterFactory: I_RANDOM_ART_PAINTER_FACTORY,
  IRandomArtPainter: I_RANDOM_ART_PAINTER,
  IGenModelAdapter: I_GEN_MODEL_ADAPTER,
  ICanvasFactory: I_CANVAS_FACTORY,
}