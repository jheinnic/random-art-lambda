import { Logger } from "@nestjs/common"
import {
   PaintGeometry,
   PixelsString,
   PixelsData,
   PaintedString,
   PaintedData,
} from "../interface/NamedValues.js"
import { Canvas, CanvasRenderingContext2D, ImageData } from "canvas"
import { AsyncLocalStorage } from "node:async_hooks"
import { PlotMapGeometry } from "../../painting/messages/values/PlotMapGeometry.js"
import { PaintResolution } from "../../painting/messages/values/PaintResolution.js"

const LOGGER_STORE = new AsyncLocalStorage<Logger>()
LOGGER_STORE.enterWith(new Logger("NominalUtil"))

function newFunction(): Logger {
   let logger: Logger | undefined = LOGGER_STORE.getStore()
   if (logger == null) {
      logger = new Logger("NominalUtil")
      LOGGER_STORE.enterWith(logger)
   }
   return logger
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
      geometry: PaintGeometry | PaintResolution,
   ): pixelsString is PixelsString {
      const buffer: Buffer<ArrayBuffer> = Buffer.from(pixelsString, "base64url")
      const resolution: PaintResolution =
         "imageSize" in geometry ? geometry.imageSize : geometry
      return (
         buffer.length ===
            4 *
               (resolution.width / resolution.size) *
               (resolution.height / resolution.size) &&
         buffer.toString("base64url") === pixelsString
      )
   }

   static blessPixelsData(
      pixelsData: Uint8ClampedArray,
      geometry: PaintGeometry | PaintResolution,
   ): pixelsData is PixelsData {
      const resolution: PaintResolution =
         "imageSize" in geometry ? geometry.imageSize : geometry
      return (
         pixelsData.length ===
         4 *
            (resolution.width / resolution.size) *
            (resolution.height / resolution.size)
      )
   }

   static fromPixelsData(pixelsData: PixelsData): PixelsString {
      return Buffer.from(pixelsData.buffer).toString(
         "base64url",
      ) as PixelsString
   }

   static toPixelsData(
      pixelsString: string | PixelsString,
      geometry: PaintGeometry | PaintResolution,
   ): PixelsData {
      const buffer: Buffer<ArrayBuffer> = Buffer.from(pixelsString, "base64url")
      const resolution: PaintResolution =
         "imageSize" in geometry ? geometry.imageSize : geometry
      const expectedBufferLength =
         4 * resolution.width * resolution.height * resolution.size
      if (buffer.length !== expectedBufferLength) {
         throw new Error(
            `Expected bufferLength === ${expectedBufferLength} did not match actual buffer length, ${buffer.length}`,
         )
      }
      return new Uint8ClampedArray(
         buffer.buffer,
         buffer.byteOffset,
         buffer.byteLength,
      ) as PixelsData
   }

   static toPaintedData(
      pixelBytes: PixelsData | Uint8ClampedArray,
      geometry: PaintGeometry | PaintResolution,
   ): PaintedData
   static toPaintedData(
      pixelsString: PixelsString | string,
      geometry: PaintGeometry | PaintResolution,
   ): PaintedData
   static toPaintedData(
      pixels: PixelsString | string | PixelsData | Uint8ClampedArray,
      geometry: PaintGeometry | PaintResolution,
   ): PaintedData {
      const logger: Logger = newFunction()
      const resolution: PaintResolution =
         "imageSize" in geometry ? geometry.imageSize : geometry
      const width = resolution.width * resolution.size
      const height: number = resolution.height * resolution.size
      let uint8Array: Uint8ClampedArray

      if (typeof pixels === "string") {
         const buffer: Buffer<ArrayBuffer> = Buffer.from(pixels, "base64url")
         uint8Array = new Uint8ClampedArray(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength,
         )
      } else {
         uint8Array = pixels
      }

      const canvas = new Canvas(width, height)
      const ctx: CanvasRenderingContext2D = canvas.getContext("2d", {
         alpha: false,
         pixelFormat: "RGB24",
      })
      const imageData: ImageData = new ImageData(uint8Array, width, height)
      ctx.putImageData(imageData, 0, 0)

      const paintedBuffer: PaintedData = canvas.toBuffer(
         "image/png",
      ) as PaintedData
      logger.log(
         `Context allocated is width=${width}, height=${height}, with pixelSize=${resolution.size}`,
      )
      return paintedBuffer
   }

   static fromPaintedData(pixelsData: PaintedData): PaintedString {
      return pixelsData.toString("base64url") as PaintedString
   }

   static blessPaintedString(
      paintedString: string,
      _geometry: PaintGeometry | PaintResolution,
   ): paintedString is PaintedString {
      throw new Error("Unsupported bless operation")
   }

   static blessPaintedData(
      paintedData: Buffer,
      _geometry: PaintGeometry | PaintResolution,
   ): paintedData is PaintedData {
      throw new Error("Unsupported bless operation")
   }

   static blessGeometry(
      geometry: PlotMapGeometry,
   ): asserts geometry is PaintGeometry {
      const logger: Logger = newFunction()
      const {
         width: pixelWidth,
         height: pixelHeight,
         size: pixelSize,
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

   // static blessPixelWidth(widthNumber: number): widthNumber is PixelWidth {
   //    return Math.round(widthNumber) === widthNumber && widthNumber > 0
   // }

   // static blessPixelHeight(heightNumber: number): heightNumber is PixelHeight {
   //    return Math.round(heightNumber) === heightNumber && heightNumber > 0
   // }

   // static blessRegionWidth(widthNumber: number): widthNumber is RegionWidth {
   //    return widthNumber > 0
   // }

   // static blessRegionHeight(
   //    heightNumber: number,
   // ): heightNumber is RegionHeight {
   //    return heightNumber > 0
   // }
}
