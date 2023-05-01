import { ISchemaSerdes } from "./ISchemaSerdes.js"

export interface ISchemaSerdesFactory {
    parseDsl<Representation, DomainModel>( schemaDsl: string, rootProduction: string ): ISchemaSerdes<Representation, DomainModel>
}