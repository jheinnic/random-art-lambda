import { ProviderRequest } from "./ProviderRequest.js"

export * from "./ProviderRequest.js"

export interface CoroutineModuleExtras<
   InjectTokens extends symbol | string = symbol | string,
> {
   readonly requests: Record<InjectTokens, ProviderRequest>
}
