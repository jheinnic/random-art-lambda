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
   paintAppRoles,
   ipfs,
   staging,
   paintGenModel,
   PaintQueueRetentionEnvironment,
   PaintQueueRedisEnvironment,
   PaintAppRolesEnvironment,
   PaintQueueNamesEnvironment,
   IpfsEnvironment,
   StagingEnvironment,
   PaintGenModelEnvironment,
} from "./Loaders.js"
import Joi from "joi"

const configModule = await ConfigModule.forRoot({
   envFilePath: "./.env",
   load: [
      paintQueueNames,
      paintQueueRetention,
      paintQueueRedis,
      paintAppRoles,
      ipfs,
      staging,
      paintGenModel,
   ],
   validationSchema: Joi.object({
      RA_APP_ROLES: Joi.string(),
   }),
   expandVariables: true,
})

@Module({
   imports: [configModule],
   exports: [configModule.module],
})
export class AppConfigModule implements OnApplicationBootstrap {
   static paintQueueNames: PaintQueueNamesEnvironment | undefined
   static paintQueueRetention: PaintQueueRetentionEnvironment | undefined
   static paintQueueRedis: PaintQueueRedisEnvironment | undefined
   static paintAppRoles: PaintAppRolesEnvironment | undefined
   static ipfs: IpfsEnvironment | undefined
   static staging: StagingEnvironment | undefined
   static paintGenModel: PaintGenModelEnvironment | undefined

   constructor(
      @Inject()
      private readonly configService: ConfigService,
   ) {
      console.log("Config service is ", configService)
   }

   onApplicationBootstrap(): void {
      const logger: Logger = new Logger("AppConfigModule")
      AppConfigModule.paintQueueNames =
         this.configService.get("paintQueueNames")
      AppConfigModule.paintQueueRetention = this.configService.get(
         "paintQueueRetention",
      )
      AppConfigModule.paintQueueRedis =
         this.configService.get("paintQueueRedis")
      AppConfigModule.paintAppRoles = this.configService.get("paintAppRoles")
      AppConfigModule.ipfs = this.configService.get("ipfs")
      AppConfigModule.staging = this.configService.get("staging")
      AppConfigModule.paintGenModel = this.configService.get("paintGenModel")
      logger.log(JSON.stringify(AppConfigModule.paintQueueNames))
      logger.log(JSON.stringify(AppConfigModule.paintQueueRetention))
      logger.log(JSON.stringify(AppConfigModule.paintQueueRedis))
      logger.log(JSON.stringify(AppConfigModule.paintAppRoles))
      logger.log(JSON.stringify(AppConfigModule.ipfs))
      logger.log(JSON.stringify(AppConfigModule.staging))
      logger.log(JSON.stringify(AppConfigModule.paintGenModel))
   }

   static async forRoot(): Promise<DynamicModule> {
      const configModule = await ConfigModule.forRoot({
         envFilePath: "./.env",
         load: [
            paintQueueNames,
            paintQueueRetention,
            paintQueueRedis,
            paintAppRoles,
            ipfs,
            staging,
            paintGenModel,
         ],
         validationSchema: Joi.object({
            RA_APP_ROLES: Joi.string(),
         }),
         expandVariables: true,
      })
      return {
         module: AppConfigModule,
         imports: [configModule],
         exports: [configModule.module],
      }
   }
}
