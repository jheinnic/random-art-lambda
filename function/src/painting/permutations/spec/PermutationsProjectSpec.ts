import type { PermutationTaskDomain, PermutationProjectDomain } from "../sdk/index.js"
import type { LiteCIDString } from "../../../messages/interface/index.js"

/**
 * A single (prefix, suffix) term pair in source encoding.
 *
 * PermutationsExpander encodes these to base64url for the rendering engine and
 * generates all indices. The caller provides only the raw strings.
 *
 * AppDomain carries any app-specific per-task context (e.g. ECDH rangeNames).
 * Absent for Trigram, which contributes no app-specific expression context.
 */
export interface PermutationTermPair<
   AppDomain extends PermutationTaskDomain = PermutationTaskDomain,
> {
   readonly prefix: string
   readonly suffix: string
   readonly appDomain?: AppDomain
}

/**
 * One permutation group: a set of term pairs rendered against a set of region maps.
 *
 * PermutationsExpander produces one painting task per (termPair × regionMap).
 * Counting is the expander's responsibility — within its own iteration, not globally.
 */
export interface PermutationTermGroup<
   AppDomain extends PermutationTaskDomain = PermutationTaskDomain,
> {
   /**
    * Names referencing entries in the project-level regionMapNames catalog.
    * Each pair in termPairs is rendered once against each map listed here.
    */
   readonly regionMapNames: ReadonlyArray<string>

   /**
    * Term pairs in source encoding (as provided by the calling application).
    * PermutationsExpander handles encoding to base64url and index assignment.
    */
   readonly termPairs: ReadonlyArray<PermutationTermPair<AppDomain>>
}

/**
 * Project spec consumed by PermutationsExpander.
 *
 * Produced by application expanders (e.g. TrigramExpander). This is a pure
 * INPUT model — it provides several condensed means of defining one or more 
 * combinations of a prefix, a suffix, and a CID from more dense declarations:
 * <list>
 * <li>An AllPairsGroup uses a list of N terms to provide either (N^2) or (N^2 - N)
 * combinations, with the difference hinging on whether or not each of the N terms
 * is allowed to be paired with itself</li>
 * <li>An PrefixSuffixGroup uses a list of M prefix terms and N suffix terms to
 * provide (M * N) combinations with each prefix paired with each suffix.
 * <li>An AllCidsGroup contains N distinct prefix/suffix pairs.  As with all other
 * groups, it also includes a list of names from the local name-to-CID map and
 * expands to repeat the same list of N prefix/suffix pairs with each of the named
 * CID references</li>
 * </list>
 * 
 * PermutationsExpander includes several generic extension points that, if defined,
 * become available for composition at specified cardinalities and are repeated with
 * declared key prefixes to prevent name clashes to form a TaskDomain type when expanded
 * to the core RandomArt model.
 * <list>
 *   <li>PermutationGroupDomain is repeated with a `group_` prefix in each Task created
 *   from a group where it is composed</li>
 *   <li>PermutationPairDomain only appears in the AllCidsGroup and is prefixed in the
 *   single Task where it appears with a `pair_` prefix</li>
 *   <li>PermutationTermDomain only appears in the PrefixTerm and SuffixTerm elements of
 *   AllPairsGroups and the Term elements of PrefixSuffixGroup, where it its fields are
 *   copied with either a `prefix_` or a `suffix_` prefix.  Term elements have both a prefix
 *   and a suffix field--which is copied depends on which role the element plays in a given
 *   pairing.</li>
 *   <li>PermutationRegionDomain only appear in the name-to-CID reference map at root level
 *   and is copied with a `region_` prefix any time the entry it whose name it is mapped
 *   with is included in a group of any type.</li>
 *   <li>The name associated with any CID reference is copied to a `cid_name` property in the
 *   TaskDomain subtype</li>
 * </li>
 * 
 * A subtype of ProjectDomain from the RandomArt model's SDK package is carried at a project
 * and is passed through to the RandomArt spec model unchanged.  It is predominantly where an
 * application will model any pipeline context variables it uses to allow the actual values for
 * pipeline features to be defined by the content of a submitted project spec, such as binding
 * the character set for prefix/suffix original form transcoding or the filepath use when saving
 * an image file to a repository.
 *
 * Encoding and filename expression are not modeled here,  carried here. For the first
 * implementation pass these are hardcoded in the pipeline module configuration
 * (read from ConfigService at startup, baked into the pipeline at build time).
 * Future pipeline configuration variants will determine which of these fields,
 * if any, a given deployment exposes for user or caller control.
 */
export interface PermutationsProjectSpec<
   AppDomain extends PermutationTaskDomain = PermutationTaskDomain,
   AppProjectDomain extends PermutationProjectDomain = PermutationProjectDomain,
> {
   /**
    * Catalog of friendly region map names to LiteCID content addresses.
    * CID format validation is deferred to the FlowProducer.
    * termGroups reference entries in this catalog by name.
    */
   readonly regionMapNames: Record<string, LiteCIDString>

   /**
    * Optional project-level app domain contribution.
    * Absent for applications that carry no project-level expression context.
    */
   readonly appProjectDomain?: AppProjectDomain

   /**
    * Permutation groups to expand. Each group produces
    * (termPairs.length × regionMapNames.length) painting tasks.
    */
   readonly termGroups: ReadonlyArray<PermutationTermGroup<AppDomain>>
}
