import { PipelineBuilder } from "../../../pipeline/index.js"
import { TaskTermEncoding } from "../values/TaskTermEncoding.js"
import { WithPublicFeature } from "../../../pipeline/builder.js"

// Collapses to never unless B has declared a virtual `Name` whose contract is exactly T.
// Same idiom as BeforeSegment: `B & RequiresVirtual<...>` rejects the call site when it fails.
type RequiresVirtual<B, Name extends string, T> =
   B extends PipelineBuilder<any, any, any, any, infer V, any, any>
      ? Name extends keyof V
         ? [V[Name]] extends [T]
            ? [T] extends [V[Name]]
               ? B
               : never
            : never
         : never
      : never

export function createFixedEncodingBinding<
   B extends PipelineBuilder<any, any, any, any, any, any, any>,
>(
   encoding: BufferEncoding,
   builder: B & RequiresVirtual<B, "taskTermEncoding", TaskTermEncoding>,
): WithPublicFeature<B, "taskTermEncoding", TaskTermEncoding> {
   return (
      builder as unknown as PipelineBuilder<
         any,
         any,
         any,
         {},
         { taskTermEncoding: TaskTermEncoding },
         any,
         {}
      >
   )
      .withContextSubject<TaskTermEncoding>()
      .addPublicFeature("taskTermEncoding", {
         encoding: `"${encoding}"`,
      }) as unknown as WithPublicFeature<
      B,
      "taskTermEncoding",
      TaskTermEncoding
   >
}
