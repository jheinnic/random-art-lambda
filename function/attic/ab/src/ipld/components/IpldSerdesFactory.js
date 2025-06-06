var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@nestjs/common";
// import { encode } from "multiformats/block"
// import { sha256 as hasher } from "multiformats/hashes/sha2"
import { InvalidArgumentException } from "node-exceptions";
import { create, fromDSL } from "./IpldSchemaTools.mjs";
import { IpldSerdes } from "./IpldSerdes.js";
let IpldSerdesFactory = class IpldSerdesFactory {
    codec;
    hasher;
    schemaDmt;
    constructor(schemaDsl, codec, hasher) {
        this.codec = codec;
        this.hasher = hasher;
        this.schemaDmt = fromDSL(schemaDsl);
    }
    getProduction(rootProduction) {
        // create a typed converter/validator
        // const validate = createValidate( this.schemaDmt )
        const converter = create(this.schemaDmt, rootProduction);
        if (converter == null) {
            throw new InvalidArgumentException('No production named "' + rootProduction + '" was found in schema, check your schema dsl for typos or other errors');
        }
        const toRepresentation = converter.toRepresentation;
        const toTyped = converter.toTyped;
        return new IpldSerdes(toRepresentation, toTyped, this.codec, this.hasher); //  validate )
    }
};
IpldSerdesFactory = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [String, Object, Object])
], IpldSerdesFactory);
export { IpldSerdesFactory };
// export function curryRootProduction<RDS extends Record<string, RepresentDomainPair>, P extends StringKeyOf<RDS>>(rootProduction: P) {
//   function getProductionSerdes( factory: ISerdesFactory<RDS> ): ISerdes<RDS[P]> {
//     return factory.getProduction( rootProduction )
//   }
//   return getProductionSerdes
// }
//# sourceMappingURL=IpldSerdesFactory.js.map