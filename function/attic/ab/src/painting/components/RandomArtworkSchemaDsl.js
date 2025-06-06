var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as codec from "@ipld/dag-cbor";
import { Injectable } from "@nestjs/common";
import { encode } from "multiformats/block";
import { sha256 as hasher } from "multiformats/hashes/sha2";
import { create, createValidate, fromDSL } from "../../ipld/components/IpldSchemaTools.mjs";
const schemaDsl = `type ModelEnvelope union {
  | RandomArtworkSpec "RandomArtworkSpec_0.1.0"
  | Prefix "Prefix_0.0.1"
} representation envelope {
  discriminantKey "repoVersion"
  contentKey "model"
}

type Prefix Bytes

type RandomArtworkSpec struct {
  prefix Bytes
  suffix Bytes
  regionMap Link
  engineVersion String
} representation tuple
`;
let RandomArtworkSchemaDsl = class RandomArtworkSchemaDsl {
    // parse schema
    schemaDmt = fromDSL(schemaDsl);
    // create a typed converter/validator
    converter = create(this.schemaDmt, "ModelEnvelope");
    validate = createValidate(this.schemaDmt);
    toRepresentation = this.converter.toRepresentation;
    toTyped = this.converter.toTyped;
    async toBlock(typed) {
        const specData = this.converter.toRepresentation({ RandomArtworkSpec: typed });
        if (specData === undefined) {
            throw new TypeError("Invalid typed form, does not match schema");
        }
        const block = await encode({ codec, hasher, value: specData });
        return block;
    }
    fromBlock(block) {
        return this.converter.toTyped(block.value).RandomArtModel;
    }
};
RandomArtworkSchemaDsl = __decorate([
    Injectable()
], RandomArtworkSchemaDsl);
export { RandomArtworkSchemaDsl };
//# sourceMappingURL=RandomArtworkSchemaDsl.js.map