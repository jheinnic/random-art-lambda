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
         let nextX: number = -1
         while (++nextX < xMax) {
            let nextY: number = -1
            while (++nextY < yMax) {
               plotter.plot(nextX, nextY, xCols[nextX], yCols[nextY])
            }
         }
      } else {
         let ii: number = 0
         let nextX: number = -1
         while (++nextX < xMax) {
            let nextY = -1
            while (++nextY < yMax) {
               // console.log(nextX, nextY, xCols[ii], yCols[ii])
               plotter.plot(nextX, nextY, xCols[ii], yCols[ii++])
            }
         }
      }
      // plotter.finish()
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

      async function loopForX(nextX: number): Promise<void> {
         let nextY: number = -1
         while (++nextY < yMax) {
            plotter.plot(nextX, nextY, xCols[nextX], yCols[nextY])
         }
         if (++nextX < xMax) {
            // setTimeout(loopForX, 0, nextX)
            await loopForX(nextX)
         } else {
            console.log("Done looping")
            // plotter.finish()
         }
      }
      await loopForX(0)
   }

   private async directVariable(plotter: IRegionPlotter): Promise<void> {
      const xMax: number = this.pixelWidth
      const yMax: number = this.pixelHeight
      const xCols: readonly number[] = this.columnOrderedXCoordinates
      const yCols: readonly number[] = this.columnOrderedYCoordinates

      async function loopForXI(nextX: number, ii: number): Promise<void> {
         let nextY = -1
         while (++nextY < yMax) {
            plotter.plot(nextX, nextY, xCols[ii], yCols[ii++])
         }
         if (++nextX < xMax) {
            // setTimeout(loopForXI, 0, nextX, ii)
            await loopForXI(nextX, ii)
         } else {
            console.log("Done looping")
            // plotter.finish()
         }
      }
      await loopForXI(0, 0)
   }
}
