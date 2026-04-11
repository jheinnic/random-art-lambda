const PERMUTATION_EXPANDER: unique symbol = Symbol("PermutationExpander")
const PROJECT_SUBMITTER: unique symbol = Symbol("TrigramProjectSubmitter")
const INJECTED_FLOW_PRODUCER: unique symbol = Symbol(
   "Injected RandomArtFlowProducer",
)
const WORKER_FILE_STORE: unique symbol = Symbol("Trigram::IFileStore")
const PIPELINE_FN: unique symbol = Symbol("Trigram::PipelineFn")

export const TrigramModuleTypes = {
   PermutationExpander: PERMUTATION_EXPANDER,
   ProjectSubmitter: PROJECT_SUBMITTER,
   RandomArtFlowProducer: INJECTED_FLOW_PRODUCER,
   /** Injection token for the IFileStore used by the worker pipeline. */
   WorkerFileStore: WORKER_FILE_STORE,
   /** Injection token for the compiled pipeline function. */
   PipelineFn: PIPELINE_FN,
}
