const PERMUTATION_EXPANDER: unique symbol = Symbol("PermutationExpander")
const PROJECT_SUBMITTER: unique symbol = Symbol("TrigramProjectSubmitter")
const INJECTED_FLOW_PRODUCER: unique symbol = Symbol(
   "Injected RandomArtFlowProducer",
)
/**
 * Application-context token for the IFileStore.
 *
 * This is the token passed as exportToken when constructing the storage
 * module.  It lives at the application context boundary — the one place
 * where encapsulation is intentionally broken to wire modules together.
 * Consumer modules (e.g. TrigramPipelineModule) bridge this to their own
 * internal tokens via useExisting, keeping their namespaces self-contained.
 */
const APP_FILE_STORE: unique symbol = Symbol("Trigram::AppFileStore")
/**
 * Module-internal token for the IFileStore inside TrigramPipelineModule.
 * Never exported; wired from AppFileStore via useExisting inside that module.
 */
const WORKER_FILE_STORE: unique symbol = Symbol("Trigram::WorkerFileStore")
const PIPELINE_FN: unique symbol = Symbol("Trigram::PipelineFn")

export const TrigramModuleTypes = {
   PermutationExpander: PERMUTATION_EXPANDER,
   ProjectSubmitter: PROJECT_SUBMITTER,
   RandomArtFlowProducer: INJECTED_FLOW_PRODUCER,
   /** Application-context boundary token for the IFileStore. */
   AppFileStore: APP_FILE_STORE,
   /** Module-internal IFileStore token inside TrigramPipelineModule. */
   WorkerFileStore: WORKER_FILE_STORE,
   /** Injection token for the compiled pipeline function. */
   PipelineFn: PIPELINE_FN,
}
