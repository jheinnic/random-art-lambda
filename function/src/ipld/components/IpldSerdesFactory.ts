import * as codec from "@ipld/dag-cbor"
import { StringKeys } from "simplytyped"
import { Inject, Injectable, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"
import { BlockCodec, CID, MultihashHasher } from "multiformats"
// import { encode } from "multiformats/block"
// import { sha256 as hasher } from "multiformats/hashes/sha2"
import { InvalidArgumentException } from "node-exceptions"

import { create, createValidate, fromDSL } from "./IpldSchemaTools.mjs"
import { RepresentDomainPair, ISerdesFactory, ISerdes } from "../interface/index.js"
import { IpldSerdes } from "./IpldSerdes.js"

@Injectable()
export class IpldSerdesFactory<RDS extends Record<string, RepresentDomainPair>, Code extends number, Hash extends number> implements ISerdesFactory<RDS> {
  private readonly schemaDmt: unknown;
  constructor (
    schemaDsl: string,
    private readonly codec: BlockCodec<Code, RepresentDomainPair[0]>,
    private readonly hasher: MultihashHasher<Hash>
  ) {
    this.schemaDmt = fromDSL( schemaDsl );
  }

  public getProduction<P extends StringKeys<RDS>>( rootProduction: P ): ISerdes<RDS[P]> {
    // create a typed converter/validator
    // const validate = createValidate( this.schemaDmt )
    const converter = create( this.schemaDmt, rootProduction )
    if ( converter == null ) {
      throw new InvalidArgumentException( 'No production named "' + rootProduction + '" was found in schema, check your schema dsl for typos or other errors' )
    }

    const toRepresentation = converter.toRepresentation
    const toTyped = converter.toTyped

    return new IpldSerdes<RDS[P], Code, Hash>( toRepresentation, toTyped, this.codec, this.hasher ) //  validate )
  }
}


// export function curryRootProduction<RDS extends Record<string, RepresentDomainPair>, P extends StringKeyOf<RDS>>(rootProduction: P) {
//   function getProductionSerdes( factory: ISerdesFactory<RDS> ): ISerdes<RDS[P]> {
//     return factory.getProduction( rootProduction )
//   }
//   return getProductionSerdes
// }