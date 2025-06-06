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
import { encode, decode } from "multiformats/block";
let IpldSerdes = class IpldSerdes {
    toRepresentation;
    toDomainModel;
    codec;
    hasher;
    constructor(toRepresentation, toDomainModel, codec, hasher) {
        this.toRepresentation = toRepresentation;
        this.toDomainModel = toDomainModel;
        this.codec = codec;
        this.hasher = hasher;
    }
    /**
       * Transform-to-representation and Encode
       */
    async encodeModel(typed) {
        const specData = this.toRepresentation(typed);
        if (specData === undefined) {
            throw new TypeError("Invalid typed form, does not match schema");
        }
        // const block: BlockView<RDP[0]> = await encode<RDP[0], 113, 18>(
        const codec = this.codec;
        const hasher = this.hasher;
        const block = await encode({ codec, hasher, value: specData });
        return block;
    }
    /**
     * Decode
     * @param bytes
     * @returns Decoded Block
     */
    async bytesToBlock(bytes) {
        const codec = this.codec;
        const hasher = this.hasher;
        const block = await decode({ codec, hasher, bytes });
        if (block === undefined) {
            throw new TypeError("Invalid deserialized representation, did not follow from schema");
        }
        return block;
    }
    /**
     * Decode and Transform-to-domain
     * @param bytes
     * @returns Domain model from a decoded block
     */
    async bytesToDomain(bytes) {
        const domainModel = await this.blockToDomain(await this.bytesToBlock(bytes));
        return domainModel;
    }
    /**
     * Transform-to-domain
     * @param block
     * @returns Domain model
     */
    async blockToDomain(block) {
        const domainModel = this.toDomainModel(block.value);
        if (domainModel === undefined) {
            throw new TypeError("Invalid deserialized representation form, did not follow schema");
        }
        return domainModel;
    }
};
IpldSerdes = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Function, Function, Object, Object])
], IpldSerdes);
export { IpldSerdes };
//# sourceMappingURL=IpldSerdes.js.map