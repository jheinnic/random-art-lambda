import { ForwardReference } from '@nestjs/common'
import { Inject, Injectable, Module } from '@nestjs/common'
import { IpfsModule } from '../../src/ipfs/di/IpfsModule.js'
import { TestBed } from './TestBed.js'
import { MY_BLOCK_STORE, MY_TEST_BED } from './TestTypes.js'



@Module( {
  imports: [
    IpfsModule.register(
      { rootPath: "/home/ionadmin/Documents/testBlocks", cacheSize: 500, injectToken: MY_BLOCK_STORE }
    )
  ],
  providers: [],
  exports: [ IpfsModule ]
} )
export class TestDepModule { }


@Module( {
  imports: [ TestDepModule ],
  providers: [ { provide: MY_TEST_BED, useClass: TestBed } ],
  exports: [ MY_TEST_BED ]
} )
export class TestModule { }
