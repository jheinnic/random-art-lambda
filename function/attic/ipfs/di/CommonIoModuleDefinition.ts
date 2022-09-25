import { ConfigurableModuleBuilder } from "@nestjs/common"
import { Cache } from "-cache"
import { LruCacheConfiguration } from "../interfaces/LruCacheConfigurationZ"

function buildLru () {
  const cache = new Cache()
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<LruCacheConfiguration>()
    .setExtras(
      {
        lruSize: 8
      },
      (module, extras) => {
        return {
          ...module,
          providers: [
            ...module.providers,
            { provide: "abc", use_value: 123 + extras.lruSize }
          ]
        }
      }
    )
    .build()
