import { Inject, Injectable } from "@nestjs/common"
import { UnixFS } from "ipfs-unixfs"
import { INamingService } from "../interface/INamingService"

@Injectable()
export class IpldNamingService implements INamingService {
  constructor (
    @Inject(IMessageService) _messageBusService,
    // @Inject(NamingContext) _namingContext,
    @Inject(IPlotMapLookupService) _plotMapLookup
  ) {}

  labelPlotMapSpec (command: LabelPlotMapSpec) {
    this.plotMapLookup.getPlotMapDataStream(command.plotMapLookup)
    UnixFS()
  }

  labelRandomArtTask (_command: LabelRandomArtTask) {
    throw new Error("Method not implemented.")
  }

  labelRandomArtResult (_command: LabelRandomArtResult) {
    throw new Error("Method not implemented.")
  }
}
