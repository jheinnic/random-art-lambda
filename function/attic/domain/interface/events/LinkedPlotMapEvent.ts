import { IEvent } from "@nestjs/cqrs"

export class LinkedPlotMapEvent implements IEvent {
  static readonly type = "LinkedPlotMapEvent"

  constructor (
    public readonly cid: string,
    public readonly plotMapBytes: Uint8Array,
    public readonly plotMapCid: string
  ) {}
}
