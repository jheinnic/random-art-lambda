import {
   IRegionMap,
   IRegionMapBuilder,
   IRegionPlotter,
} from "../interface/index.js"

// import { TupleOfLength } from "@jchptf/tupletypes"

export abstract class AbstractRegionMap implements IRegionMap {
   abstract get pixelHeight(): number

   abstract get pixelWidth(): number

   abstract get columnOrderedXCoordinates(): readonly number[]

   abstract get columnOrderedYCoordinates(): readonly number[]

   abstract get isUniform(): boolean

   abstract directBuilder(builder: IRegionMapBuilder): void

   public async directPlotter(plotter: IRegionPlotter): Promise<void> {
      const xMax: number = this.pixelWidth
      const yMax: number = this.pixelHeight
      const xCols: readonly number[] = this.columnOrderedXCoordinates
      const yCols: readonly number[] = this.columnOrderedYCoordinates

      if (this.isUniform) {
         let nextY: number = -1
         while (++nextY < yMax) {
            let nextX: number = -1
            while (++nextX < xMax) {
               plotter.plot(nextX, nextY, xCols[nextX], yCols[nextY])
            }
         }
      } else {
         let ii: number = 0
         let nextY: number = -1
         while (++nextY < yMax) {
            let nextX = -1
            while (++nextX < xMax) {
               plotter.plot(nextX, nextY, xCols[ii], yCols[ii])
               ii = ii + 1
            }
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
            plotter.plot(nextX, nextY, xCols[nextX], yCols[nextY])
         }
         if (++nextY < yMax) {
            // setTimeout(loopFoxY, 0, nextY)
            await loopFoxY(nextY)
         } else {
            console.log("Done looping")
            // plotter.finish()
         }
      }
      await loopFoxY(0)
   }

   private async directVariable(plotter: IRegionPlotter): Promise<void> {
      const xMax: number = this.pixelWidth
      const yMax: number = this.pixelHeight
      const xCols: readonly number[] = this.columnOrderedXCoordinates
      const yCols: readonly number[] = this.columnOrderedYCoordinates

      async function loopFoxYI(nextY: number, ii: number): Promise<void> {
         let nextX = -1
         while (++nextX < xMax) {
            plotter.plot(nextX, nextY, xCols[ii], yCols[ii])
            ii = ii + 1
         }
         if (++nextY < yMax) {
            // setTimeout(loopFoxYI, 0, nextY, ii)
            await loopFoxYI(nextY, ii)
         } else {
            console.log("Done looping")
            plotter.finish()
         }
      }
      await loopFoxYI(0, 0)
   }
}
