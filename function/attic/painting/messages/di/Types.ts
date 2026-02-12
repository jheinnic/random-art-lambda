export const PAINT_WIRE_TYPE_MAP_EXTENSION: unique symbol = Symbol(
   "PaintWireTypeExtension",
)
export const TYPE_MAP_EXTENSION_REGISTRY: unique symbol =
   Symbol("TypeMapExtension")

export const PaintDtoTypes = {
   PaintWireTypeExtension: PAINT_WIRE_TYPE_MAP_EXTENSION,
   TypeMapExtensionRegistry: TYPE_MAP_EXTENSION_REGISTRY,
}
