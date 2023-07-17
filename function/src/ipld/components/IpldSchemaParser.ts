import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"
import { CID } from "multiformats"
import { encode } from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { fromDSL } from "./IpldSchemaTools.mjs"
import { RepresentDomainPair, ISchemaParser, ISerdesFactory } from "../interface/index.js"
import { IpldSerdesFactory } from "./IpldSerdesFactory.js"
import { SchemaDslConfiguration } from "../di/SchemaDslConfiguration.js"

@Injectable()
export class IpldSchemaParser implements ISchemaParser {
  public parseDsl<RDS extends Record<string, RepresentDomainPair>>( schemaDsl: string ): ISerdesFactory<RDS> {
    // parse schema
    const schemaDmt = fromDSL( schemaDsl )
    return new IpldSerdesFactory<RDS>( schemaDmt )
  }
}


export function parseSchemaDsl<RDS extends Record<string, RepresentDomainPair>>( parser: ISchemaParser, moduleConfig: SchemaDslConfiguration ): ISerdesFactory<RDS> {
  return parser.parseDsl( moduleConfig.schemaDsl )
}
