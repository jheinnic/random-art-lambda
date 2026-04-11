/**
 * Context Part Composition System
 *
 * A modular class composition framework for building middleware contexts
 * with abstract/concrete part relationships and dependency injection.
 *
 * ## Core Concepts
 *
 * - **Context Parts**: Classes decorated with @ContextPart that contribute
 *   state and/or methods to the assembled context.
 *
 * - **Abstract Parts**: Define contracts (interfaces) that must be provided
 *   by concrete parts. Example: `HasFileStore` declares a `fileStore` dependency.
 *
 * - **Concrete Parts**: Implement abstract contracts. Can be:
 *   - Injection-backed: Dependencies resolved via NestJS DI
 *   - Expression-backed: Values computed from expressions
 *   - Business-logic: Pure code implementations
 *
 * - **Assembly**: The process of combining parts into a single context.
 *   Validates that every abstract dependency has exactly one provider.
 *
 * ## Example Usage
 *
 * ```typescript
 * // 1. Define abstract contracts
 * @ContextPart({ isAbstract: true, visibility: "private" })
 * abstract class HasFileStore {
 *    abstract readonly fileStore: IFileStore
 * }
 *
 * @ContextPart({ isAbstract: true, visibility: "public" })
 * abstract class HasPathName {
 *    abstract readonly pathName: string
 * }
 *
 * // 2. Create concrete providers
 * const InjectedFileStorePart = createInjectedPart<{ fileStore: IFileStore }>(
 *    HasFileStore,
 *    {
 *       name: "InjectedFileStorePart",
 *       provides: [HasFileStore],
 *       injections: { fileStore: FILE_STORE_TOKEN },
 *    }
 * )
 *
 * const ExpressionPathNamePart = createExpressionPart<{ pathName: string }>(
 *    HasPathName,
 *    {
 *       name: "ExpressionPathNamePart",
 *       provides: [HasPathName],
 *       expressions: {
 *          pathName: ctx => `${ctx.context.projectId}/${ctx.context.taskId}.png`,
 *       },
 *    }
 * )
 *
 * // 3. Define activities that consume dependencies
 * const StagingActivity = activityContextualize(
 *    ImageStagingActivity,
 *    ["stagedPath"],
 *    ["fileStore", "pathName"],
 *    {
 *       name: "StagingActivity",
 *       dependsOn: [HasFileStore, HasPathName],
 *    }
 * )
 *
 * // 4. Create the module
 * const PaintingContextModule = MiddlewareContextModuleBuilder
 *    .create("PaintingContextModule")
 *    .addParts([
 *       BaseTaskContext,
 *       InjectedFileStorePart,
 *       ExpressionPathNamePart,
 *       StagingActivity,
 *    ])
 *    .withDependency(FILE_STORE_TOKEN, S3FileStore)
 *    .build()
 *
 * // 5. Inject and use the context factory
 * @Injectable()
 * class PaintingWorker {
 *    constructor(
 *       @Inject(CONTEXT_FACTORY_TOKEN)
 *       private readonly contextFactory: IContextFactory,
 *    ) {}
 *
 *    async process(task: PaintTask) {
 *       const context = this.contextFactory.create({
 *          taskId: task.id,
 *          projectId: task.projectId,
 *       })
 *       // context now has all parts assembled
 *    }
 * }
 * ```
 */

// ============================================================================
// Metadata and Decorators
// ============================================================================

export {
   // Symbols
   CONTEXT_PART_METADATA,
   METHODS,
   ACTION_ENTRIES,
   DELEGATED_INJECT,
   EXPRESSION_METHOD,
   // Types
   type ContextPartMetadata,
   type ContextPartOptions,
   type ContextPartConstructor,
   type ContextPartRef,
   type ContextVisibility,
   type MethodActionEntry,
   type ActionMetadata,
   type DelegatedInjectMetadata,
   type ExpressionMethodMetadata,
   // Decorators
   ContextPart,
   DelegatedInject,
   ExpressionMethod,
   // Decorator factories
   createActionDecorator,
   // Utilities
   getContextPartMetadata,
   getContextPartMethods,
   getActionEntries,
   getDelegatedInjectMetadata,
   getExpressionMethodMetadata,
   getActionsForConsumer,
} from "./ContextPartMetadata.js"

// ============================================================================
// Registry and Validation
// ============================================================================

export {
   // Classes
   ContextPartRegistry,
   // Global instance
   globalContextPartRegistry,
   registerContextPart,
   // Types
   type AssemblyValidationResult,
   type AssemblyValidationError,
   type DependencyGraph,
   // Enums
   ValidationErrorType,
} from "./ContextPartRegistry.js"

// ============================================================================
// Contextualize Functions
// ============================================================================

export {
   // Core contextualizers
   publicContextualize,
   privateContextualize,
   activityContextualize,
   // Merge utilities
   mergeConstructors,
   // Helper functions
   applyContextPartMetadata,
   // Types
   type MiddlewareContext,
   type MiddlewareContextConstructor,
} from "./Contextualize.js"

// ============================================================================
// Injection-Backed Parts
// ============================================================================

export {
   // Factory function
   createInjectedPart,
   // Builder
   InjectedPartBuilder,
   // Resolver
   InjectionResolver,
   // Types
   type InjectionToken,
   type InjectedDependencyDescriptor,
   type InjectedPartOptions,
   type InjectedPartFactory,
} from "./InjectedContextPart.js"

// ============================================================================
// Expression-Backed Parts
// ============================================================================

export {
   // Factory function
   createExpressionPart,
   // Builder
   ExpressionPartBuilder,
   // Resolver
   ExpressionResolver,
   // Parser utilities
   SimpleExpressionParser,
   // Types
   type ExpressionContext,
   type ContextExpression,
   type ExpressionDescriptor,
   type ExpressionPartOptions,
} from "./ExpressionContextPart.js"

// ============================================================================
// Module Builder
// ============================================================================

export {
   // Builder class
   MiddlewareContextModuleBuilder,
   // Tokens
   CONTEXT_FACTORY_TOKEN,
   DEPENDENCY_GRAPH_TOKEN,
   // Factory interface
   type IContextFactory,
   // Config types
   type MiddlewareContextModuleConfig,
   // Convenience functions
   createContextModule,
   validateAssembly,
   formatValidationErrors,
} from "./MiddlewareContextModuleBuilder.js"

// ============================================================================
// RA-Provided Parts
// ============================================================================

export {
   // Base Task
   HasBaseTask,
   BaseTaskPart,
   createBaseTaskContext,
   type BaseTaskProperties,
   // Project Identity
   HasProjectIdentity,
   ProjectIdentityPart,
   createProjectIdentityContext,
   type ProjectIdentityProperties,
   // Built-In Functions
   HasBuiltInFunctions,
   BuiltInFunctionsPart,
   type BuiltInMethods,
   // File Store
   HasFileStore,
   InjectedFileStorePart,
   FILE_STORE_TOKEN,
   type IFileStore,
   type FileMetadata,
   // Path Naming
   HasPathName,
   HashBasedPathPart,
   ProjectPathPart,
   createPathPart,
   createPathPartFromTemplate,
   // Project Position
   HasProjectPosition,
   ProjectPositionPart,
   type ProjectPositionProperties,
   // Task Group Position
   HasTaskGroupPosition,
   TaskGroupPositionPart,
   type TaskGroupPositionProperties,
   // Term Group Position
   HasTermGroupPosition,
   TermGroupPositionPart,
   type TermGroupPositionProperties,
   // Term Position
   HasTermPosition,
   TermPositionPart,
   type TermPositionProperties,
} from "./parts/index.js"
