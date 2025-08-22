import { StringKeys } from 'simplytyped'
import { ISerdes } from "./ISerdes.js"
import { RepresentDomainPair } from "./RepresentDomainPair.js"
import { ISchemaSignature } from "./ISchemaSignature.js"

export interface ISerdesFactory<RDS extends ISchemaSignature> {
    getProduction<P extends StringKeys<RDS>>( rootProduction: P ): ISerdes<RDS[P]>
}
