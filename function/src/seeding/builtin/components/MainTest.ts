import {
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING,
} from "./../../interface/SeedTypeExtensionPoint"
import { AdapterFactoryFactory } from "../../../extensions/components/AdapterFactoryFactory._st"
import { GenModelSeedAdapter } from "../../components/GenModelSeedAdapter.js"
import { HEX_SEED_EXTENSION_ID } from "../interface/Constants.js"
import { IExtension } from "../../../extensions/interface/IExtension.js"
import { HexSeedExtension } from "./HexSeedExtension.js"

const af = new AdapterFactoryFactory()
af.prepare<
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
   HexSeedExtension,
   GenModelSeedAdapter<HEX_SEED_EXTENSION_ID, IHexSeed>
>(GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING, GenModelSeedAdapter)

af.prepare(GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING, GenModelSeedAdapter)
