import { Type } from "@nestjs/common"

export interface BlockingChannelRequest {
   component: "BlockingChannel"
   concurrency?: number
}

export interface OldBlockingChannelRequest {
   component: "OldBlockingChannel"
   call: Type
   reply: Type
   concurrency: number
}

export interface SlidingChannelRequest {
   component: "SlidingChannel"
   concurrency: number
}

export interface OldSlidingChannelRequest {
   component: "OldSlidingChannel"
   call: Type
   reply: Type
   concurrency: number
}

export interface DroppingChannelRequest {
   component: "DroppingChannel"
   concurrency: number
}

export interface OldDroppingChannelRequest {
   component: "OldDroppingChannel"
   call: Type
   reply: Type
   concurrency: number
}

export type ProviderRequest =
   | BlockingChannelRequest
   | DroppingChannelRequest
   | SlidingChannelRequest
