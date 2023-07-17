import { IRegionMap, IRegionPlotter } from "../interface/index.js"

// import { TupleOfLength } from "@jchptf/tupletypes"

export abstract class AbstractRegionMap implements IRegionMap {
  abstract get pixelHeight(): number

  abstract get pixelWidth(): number

  abstract get columnOrderedXCoordinates(): number[]

  abstract get columnOrderedYCoordinates(): number[]

  abstract get isUniform(): boolean

  public oldDirector( plotter: IRegionPlotter ): void {
    const xMax: number = this.pixelWidth
    const yMax: number = this.pixelHeight
    const xCols: number[] = this.columnOrderedXCoordinates
    const yCols: number[] = this.columnOrderedYCoordinates

    if ( this.isUniform ) {
      let nextX: number = -1
      while ( ++nextX < xMax ) {
        let nextY: number = -1
        while ( ++nextY < yMax ) {
          plotter.plot( nextX, nextY, xCols[ nextX ], yCols[ nextY ] )
        }
      }
    } else {
      let ii: number = 0
      let nextX: number = -1
      while ( ++nextX < xMax ) {
        let nextY = -1
        while ( ++nextY < yMax ) {
          // console.log(nextX, nextY, xCols[ii], yCols[ii])
          plotter.plot( nextX, nextY, xCols[ ii ], yCols[ ii++ ] )
        }
      }
    }
    // plotter.finish()
  }

  public director( plotter: IRegionPlotter ): void {
    if ( this.isUniform ) {
      this.directUniform( plotter )
    } else {
      this.directVariable( plotter )
    }
  }

  private directUniform( plotter: IRegionPlotter ): void {
    const xMax: number = this.pixelWidth
    const yMax: number = this.pixelHeight
    const xCols: number[] = this.columnOrderedXCoordinates
    const yCols: number[] = this.columnOrderedYCoordinates

    function loopForX( nextX: number ): void {
      let nextY: number = -1
      while ( ++nextY < yMax ) {
        plotter.plot( nextX, nextY, xCols[ nextX ], yCols[ nextY ] )
      }
      if ( ++nextX < xMax ) {
        setTimeout( loopForX, 0, nextX )
      } else {
        console.log( "Done looping" )
        // plotter.finish()
      }
    }
    loopForX( 0 )
  }

  private directVariable( plotter: IRegionPlotter ): void {
    const xMax: number = this.pixelWidth
    const yMax: number = this.pixelHeight
    const xCols: number[] = this.columnOrderedXCoordinates
    const yCols: number[] = this.columnOrderedYCoordinates

    function loopForXI( nextX: number, ii: number ): void {
      let nextY = -1
      while ( ++nextY < yMax ) {
        plotter.plot( nextX, nextY, xCols[ ii ], yCols[ ii++ ] )
      }
      if ( ++nextX < xMax ) {
        setTimeout( loopForXI, 0, nextX, ii )
      } else {
        console.log( "Done looping" )
        // plotter.finish()
      }
    }
    loopForXI( 0, 0 )
  }
}
