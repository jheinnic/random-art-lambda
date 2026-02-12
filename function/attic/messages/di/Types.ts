export const LA: unique symbol = Symbol("La")
export const TYPE_MAP_ADAPTER_FACTORY: unique symbol = Symbol(
   "TypeMapAdapterFactory",
)
export const TYPE_MAP_EXTENSION_MATCHMAKER: unique symbol = Symbol(
   "TypeMapExtensionRegistry",
)
export const TYPE_MAP_EXTENSION_REGISTRY: unique symbol = Symbol(
   "TypeMapExtensionRegistry",
)

export const WireTypeMessageModuleTypes = {
   TypeMapExtensionMatchmaker: TYPE_MAP_EXTENSION_MATCHMAKER,
   TypeMapExtensionRegistry: TYPE_MAP_EXTENSION_REGISTRY,
   TypeMapAdapterFactory: TYPE_MAP_ADAPTER_FACTORY,
}
