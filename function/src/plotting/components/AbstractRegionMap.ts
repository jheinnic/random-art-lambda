import NumberPrompt from "inquirer/lib/prompts/number.js"
import {
   IRegionMap,
   IRegionMapBuilder,
   IRegionPlotter,
} from "../interface/index.js"
import { async } from "rxjs"
import { number } from "zod"

// import { TupleOfLength } from "@jchptf/tupletypes"

export abstract class AbstractRegionMap implements IRegionMap {
   abstract get pixelHeight(): number

   abstract get pixelWidth(): number

   abstract get pixelSize(): number

   abstract get columnOrderedXCoordinates(): readonly number[]

   abstract get columnOrderedYCoordinates(): readonly number[]

   abstract get isUniform(): boolean

   abstract get regionBoundary(): {
      top: number
      bottom: number
      left: number
      right: number
   }

   abstract directBuilder(builder: IRegionMapBuilder): void

   public async directPlotter(
      plotter: IRegionPlotter,
      fromY: number,
      untilY: number,
   ): Promise<void> {
      const xMax: number = this.pixelWidth
      const yMax: number = Math.min(untilY, this.pixelHeight)
      const xCols: readonly number[] = this.columnOrderedXCoordinates
      const yCols: readonly number[] = this.columnOrderedYCoordinates

      if (fromY >= untilY) {
         console.warn("Nonsensical input: fromY >= untilY will plot 0 points!")
      }

      if (this.isUniform) {
         let nextY: number = fromY - 1
         while (++nextY < yMax) {
            let nextX: number = -1
            while (++nextX < xMax) {
               plotter.plot(xCols[nextX], yCols[nextY])
            }
         }
      } else {
         let ii: number = xMax * fromY - 1
         // let nextY: number = -1
         const iMax = xMax * yMax
         while (++ii < iMax) {
            // let nextX = -1
            // while (++nextX < xMax) {
            plotter.plot(xCols[ii], yCols[ii])
         }
      }
      plotter.finish()
   }

   public async oldDirectPlotter(plotter: IRegionPlotter): Promise<void> {
      if (this.isUniform) {
         await this.directUniform(plotter)
      } else {
         await this.directVariable(plotter)
      }
   }

   private async directUniform(plotter: IRegionPlotter): Promise<void> {
      const xMax: number = this.pixelWidth
      const yMax: number = this.pixelHeight
      const xCols: readonly number[] = this.columnOrderedXCoordinates
      const yCols: readonly number[] = this.columnOrderedYCoordinates

      async function loopFoxY(nextY: number): Promise<void> {
         let nextX: number = -1
         while (++nextX < xMax) {
            plotter.plot(xCols[nextX], yCols[nextY])
         }
      }

      let nextY = -1
      while (++nextY < yMax) {
         await loopFoxY(nextY)
      }
      plotter.finish()
   }

   private async directVariable(plotter: IRegionPlotter): Promise<void> {
      const xMax: number = this.pixelWidth
      const yMax: number = this.pixelHeight
      const xCols: readonly number[] = this.columnOrderedXCoordinates
      const yCols: readonly number[] = this.columnOrderedYCoordinates

      async function loopFoxYI(ii: number, iMax: number): Promise<void> {
         while (++ii < iMax) {
            plotter.plot(xCols[ii], yCols[ii])
         }
      }
      await loopFoxYI(0, 0)

      let nextY = -1
      let ii: number = -1
      while (++nextY < yMax) {
         await loopFoxYI(ii, (ii = ii + xMax))
      }
      plotter.finish()
   }
}
