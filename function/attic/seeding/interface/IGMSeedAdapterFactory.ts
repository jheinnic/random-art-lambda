import { IAdapterFactory } from "../../../extensions/interface/IAdapterFactory.js"
import {
   GEN_MODEL_SEED_ADAPTER_ID,
   GEN_MODEL_SEED_EXTENSION_POINT,
} from "../kinds/Constants.js"

export interface IGMSeedAdapterFactory
   extends IAdapterFactory<
      GEN_MODEL_SEED_EXTENSION_POINT,
      GEN_MODEL_SEED_ADAPTER_ID
   > {}
