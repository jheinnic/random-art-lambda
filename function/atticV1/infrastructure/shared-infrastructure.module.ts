import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoEventStore } from './event-store/mongo-event-store';
import { Event, EventSchema } from './event-store/schemas/event.schema';
import { EventSerializer } from './event-store/serializers/event.serializer';
import { EventStorePublisher } from './event-store/publisher/event-store.publisher';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Event.name, schema: EventSchema }],
      'event-store',
    ),
  ],
  providers: [EventSerializer, MongoEventStore, EventStorePublisher],
  exports: [EventStorePublisher, MongoEventStore],
})
export class SharedInfrastructureModule {}
