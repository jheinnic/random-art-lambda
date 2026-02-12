export interface IRandomArtPainter {
  setPixelsPerPaintCall: (pixelCount: number) => void

  setPaintCallsPerTask: (callCount: number) => void

  setBruteForceMode: () => void

  doPaintCall: () => number

  checkPaintProgress: () => number
}
