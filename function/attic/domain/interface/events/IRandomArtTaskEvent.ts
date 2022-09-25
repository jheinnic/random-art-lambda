import { IEvent } from "@nestjs/cqrs"

// export interface IRandomArtTaskEvent extends IEvent {}

export type IRandomArtTaskEvent =
  | CreatedRandomArtTaskEvent
  | LinkedPlotMapEvent
  | SeededGenModelEvent
