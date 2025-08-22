import { MessageForAck } from './message-for-ack.interface';
import { MessageForReply } from './message-for-reply.interface';

export type MessageWithCallback<P extends any[], R extends any[] = []> =
   [] extends R ? MessageForAck<P> : MessageForReply<P, R>;
