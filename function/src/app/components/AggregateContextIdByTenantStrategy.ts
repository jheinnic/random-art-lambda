import {
   HostComponentInfo,
   ContextId,
   ContextIdFactory,
   ContextIdStrategy,
} from "@nestjs/core"
import { Request } from "express"

const tenants = new Map<string, ContextId>()

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
   attach(
      contextId: ContextId,
      request: Request,
   ): (info: HostComponentInfo) => ContextId {
      const tenantId = request.headers["x-tenant-id"] as string
      let tenantSubTreeId: ContextId

      if (tenants.has(tenantId)) {
         const subTreeId = tenants.get(tenantId)
         if (subTreeId === undefined) {
            throw new Error(`${tenantId} is defined but has no ContextId`)
         }
         tenantSubTreeId = subTreeId
      } else {
         tenantSubTreeId = ContextIdFactory.create()
         tenants.set(tenantId, tenantSubTreeId)
      }

      // If tree is not durable, return the original "contextId" object
      return (info: HostComponentInfo) =>
         info.isTreeDurable ? tenantSubTreeId : contextId
   }
}
