import { Chan } from "medium"

export interface ChannelWrapper<T> {
   unwrap: () => Chan<T>
}
