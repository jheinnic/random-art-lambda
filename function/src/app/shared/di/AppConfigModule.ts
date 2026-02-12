import {
   DynamicModule,
   Inject,
   Logger,
   Module,
   OnApplicationBootstrap,
} from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import {
   paintQueueNames,
   paintQueueRetention,
   paintQueueRedis,
   painterChannel,
   paintAppRoles,
   PaintQueueRetentionEnvironment,
   PaintQueueRedisEnvironment,
   PaintAppRolesEnvironment,
   PaintQueueNamesEnvironment,
   PainterChannelEnvironment,
} from "./Loaders.js"
import Joi from "joi"

@Module({})
export class AppConfigModule implements OnApplicationBootstrap {
   static paintQueueNames: PaintQueueNamesEnvironment | undefined
   static paintQueueRetention: PaintQueueRetentionEnvironment | undefined
   static paintQueueRedis: PaintQueueRedisEnvironment | undefined
   static painterChannel: PainterChannelEnvironment | undefined
   static paintAppRoles: PaintAppRolesEnvironment | undefined

   constructor(
      @Inject()
      private readonly configService: ConfigService,
   ) {
      console.log("Config service is ", configService)
   }

   onApplicationBootstrap(): void {
      const logger: Logger = new Logger("AppConfigModule")
      logger.log("I am in module init!")
      AppConfigModule.paintQueueNames =
         this.configService.get("paintQueueNames")
      AppConfigModule.paintQueueRetention = this.configService.get(
         "paintQueueRetention",
      )
      AppConfigModule.paintQueueRedis =
         this.configService.get("paintQueueRedis")
      AppConfigModule.painterChannel = this.configService.get("painterChannel")
      AppConfigModule.paintAppRoles = this.configService.get("paintAppRoles")
      logger.log(JSON.stringify(AppConfigModule.paintQueueNames))
      logger.log(JSON.stringify(AppConfigModule.paintQueueRetention))
      logger.log(JSON.stringify(AppConfigModule.paintQueueRedis))
      logger.log(JSON.stringify(AppConfigModule.paintAppRoles))
      logger.log(JSON.stringify(AppConfigModule.painterChannel))
   }

   static async forRoot(): Promise<DynamicModule> {
      const configModule = await ConfigModule.forRoot({
         envFilePath: "./.env",
         load: [
            paintQueueNames,
            paintQueueRetention,
            paintQueueRedis,
            painterChannel,
            paintAppRoles,
         ],
         validationSchema: Joi.object({
            RA_APP_ROLES: Joi.string(), // ("mainApp", "workerNode"),
         }),
         expandVariables: true,
         // processEnv: fibble,
         // parsed: { USER: process.env.USER ?? "nobody" },
         // },
      })
      return {
         module: AppConfigModule,
         imports: [configModule],
         exports: [configModule.module],
      }
   }
}
