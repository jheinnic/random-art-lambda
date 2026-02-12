import { DynamicModule, Injectable, OnModuleInit } from "@nestjs/common"
import { AssertEqual } from "zod/v4/core/util"
import { objectKeys } from "simplytyped"

type ChainArtifact<
   Contract extends (...args: any[]) => any,
   ElementName extends string,
> = {
   [Name in ElementName]: Contract
}

type ChainContractMap<
   Contract extends (...args: any[]) => any,
   ElementNames extends string,
> = {
   [Name in ElementNames]?: Contract
}

type ResponsibilityChain<
   Contract extends (...args: any[]) => any,
   ElementNames extends string,
> = (...args: Parameters<Contract>) => {
   [Name in ElementNames]: ReturnType<Contract>
}

// type PartialNameOrder<Names extends string = string> =
//    AssertEqual<Names, never> extends false
//       ? _PartialNameOrder<Names, ElementNames> | []
//       : []
// type _PartialNameOrder<
//    ElementNames extends string,
//    Rest extends string,
// > = ElementNames extends ElementNames
//    ? AssertEqual<Exclude<Rest, ElementNames>, never> extends true
//       ? [Names]
//       :
//            | [Names]
//            | [
//                 ElementNames,
//                 ..._PartialNameOrder<
//                    Exclude<Rest, ElementNames>,
//                    Exclude<Rest, ElementNames>
//                 >,
//              ]
//    : never

type TotalNameOrder<ElementNames extends string> =
   AssertEqual<ElementNames, never> extends false
      ? _TotalNameOrder<ElementNames, ElementNames>
      : []
type _TotalNameOrder<
   ElementNames extends string,
   Rest extends string,
> = ElementNames extends ElementNames
   ? AssertEqual<Exclude<Rest, ElementNames>, never> extends true
      ? [ElementNames]
      : [
           ElementNames,
           ..._TotalNameOrder<
              Exclude<Rest, ElementNames>,
              Exclude<Rest, ElementNames>
           >,
        ]
   : never

// type MaxNames =
//    | 0
//    | 1
//    | 2
//    | 3
//    | 4
//    | 5
//    | 6
//    | 7
//    | 8
//    | 9
//    | 10
//    | 11
//    | 12
//    | 13
//    | 14
//    | 15
//    | 16
// type NameCount<Names extends string> =
//    AssertEqual<Names, never> extends false ? _NameCount<Names, ElementNames, 0> : 0
// type PlusOne<Count extends MaxNames> = [
//    1,
//    2,
//    3,
//    4,
//    5,
//    6,
//    7,
//    8,
//    9,
//    10,
//    11,
//    12,
//    13,
//    14,
//    15,
//    16,
//    never,
// ][Count]
// type _NameCount<
//    ElementNames extends string,
//    Rest extends string,
//    Count extends MaxNames,
// > = ElementNames extends ElementNames
//    ? AssertEqual<Exclude<Rest, ElementNames>, never> extends true
//       ? PlusOne<Count>
//       : _NameCount<Exclude<Rest, ElementNames>, Exclude<Rest, ElementNames>, PlusOne<Count>>
//    : never

@Injectable()
export class ChainOfResponsibility<
   Contract extends (...args: any[]) => any,
   ElementNames extends string,
> implements OnModuleInit
{
   private readonly promise: Promise<
      ResponsibilityChain<Contract, ElementNames>
   >

   private readonly elements: ChainContractMap<Contract, ElementNames> = {}

   private resolve:
      | undefined
      | ((artifact: ResponsibilityChain<Contract, ElementNames>) => void)

   private postModuleInit: boolean = false

   constructor(private readonly order: TotalNameOrder<ElementNames>) {
      let resolveFn:
         | undefined
         | ((artifact: ResponsibilityChain<Contract, ElementNames>) => void)
      this.promise = new Promise(
         (
            resolve: (
               artifact: ResponsibilityChain<Contract, ElementNames>,
            ) => void,
            _reject: (error: any) => void,
         ): void => {
            resolveFn = resolve
         },
      )
      this.resolve = resolveFn
   }

   static extendDynamicModule<
      Contract extends (...args: any[]) => any,
      ElementNames extends string,
   >(
      module: DynamicModule,
      order: TotalNameOrder<ElementNames>,
      asProviderToken: symbol | string,
      asSupplierToken: symbol | string,
   ): DynamicModule {
      const supplierProvider = {
         provide: asSupplierToken,
         useFactory: (): ChainOfResponsibility<Contract, ElementNames> => {
            return new ChainOfResponsibility<Contract, ElementNames>(order)
         },
      }
      return {
         ...module,
         providers: [
            ...(module.providers ?? []),
            supplierProvider,
            {
               provide: asProviderToken,
               useExisting: asSupplierToken,
            },
         ],
         exports: [...(module.exports ?? []), supplierProvider],
      }
   }

   async provide(): Promise<ResponsibilityChain<Contract, ElementNames>> {
      if (!this.postModuleInit) {
         throw new Error(
            "Chains of Responsibility are only available during application bootstrap, after module initialization.",
         )
      }
      if (this.resolve != null) {
         this.finalizeChain()
      }
      return await this.promise
   }

   private finalizeChain(): void {
      if (this.resolve == null) {
         throw new Error("A chain of responsibility may only be finalized once")
      }
      if (this.order.length !== objectKeys(this.elements).length) {
         throw new Error("Not all required elements are present")
      }
      const order: ElementNames[] = this.order as ElementNames[]
      const chainFn: ResponsibilityChain<Contract, ElementNames> = (
         ...args: Parameters<Contract>
      ): {
         [Name in ElementNames]: ReturnType<Contract>
      } => {
         return Object.fromEntries(
            order.map(
               (name: ElementNames): [ElementNames, ReturnType<Contract>] => {
                  if (this.elements[name] == null) {
                     throw new Error(
                        "Impossible condition due to prior length check",
                     )
                  }
                  return [name, this.elements[name](...args)]
               },
            ),
         ) as {
            [Name in ElementNames]: ReturnType<Contract>
         }
      }
      this.resolve(chainFn)
      this.resolve = undefined
   }

   satisfy<Name extends ElementNames>(
      name: Name,
      artifact: ChainArtifact<Contract, Name>,
   ): object {
      if (this.resolve == null) {
         throw new Error(
            "This chain of responsibility has already been finalized",
         )
      }
      if (name in this.elements) {
         throw new Error(
            `${name} is already satisfied for this chain of responsibility`,
         )
      }
      this.elements[name] = artifact[name]
      return {}
   }

   onModuleInit(): void {
      this.postModuleInit = true
   }
}
