import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"
import { CID } from "multiformats"
import { encode } from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import { InvalidArgumentException } from "node-exceptions"

import { create, createValidate, fromDSL } from "./IpldSchemaTools.mjs"
import { RepresentDomainPair, ISerdesFactory, ISerdes } from "../interface/index.js"
import { IpldSerdes } from "./IpldSerdes.js"

@Injectable()
export class IpldSerdesFactory<RDS extends Record<string, RepresentDomainPair>> implements ISerdesFactory<RDS> {
  constructor ( private readonly schemaDmt: unknown ) { }

  public getProduction<P extends keyof RDS>( rootProduction: P & string ): ISerdes<RDS[ P ]> {
    // create a typed converter/validator
    // const validate = createValidate( this.schemaDmt )
    const converter = create( this.schemaDmt, rootProduction )
    if ( converter == null ) {
      throw new InvalidArgumentException( 'No production named "' + rootProduction + '" was found in schema, check your schema dsl for typos or other errors' )
    }

    const toRepresentation = converter.toRepresentation
    const toTyped = converter.toTyped

    return new IpldSerdes<RDS[ P ]>( toRepresentation, toTyped ) //  validate )
  }
}


export function curryRootProduction<RDS extends Record<string, RepresentDomainPair>, P extends keyof RDS>(
  rootProduction: P
) {
  function getProductionSerdes( factory: ISerdesFactory<RDS> ): ISerdes<RDS[ P ]> {
    return factory.getProduction( rootProduction )
  }
  return getProductionSerdes
}