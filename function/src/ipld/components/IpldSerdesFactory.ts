import { Injectable } from "@nestjs/common"
import type { BlockCodec, MultihashHasher } from "multiformats"
import { InvalidArgumentException } from "node-exceptions"

import { create, fromDSL } from "./IpldSchemaTools.mjs"
import { IpldSerdes } from "./IpldSerdes.js"
import type {
   ISerdesFactory,
   ISerdes,
   RepresentationOf,
   RepresentDomainTuple,
   RepresentDomainTupleByName,
   SchemaNameOf,
} from "../interface/index.js"

@Injectable()
export class IpldSerdesFactory<
   RDS extends RepresentDomainTuple<string, unknown, unknown>,
   Code extends number,
   Hash extends number,
> implements ISerdesFactory<RDS>
{
   private readonly schemaDmt: unknown
   constructor(
      schemaDsl: string,
      private readonly codec: BlockCodec<Code, RepresentationOf<RDS>>,
      private readonly hasher: MultihashHasher<Hash>,
   ) {
      this.schemaDmt = fromDSL(schemaDsl)
   }

   getProduction<P extends SchemaNameOf<RDS>>(
      rootProduction: P,
   ): ISerdes<RepresentDomainTupleByName<P, RDS>> {
      // create a typed converter/validator
      // const validate = createValidate( this.schemaDmt )
      const converter = create(this.schemaDmt, rootProduction)
      if (converter == null) {
         throw new InvalidArgumentException(
            'No production named "' +
               rootProduction +
               '" was found in schema, check your schema dsl for typos or other errors',
         )
      }

      const toRepresentation = converter.toRepresentation
      const toTyped = converter.toTyped

      return new IpldSerdes<RepresentDomainTupleByName<P, RDS>, Code, Hash>(
         toRepresentation,
         toTyped,
         this.codec,
         this.hasher,
      ) //  validate )
   }
}

// export function curryRootProduction<RDS extends Record<string, RepresentDomainPair>, P extends StringKeyOf<RDS>>(rootProduction: P) {
//   function getProductionSerdes( factory: ISerdesFactory<RDS> ): ISerdes<RDS[P]> {
//     return factory.getProduction( rootProduction )
//   }
//   return getProductionSerdes
// }
