var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { IpfsModule } from '../../src/ipfs/di/IpfsModule.js';
import { TestBed } from './TestBed.js';
import { MY_BLOCK_STORE, MY_TEST_BED } from './TestTypes.js';
let TestDepModule = class TestDepModule {
};
TestDepModule = __decorate([
    Module({
        imports: [
            IpfsModule.register({ rootPath: "/home/ionadmin/Documents/testBlocks", cacheSize: 500, injectToken: MY_BLOCK_STORE })
        ],
        providers: [],
        exports: [IpfsModule]
    })
], TestDepModule);
export { TestDepModule };
let TestModule = class TestModule {
};
TestModule = __decorate([
    Module({
        imports: [TestDepModule],
        providers: [{ provide: MY_TEST_BED, useClass: TestBed }],
        exports: [MY_TEST_BED]
    })
], TestModule);
export { TestModule };
//# sourceMappingURL=TestMod.js.map