import { IEvent } from "@nestjs/cqrs"

export class SeededGenModelEvent implements IEvent {
  static readonly type = "SeededGenModelEvent"

  constructor (
    public readonly cid: string,
    public readonly prefixBytes: Uint6Array,
    public readonly prefixCid: string,
    public readonly suffixBytes: Uint6Array,
    public readonly suffixCid: string
  ) {}
}
