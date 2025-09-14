import { StringKeys } from "simplytyped"
import { ISerdes } from "./ISerdes.js"
import {
   RepresentDomainTuple,
   RepresentDomainTupleByName,
   SchemaNameOf,
} from "./RepresentDomainPair.js"

export interface ISerdesFactory<
   RDS extends RepresentDomainTuple<string, unknown, unknown>,
> {
   getProduction: <P extends SchemaNameOf<RDS>>(
      rootProduction: P,
   ) => ISerdes<RepresentDomainTupleByName<P, RDS>>
}
