import { Logger } from "@nestjs/common"
import {
   ValidPaintGeometry,
   SizedPixelsString,
   ValidPixelData,
   SizedPngString,
   ValidPngData,
} from "../values/PaintingNamedValues.js"
import { Canvas, CanvasRenderingContext2D, ImageData } from "canvas"
import { AsyncLocalStorage } from "node:async_hooks"
import { PlotMapGeometry } from "../values/PlotMapGeometry.js"
import { PaintResolution } from "../values/PaintResolution.js"
import { RawPixelData } from "../values/RawPixelData.js"
import { RawPngBuffer } from "../values/RawPngBuffer.js"

const LOGGER_STORE = new AsyncLocalStorage<Logger>()

function getLogger(): Logger {
   let logger: Logger | undefined = LOGGER_STORE.getStore()
   if (logger == null) {
      logger = new Logger("NominalUtil")
      LOGGER_STORE.enterWith(logger)
   }
   return logger
}

interface ParsedPreamble {
   readonly firstComma: number
   readonly secondComma: number
   readonly pixelWidth: number
   readonly pixelHeight: number
}

function parsePreamble(source: string): ParsedPreamble {
   // 1. Find the delimiters without scanning the whole 4MB
   const firstComma = source.indexOf(",")
   const secondComma = source.indexOf(",", firstComma + 1)

   if (firstComma === -1 || secondComma === -1) {
      throw new Error("Invalid format: Commas not found.")
   }

   // 2. Extract the integers
   const pixelWidth = parseInt(source.substring(0, firstComma), 10)
   const pixelHeight = parseInt(
      source.substring(firstComma + 1, secondComma),
      10,
   )

   return { firstComma, secondComma, pixelWidth, pixelHeight }
}

function checkWidthHeight(
   pixelWidth: number,
   pixelHeight: number,
   geometry: ValidPaintGeometry | PaintResolution | undefined,
): boolean {
   if (geometry != null) {
      if (
         pixelWidth !==
            ("imageSize" in geometry
               ? geometry.imageSize.pixelWidth
               : geometry.pixelWidth) ||
         pixelHeight !==
            ("imageSize" in geometry
               ? geometry.imageSize.pixelHeight
               : geometry.pixelHeight)
      ) {
         return false
      }
   }
   return true
}

