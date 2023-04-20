import { ISchemaSerdes } from "./ISchemaSerdes.js"

export interface ISchemaSerdesFactory {
    parseDsl<Representation, DomainModel>(schema: String): ISchemaSerdes<Representation, DomainModel>
}