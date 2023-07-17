import { ISerdesFactory } from "./ISerdesFactory.js"
import { RepresentDomainPair } from "./RepresentDomainPair.js"

export interface ISchemaParser {
    parseDsl<RDS extends Record<string, RepresentDomainPair>>( schemaDsl: string ): ISerdesFactory<RDS>
}