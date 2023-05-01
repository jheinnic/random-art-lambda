import { IRegionMap, IRegionPlotter } from "../interface/index.js"
import { partial } from "ramda"

type UnaryTailIter = ( number ) => void
type BinaryTailIter = ( number, number ) => void

// import { TupleOfLength } from "@jchptf/tupletypes"
function director(
  isUniform: boolean, xMax: number, yMax: number, xCols: number[], yCols: number[], plotter: IRegionPlotter
): void {
  if ( this.isUniform ) {
    this.uniformDirector( xMax, yMax, xCols, yCols, plotter )
  } else {
    this.variableDirector( xMax, yMax, xCols, yCols, plotter )
  }
}

function uniformDirector(
  xMax: number, yMax: number, xCols: number[], yCols: number[], plotter: IRegionPlotter
): void {
  let iterNext: UnaryTailIter = ( x ) => { }

  function loopForX( nextX: number ): void {
    let nextY: number = -1
    while ( ++nextY < yMax ) {
      plotter.plot( nextX, nextY, xCols[ nextX ], yCols[ nextY ] )
    }
    if ( ++nextX < xMax ) {
      iterNext( nextX )
    } else {
      console.log( "Done looping" )
    }
  }

  iterNext = R.partial( setTimeout, loopForX, 0 )
  iterNext = loopForX

  iterNext( 0 )
}

function variableDirector(
  xMax: number, yMax: number, xCols: number[], yCols: number[], plotter: IRegionPlotter
): void {
  let iterNext: BinaryTailIter = ( x, ii ) => { }

  function loopForXI( nextX: number, ii: number ): void {
    let nextY = -1
    while ( ++nextY < yMax ) {
      plotter.plot( nextX, nextY, xCols[ ii ], yCols[ ii++ ] )
    }
    if ( ++nextX < xMax ) {
      iterNext( nextX, ii )
    } else {
      console.log( "Done looping" )
    }
  }

  iterNext = R.partial( setTimeout, loopForXI, 0 )
  iterNext = loopForXI

  iterNext( 0, 0 )
}