/**
 * Utility class for working with nominal types related to image/pixel data.
 *
 * This module provides validation and conversion utilities for:
 * - Prefix/Suffix seed data (base64url encoding)
 * - Pixel data (Canvas ImageData conversion)
 * - Dimension validation (pixel and region sizes)
 *
 * Related utilities in other modules:
 * - CIDUtil: CID validation/conversion (blessCID, toCID, fromCID)
 * - SeedEncodingUtil: Lightweight seed encoding without canvas dependency
 * - ULIDFactory: ULID generation and validation (blessUlidString)
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class NominalUtil {
   static blessPixelsString(
      pixelsString: string,
      geometry?: ValidPaintGeometry | PaintResolution,
   ): pixelsString is SizedPixelsString {
      try {
         const { secondComma, pixelWidth, pixelHeight } =
            parsePreamble(pixelsString)
         return (
            pixelsString.length ===
               secondComma +
                  1 +
                  Math.ceil((8 * 4 * pixelWidth * pixelHeight) / 6) &&
            checkWidthHeight(pixelWidth, pixelHeight, geometry)
         )
      } catch {
         return false
      }
   }

   static assertPixelsData(
      pixelsData: RawPixelData,
      geometry?: ValidPaintGeometry | PaintResolution,
   ): asserts pixelsData is ValidPixelData {
      if (
         !checkWidthHeight(
            pixelsData.pixelWidth,
            pixelsData.pixelHeight,
            geometry,
         )
      ) {
         const geomStr = JSON.stringify(geometry)
         throw new Error(
            `${pixelsData.pixelWidth} and ${pixelsData.pixelHeight} do not match ${geomStr}`,
         )
      }
      if (
         pixelsData.data.length ===
         4 * pixelsData.pixelHeight * pixelsData.pixelWidth
      ) {
         throw new Error(
            `${pixelsData.pixelWidth} x ${pixelsData.pixelHeight} are incorrect for data size of ${pixelsData.data.length}`,
         )
      }
   }

   static fromPixelsData(pixelsData: ValidPixelData): SizedPixelsString {
      const width: string = pixelsData.pixelWidth.toString(10)
      const height: string = pixelsData.pixelHeight.toString(10)
      return (`${width},${height},` +
         Buffer.from(pixelsData.data).toString(
            "base64url",
         )) as SizedPixelsString
   }

   static toPixelsData(pixelsString: SizedPixelsString): ValidPixelData {
      const { secondComma, pixelWidth, pixelHeight } =
         parsePreamble(pixelsString)
      const buffer: Buffer<ArrayBuffer> = Buffer.from(
         pixelsString.substring(secondComma + 1),
         "base64url",
      )
      return {
         data: new Uint8ClampedArray(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength,
         ),
         pixelWidth,
         pixelHeight,
      } satisfies RawPixelData as ValidPixelData
   }

   static encodePixelsData(pixelBytes: ValidPixelData): ValidPngData
   static encodePixelsData(pixelsString: SizedPixelsString): ValidPngData
   static encodePixelsData(
      pixels: ValidPixelData | SizedPixelsString,
   ): ValidPngData {
      const logger: Logger = getLogger()

      let asPixels: ValidPixelData
      if (typeof pixels === "string") {
         asPixels = NominalUtil.toPixelsData(pixels)
      } else {
         asPixels = pixels
      }

      const canvas = new Canvas(asPixels.pixelWidth, asPixels.pixelHeight)
      const ctx: CanvasRenderingContext2D = canvas.getContext("2d", {
         alpha: false,
         pixelFormat: "RGB24",
      })
      const imageData: ImageData = new ImageData(
         asPixels.data,
         asPixels.pixelWidth,
         asPixels.pixelHeight,
      )
      ctx.putImageData(imageData, 0, 0)

      const paintedBuffer: ValidPngData = {
         data: canvas.toBuffer("image/png"),
         pixelWidth: asPixels.pixelWidth,
         pixelHeight: asPixels.pixelHeight,
      } satisfies RawPngBuffer as ValidPngData
      logger.log(
         // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
         `Context allocated is width=${asPixels.pixelWidth}, height=${asPixels.pixelHeight}, with pixelSize=1`,
      )
      return paintedBuffer
   }

   static blessPaintedString(
      paintedString: string,
      geometry?: ValidPaintGeometry | PaintResolution,
   ): paintedString is SizedPngString {
      const { secondComma, pixelWidth, pixelHeight } =
         parsePreamble(paintedString)
      // TODO: Must decode the PNG data to truly validate dimension accuracy
      return (
         checkWidthHeight(pixelWidth, pixelHeight, geometry) &&
         paintedString.length > secondComma
      )
   }

   static blessPaintedData(
      paintedData: RawPngBuffer,
      geometry?: ValidPaintGeometry | PaintResolution,
   ): paintedData is ValidPngData {
      // TODO: This must decode the PNG buffer to test it matches the given
      //       dimensions
      return (
         checkWidthHeight(
            paintedData.pixelWidth,
            paintedData.pixelHeight,
            geometry,
         ) && true
         // paintedData.data.length ===
         // 4 * paintedData.pixelHeight * paintedData.pixelWidth
      )
   }

   static fromPaintedData(paintedData: ValidPngData): SizedPngString {
      const width: string = paintedData.pixelWidth.toString(10)
      const height: string = paintedData.pixelHeight.toString(10)
      return (`${width},${height},` +
         paintedData.data.toString("base64url")) as SizedPngString
   }

   static toPaintedData(paintedString: SizedPngString): ValidPngData {
      const { secondComma, pixelWidth, pixelHeight } =
         parsePreamble(paintedString)
      const data: Buffer<ArrayBuffer> = Buffer.from(
         paintedString.substring(secondComma + 1),
         "base64url",
      )
      return {
         data,
         pixelWidth,
         pixelHeight,
      } satisfies RawPngBuffer as ValidPngData
   }

   /**
    * Checks that the plot input value boundaries and image dimensions in pixels from
    * geometry have the same aspect ratio and asserts an upcast to ValidPaintGeometry if
    * so.
    */
   static assertValidPaintGeometry(
      geometry: PlotMapGeometry,
   ): asserts geometry is ValidPaintGeometry {
      const logger: Logger = getLogger()
      const {
         pixelWidth: pixelWidth,
         pixelHeight: pixelHeight,
         pixelSize: pixelSize,
      } = geometry.imageSize
      const { top, bottom, left, right } = geometry.boundary
      const spatialHeight: number = top - bottom
      const spatialWidth: number = right - left
      if (pixelWidth % pixelSize > 0 || pixelHeight % pixelSize > 0) {
         throw new Error(
            `${pixelWidth} and/or ${pixelHeight} do not evenly divide by ${pixelSize}`,
         )
      }
      const spatialRatio = spatialWidth / spatialHeight
      const logicalHeight = pixelWidth / pixelSize
      const logicalWidth: number = pixelHeight / pixelSize
      const idealHeight = Math.round(
         logicalWidth / (spatialWidth / spatialHeight),
      )
      const idealWidth = Math.round(
         logicalHeight * (spatialWidth / spatialHeight),
      )
      logger.log(
         `${JSON.stringify(geometry)} had spatial ratio of ${spatialRatio} for ideal width/height of ${idealWidth}/${idealHeight}`,
      )
      if (idealWidth !== logicalWidth || idealHeight !== logicalHeight) {
         throw new Error(
            `For ${JSON.stringify(geometry)}, ${spatialWidth} : ${spatialHeight} => logical ${logicalWidth} : ${logicalHeight} was expect to be either ${logicalWidth} : ${idealHeight} or ${idealWidth} : ${logicalHeight}`,
         )
      }
   }
}
