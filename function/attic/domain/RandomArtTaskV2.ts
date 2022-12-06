// import { AggregateRoot } from "@nestjs/cqrs"

// import { IRandomArtTaskEvent } from "../../interface/events/IRandomArtTaskEvent.js"
// import { CreatedRandomArtTaskEvent } from "../../interface/events/CreatedRandomArtTaskEvent.js"
// import { SeededGenModelEvent } from "../../interface/events/SeededGenModelEvent.js"
// import { LinkedPlotMapEvent } from "../../interface/events/LinkedPlotMapEvent.js"

export class RandomArtTaskV2 {
  // extends AggregateRoot<IRandomArtTaskEvent> {
  constructor (
    public readonly cid: string,
    public readonly prefixBytes: Uint8Array,
    public readonly prefixCid: string,
    public readonly suffixBytes: Uint8Array,
    public readonly suffixCid: string,
    public readonly plotMapBytes: Uint8Array,
    public readonly plotMapCid: string
  ) {}

  // public createNewTask (): void {
  // this.apply(new CreatedRandomArtTaskEvent(this.cid))
  // }

  // public seedGenModel (
  // prefixBytes: Uint8Array,
  // prefixCid: string,
  // suffixBytes: Uint8Array,
  // suffixCid: string
  // ): void {
  // this.apply(
  // new SeededGenModelEvent(
  // this.cid,
  // prefixBytes,
  // prefixCid,
  // suffixBytes,
  // suffixCid
  // )
  // )
  // }

  // public linkPlotMap (plotMapBytes: Uint8Array, plotMapCid: string): void {
  // this.apply(new LinkedPlotMapEvent(this.cid, plotMapBytes, plotMapCid))
  // }

  // public acceptPaintedCanvas (canvas: Canvas) {}

  // public closeTask () {}

  // public abandonedTask () {}
}
