/**
 * RenderExecutor - actually renders the image during produce()
 * - Requires: dimensions, seed, format (all derived earlier)
 * - Produces: imageBuffer (the actual rendered image)
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createRenderExecutor(renderer: Renderer) {
   type RequiredState = Extend<DimensionsState, RenderInputState>

   return class RenderExecutor {
      static readonly _requires: RequiredState
      static readonly _produces: RenderedImageState

      // This is where the actual rendering happens!
      static async produce(state: RequiredState): Promise<RenderedImageState> {
         const startTime = Date.now()
         const imageBuffer = await renderer.render(
            state.seed,
            state.width,
            state.height,
            state.format,
         )
         return {
            imageBuffer,
            renderTimeMs: Date.now() - startTime,
         }
      }

      static bind(
         context: Extend<RenderedImageState, RequiredState>,
      ): RenderExecutor {
         return new RenderExecutor(context)
      }

      private constructor(
         private readonly context: Extend<RenderedImageState, RequiredState>,
      ) {}

      getImageBuffer(): Buffer {
         return this.context.imageBuffer
      }

      getRenderTime(): number {
         return this.context.renderTimeMs
      }
   }
}
