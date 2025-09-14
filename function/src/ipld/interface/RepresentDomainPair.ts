export type RepresentDomainTuple<
   SchemaName extends string,
   Representation,
   DomainModel,
> = [SchemaName, Representation, DomainModel]

export type SchemaNameOf<
   P extends RepresentDomainTuple<string, unknown, unknown>,
> = P extends RepresentDomainTuple<infer M, unknown, unknown> ? M : never

export type RepresentationOf<
   P extends RepresentDomainTuple<string, unknown, unknown>,
> = P extends RepresentDomainTuple<string, infer R, unknown> ? R : never

export type DomainModelOf<
   P extends RepresentDomainTuple<string, unknown, unknown>,
> = P extends RepresentDomainTuple<string, unknown, infer D> ? D : never

export type RepresentDomainTupleByName<
   N extends string,
   P extends RepresentDomainTuple<string, unknown, unknown>,
> = P extends P ? (SchemaNameOf<P> extends N ? P : never) : never

// export type NamedRepresentDomainPair<
//    RDP extends RepresentDomainPair = [unknown, unknown],
//    Name extends string = string,
// > = [Name, [RepresentationOf<RDP>, DomainModelOf<RDP>]]
