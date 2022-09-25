import IMessage from "../../common/interface/Message"
import { PaintTaskHeaders } from "./PaintTaskHeaders";
import { PaintTaskPayload } from "./PaintTaskPayload";

export type PaintTaskMessage = IMessage<PaintTaskPayload, PaintTaskHeaders>;