var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FsBlockstore_1;
import { Inject, Injectable } from "@nestjs/common";
import * as lockfile from "proper-lockfile";
import { LRUCache } from "lru-cache";
import { BaseBlockstore } from "blockstore-core";
import { base58btc } from "multiformats/bases/base58";
import { mkdir, readFile, stat, unlink, writeFile } from "fs/promises";
import { mkdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { FsBlockstoreConfiguration, IpfsModuleTypes } from "../di/index.js";
var OpenState;
(function (OpenState) {
    OpenState["CLOSED"] = "closed";
    OpenState["OPENING"] = "opening";
    OpenState["OPEN"] = "open";
    OpenState["CLOSING"] = "closing";
})(OpenState || (OpenState = {}));
let FsBlockstore = FsBlockstore_1 = class FsBlockstore extends BaseBlockstore {
    config;
    lruCache;
    static NO_OP_RELEASE = async () => { };
    lockRelease = FsBlockstore_1.NO_OP_RELEASE;
    rootPath;
    openState = OpenState.CLOSED;
    constructor(config, lruCache) {
        super();
        this.config = config;
        this.lruCache = lruCache;
        this.rootPath = config.rootPath;
        console.log("New FsBlockstore constructor call");
        this.openState = OpenState.OPENING;
        let rootStat;
        try {
            rootStat = statSync(this.rootPath);
        }
        catch {
            // TODO: mkdir may throw!
            mkdirSync(this.rootPath);
            rootStat = statSync(this.rootPath);
        }
        if (!rootStat.isDirectory()) {
            this.openState = OpenState.CLOSED;
            throw new Error(`Root path, ${this.rootPath}, must be a directory to open FsBlockStore!`);
        }
        lockfile.lockSync(this.rootPath, {
            lockfilePath: join(this.rootPath, ".lock"),
        });
        console.log("Lock acquired!");
        this.openState = OpenState.OPEN;
    }
    // async open(): Promise<void> {
    //   if ( this.openState === OpenState.OPEN ) {
    //     return
    //   }
    //   if ( this.openState !== OpenState.CLOSED ) {
    //     throw new Error( `${ this.openState } transition in progress` )
    //   }
    //   this.openState = OpenState.OPENING
    //   let rootStat: Stats
    //   try {
    //     rootStat = await stat( this.rootPath )
    //   } catch {
    //     await mkdir( this.rootPath )
    //     rootStat = await stat( this.rootPath )
    //   }
    //   if ( !rootStat.isDirectory() ) {
    //     this.openState = OpenState.CLOSED
    //     throw new Error(
    //       `Root path, ${ this.rootPath }, must be a directory to open FsBlockStore!`,
    //     )
    //   }
    //   this.lockRelease = await lockfile.lock( this.rootPath, {
    //     lockfilePath: join( this.rootPath, ".lock" ),
    //   } )
    //   console.log( "Lock acquired!" )
    //   this.openState = OpenState.OPEN
    // }
    /**
     * @returns {Promise<void>}
     */
    // async close(): Promise<void> {
    //   if ( this.openState === OpenState.CLOSED ) {
    //     return
    //   }
    //   if ( this.openState !== OpenState.OPEN ) {
    //     throw Error( `${ this.openState } transition in progress` )
    //   }
    //   this.openState = OpenState.CLOSING
    //   const releaseHandle = await this.lockRelease()
    //   console.log( "Repository lock release initiated" )
    //   const released = await releaseHandle
    //   console.log( released )
    //   console.log( releaseHandle )
    //   console.log( "Repository lock released" )
    //   this.lockRelease = FsBlockstore.NO_OP_RELEASE
    //   this.openState = OpenState.CLOSED
    // }
    /**
     * @param {CID} key
     * @param {Uint8Array} val
     * @param {Options} [options]
     * @returns {Promise<void>}
     */
    async put(key, val, options) {
        // if (val.length < 1000) {
        //   console.error(`${key.toString()} and ${JSON.stringify(val)}`)
        // } else {
        //   console.error(`${key.toString()} and ${val.length}`)
        // }
        this.assertIsOpen(options);
        const cidStr = fromCidToString(key);
        const blockPath = fromCidToPath(this.rootPath, cidStr);
        await mkdir(dirname(blockPath), { recursive: true, mode: "0700" });
        this.assertIsOpen(options);
        try {
            await writeFile(blockPath, val, {
                signal: options?.signal,
                mode: "0600",
            });
            this.lruCache.set(cidStr, val);
            return key;
        }
        catch (err) {
            this.lruCache.delete(cidStr);
            await unlink(blockPath);
            throw err;
        }
    }
    /**
     * @param {CID} key
     * @param {Options} [options]
     * @returns {Promise<Uint8Array>}
     */
    async get(key, options) {
        this.assertIsOpen(options);
        let val;
        const cidStr = fromCidToString(key);
        if (options?.signal === undefined) {
            val = await this.lruCache.fetch(cidStr);
        }
        else {
            const signal = options.signal;
            const lruCache = this.lruCache;
            function abortFetch() {
                // TODO: Validate expectation that this will also abort the async fetchMethod!
                lruCache.delete(cidStr);
            }
            signal.addEventListener("abort", abortFetch, { once: true });
            val = await this.lruCache.fetch(cidStr);
            signal.removeEventListener("abort", abortFetch);
        }
        if (val === undefined) {
            throw new Error(`${cidStr} not found!`);
        }
        return val;
    }
    /**
     * @param {CID} key
     * @param {Options} [options]
     * @returns {Promise<boolean>}
     */
    async has(key, options) {
        this.assertIsOpen(options);
        const cidStr = fromCidToString(key);
        if (this.lruCache.has(cidStr)) {
            return true;
        }
        const blockPath = fromCidToPath(this.rootPath, cidStr);
        try {
            await stat(blockPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * @param {CID} key
     * @param {Options} [options]
     * @returns {Promise<void>}
     */
    async delete(key, options) {
        this.assertIsOpen(options);
        const cidStr = fromCidToString(key);
        const blockPath = fromCidToPath(this.rootPath, cidStr);
        this.lruCache.delete(cidStr);
        await unlink(blockPath);
    }
    assertIsOpen(options) {
        if (this.openState !== OpenState.OPEN) {
            throw new Error(`${this.openState} is not Open`);
        }
        if (options != null) {
            const { signal } = { ...options };
            if (signal?.aborted === true)
                throw new Error("Operation canceled");
        }
    }
};
FsBlockstore = FsBlockstore_1 = __decorate([
    Injectable(),
    __param(0, Inject(IpfsModuleTypes.FsBlockstoreConfiguration)),
    __param(1, Inject(IpfsModuleTypes.LruCache)),
    __metadata("design:paramtypes", [FsBlockstoreConfiguration,
        LRUCache])
], FsBlockstore);
export { FsBlockstore };
function fromCidToString(cid) {
    try {
        // return cid.toV0().toString()
        return cid.toString(base58btc);
    }
    catch {
        return cid.toString();
    }
}
function fromCidToPath(rootPath, key) {
    let keyStr = "";
    if (typeof key === "string") {
        keyStr = key;
    }
    else {
        keyStr = fromCidToString(key);
    }
    return join(rootPath, keyStr.slice(-6, -4), keyStr.slice(-4, -2), keyStr.slice(-2), keyStr.slice(0, -6));
}
function curryFetchMethod(rootPath) {
    async function fetchMethod(cidStr, staleValue, { signal, context }) {
        console.log(rootPath, cidStr);
        const blockPath = fromCidToPath(rootPath, cidStr);
        const readBuf = await readFile(blockPath, { signal });
        return Uint8Array.from(readBuf);
    }
    return fetchMethod;
}
export function buildLruCache(config) {
    return new LRUCache({
        max: config.cacheSize,
        // context: config.rootPath,
        fetchMethod: curryFetchMethod(config.rootPath),
    });
}
//# sourceMappingURL=FsBlockstore.js.map