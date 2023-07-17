import { ISerdes } from "./ISerdes.js"
import { RepresentDomainPair } from "./RepresentDomainPair.js"

export interface ISerdesFactory<RDS extends Record<string, RepresentDomainPair>> {
    getProduction<P extends keyof RDS>( rootProduction: P ): ISerdes<RDS[ P ]>
}