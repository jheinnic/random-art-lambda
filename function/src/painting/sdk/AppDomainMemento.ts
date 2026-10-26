import type { Nominal } from "../../messages/interface/Nominal.js"

const APP_DOMAIN_MEMENTO: unique symbol = Symbol("AppDomainMemento")

/**
 * Opaque nominal type for a serialized plugin domain payload.
 *
 * The RandomArt framework carries this string through the FlowProducer and into
 * the worker pipeline without ever inspecting its contents. Only the layer that
 * produced it (PermutationsExpander via JSON.stringify) and the pipeline's
 * dehydration segment (via JSON.parse) ever interact with the value.
 *
 * Cast to this type only at the one serialization boundary in PermutationsExpander.
 */
export type AppDomainMemento = Nominal<string, typeof APP_DOMAIN_MEMENTO>
