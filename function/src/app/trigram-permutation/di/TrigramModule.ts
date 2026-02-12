import { DynamicModule, Module } from "@nestjs/common"
import { PermutationExpander } from "../logic/PermutationExpander.js"
import { TrigramProjectSubmitter } from "../components/TrigramProjectSubmitter.js"
import { TrigramModuleTypes } from "./Types.js"
import {
   InjectableModuleClassFactory,
   DefaultDirector,
   IDynamicModuleBuilder,
   ModuleDependencies,
   ModuleDependenciesOption,
} from "../../../modules/index.js"

/**
 * Configuration for the Trigram Permutation Gallery application
 */
export interface TrigramModuleOptions {
   /**
    * Role this node plays:
    * - "submitter": Can submit projects to the queue
    * - "worker": Processes painting and gathering jobs
    * - "both": Both submitter and worker (for development)
    */
   role: "submitter" | "worker" | "both"
}

const injectModuleTokens = {
   FlowProducer: TrigramModuleTypes.RandomArtFlowProducer,
}

const moduleHost = InjectableModuleClassFactory.create<
   TrigramModuleOptions,
   typeof injectModuleTokens
>(injectModuleTokens, (options: TrigramModuleOptions): DefaultDirector => {
   return (builder: IDynamicModuleBuilder): void => {
      console.log(JSON.stringify(options))
      if (options.role === "submitter" || options.role === "both") {
         builder.exportProviders(
            {
               useClass: PermutationExpander,
               provide: TrigramModuleTypes.PermutationExpander,
            },
            {
               useClass: TrigramProjectSubmitter,
               provide: TrigramModuleTypes.ProjectSubmitter,
            },
         )
      }
   }
})

export type TrigramModuleConfiguration = typeof moduleHost.externalConfig

/**
 * NestJS module for the Trigram Permutation Gallery application.
 *
 * This module provides:
 * - PermutationExpander: Converts project specs to paint tasks
 * - TrigramProjectSubmitter: Submits expanded projects to the queue
 *
 * @example
 * // In your app bootstrap:
 * const app = await NestFactory.createApplicationContext(
 *   TrigramAppModule.forRoot({
 *     role: "submitter",
 *   })
 * )
 *
 * const submitter = app.get(TrigramProjectSubmitter)
 * await submitter.submitProject(spec)
 */
@Module({})
export class TrigramModule extends moduleHost.build() {
   static forRoot(options: TrigramModuleConfiguration): DynamicModule {
      return super.forRoot(options)
   }
}
