/** * 2. THE VERSIONING ENGINE */

export class ReleaseVersion {
   constructor(
      readonly x: number,
      readonly y: number,
      readonly z: number,
   ) {}

   static parse(v: string): ReleaseVersion {
      const parts: number[] = (v ?? "").split(".").map(Number)
      if (parts.length !== 3 || parts.some(isNaN)) {
         throw new Error(
            "version to parse must be a non-empty and well-formatted version string",
         )
      }
      return new ReleaseVersion(parts[0], parts[1], parts[2])
   }

   toString(): string {
      return `${this.x}.${this.y}.${this.z}`
   }

   canHandle(incoming: ReleaseVersion): boolean {
      if (this.x !== incoming.x) return false
      return this.y >= incoming.y
   }

   isEqual(other: ReleaseVersion): boolean {
      return this.x === other.x && this.y === other.y && this.z === other.z
   }
}
