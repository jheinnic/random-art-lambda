export const QueuedPaintingTypes = {
   FlowProducer: Symbol("RandomArtFlowProducer"),
   PaintWorker: Symbol("RandomArtPaintWorker"),
   PaintListener: Symbol("RandomArtQueueListener"),
   StoreWorker: Symbol("RandomArtStoreWorker"),
   StoreListener: Symbol("RandomArtStoreEventListener"),
   InjectedPaintEngine: Symbol("InjectedPaintEngine"),
   InjectedRegionMapRepo: Symbol("InjectedRegionMapRepo"),
   InjectedRandomArtTaskCallChannel: Symbol(
      "ChannelWrapper<RandomArtTaskCall>",
   ),
   InjectedRandomArtTaskReplyChannel: Symbol(
      "ChannelWrapper<RandomArtTaskReply>",
   ),
}
