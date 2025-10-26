import { Inject, Injectable } from "@nestjs/common"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "../../kinds/Constants.js"
import { BuiltInSeedModuleTypes } from "../di/Types.js"
import { IExtensionRegistrar } from "../../../extensions/interface/IExtensionRegistrar.js"
import {
   HEX_SEED_EXTENSION_ID_STR,
   PHRASE_SEED_EXTENSION_ID_STR,
} from "../kinds/Constants.js"
import { HexSeedExtension } from "./HexSeedExtension.js"
import { PhraseSeedExtension } from "./PhraseSeedExtension.js"

@Injectable()
export class ModuleActivator {
   constructor(
      @Inject(BuiltInSeedModuleTypes.GenModelSeedExtensionRegistry)
      extensionRegistry: IExtensionRegistrar<GEN_MODEL_SEED_EXTENSION_POINT>,
   ) {
      extensionRegistry.registerExtension(
         HEX_SEED_EXTENSION_ID_STR,
         HexSeedExtension,
         [],
      )
      extensionRegistry.registerExtension(
         PHRASE_SEED_EXTENSION_ID_STR,
         PhraseSeedExtension,
         [],
      )
   }
}
