import { PaintProjectId } from "../../messages/values/index.js"

export interface IPaintProjectModel {
   readonly projectId: PaintProjectId
   readonly totalPaintTaskCount: number
}

export class PaintProjectModel {
   private readonly context: IPaintProjectModel

   constructor(context: IPaintProjectModel) {
      this.context = Object.assign({}, context)
   }

   public get projectId(): PaintProjectId {
      return this.context.projectId
   }

   public get paintTaskCount(): number {
      return this.context.totalPaintTaskCount
   }
}
