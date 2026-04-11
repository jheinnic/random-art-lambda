export const QueuedPaintingTypes = {
   FlowProducer: Symbol("RandomArtFlowProducer"),
   FlowProducerConfig: Symbol("FlowProducerConfig"),
   PaintWorker: Symbol("RandomArtPaintWorker"),
   StagingWorker: Symbol("RandomArtStagingWorker"),
   ProjectGatheringWorker: Symbol("RandomArtProjectGatheringWorker"),

   PaintListener: Symbol("RandomArtPaintQueueListener"),
   StoreWorker: Symbol("RandomArtStoreWorker"),
   StoreListener: Symbol("RandomArtStoreEventListener"),

   InjectedPaintEngine: Symbol("InjectedPaintEngine"),
   InjectedRegionMapRepo: Symbol("InjectedRegionMapRepo"),
   InjectedImageStager: Symbol("InjectedImageStager"),
   InjectedFileStore: Symbol("InjectedFileStore"),
   InjectedRandomArtTaskCallChannel: Symbol(
      "ChannelWrapper<RandomArtTaskCall>",
   ),
   InjectedRandomArtTaskReplyChannel: Symbol(
      "ChannelWrapper<RandomArtTaskReply>",
   ),
   ReplyQueueRoutingProcessor: Symbol("ReplyQueueRoutingProcessor"),
}
