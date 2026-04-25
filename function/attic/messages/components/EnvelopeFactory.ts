import { Injectable } from "@nestjs/common"
import { WorkloadId } from "../interface/NamedValues.js"
import { ReleaseVersion } from "./ReleaseVersion.js"

@Injectable()
export class EnvelopeFactory {
   constructor(
      private readonly workloadId: WorkloadId,
      private readonly currentRelease: ReleaseVersion,
   ) {}
}
