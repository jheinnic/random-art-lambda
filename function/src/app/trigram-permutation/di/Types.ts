const PERMUTATION_EXPANDER: unique symbol = Symbol("PermutationExpander")
const PROJECT_SUBMITTER: unique symbol = Symbol("TrigramProjectSubmitter")
const INJECTED_FLOW_PRODUCER: unique symbol = Symbol(
   "Injected RandomArtFlowProducer",
)

export const TrigramModuleTypes = {
   PermutationExpander: PERMUTATION_EXPANDER,
   ProjectSubmitter: PROJECT_SUBMITTER,
   RandomArtFlowProducer: INJECTED_FLOW_PRODUCER,
}
