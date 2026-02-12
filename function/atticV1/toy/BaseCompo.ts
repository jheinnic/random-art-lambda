export interface Params {
   id: number
}

export class Compo {
   public readonly _params: Params

   constructor(params: Params) {
      this._params = { ...params }
   }

   get id(): number {
      return this._params.id
   }
}
