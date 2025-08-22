export type RepresentDomainPair<
   Representation = unknown,
   DomainModel = unknown,
> = [Representation, DomainModel]

export type NamedRepresentDomainPair<
   RDP extends RepresentDomainPair = [unknown, unknown],
   Name extends string = string,
> =
   RDP extends RepresentDomainPair<infer Representation, infer DomainModel>
      ? [Name, Representation, DomainModel]
      : never
