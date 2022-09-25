export function stringToSeed (input: string): Uint8Array {
  return Uint8Array.from(Buffer.from(input))
}

export function seedToString (input: Uint8Array | number[]): string {
  return Buffer.from(input).toString("utf-8")
}
