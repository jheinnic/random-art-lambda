export interface ISchemaDslFactory {
    parseDsl<Representation, DomainModel>(schema: String): ISchemaDsl<Representation, DomainModel>
}