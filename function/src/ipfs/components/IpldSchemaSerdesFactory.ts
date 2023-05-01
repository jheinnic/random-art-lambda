import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"
import { CID } from "multiformats"
import { Block, encode } from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { create, createValidate, fromDSL } from "./IpldSchemaTools.mjs"
import { ISchemaSerdesFactory, ISchemaSerdes } from "../interface/index.js"
import { IpldSchemaSerdes } from "./IpldSchemaSerdes.js"

@Injectable()
export class IpldSchemaSerdesFactory implements ISchemaSerdesFactory {
  public parseDsl<Representation, DomainModel>( schemaDsl: string, rootProduction: string ): ISchemaSerdes<Representation, DomainModel> {
    // parse schema
    const schemaDmt = fromDSL( schemaDsl )

    // create a typed converter/validator
    const converter = create( schemaDmt, rootProduction )
    // const validate = createValidate( this.schemaDmt )
    const toRepresentation = converter.toRepresentation
    const toTyped = converter.toTyped

    return new IpldSchemaSerdes<Representation, DomainModel>( toRepresentation, toTyped ) //  validate )
  }
}
