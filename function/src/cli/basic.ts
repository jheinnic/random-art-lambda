import { NestFactory } from "@nestjs/core"
// import { sha256 as hash } from "multiformats/hashes/sha2"
// import { CID } from "multiformats"
import { PlotCommand } from "./main/components/PlotCommand.js"
import { CliAppModule } from "./app/Module.js"

async function bootstrap(): Promise<void> {
   try {
      console.log("Loading")
      const app = await NestFactory.createApplicationContext(CliAppModule, {
         abortOnError: false,
         logger: ["error", "warn", "log", "verbose", "debug"],
      })

   const appSvc = app.get(PlotCommand)
   console.log(appSvc)

   //  appSvc.testRun()

   // This has not been tried
   // const regionMap = appSvc.testRepo( CID.parse( "zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJtn9V1v" ) )

   // This exists, but does not follow the model
   // const regionMap = appSvc.testRepo( CID.parse( "zdpuB381N99CGFwmnVCXfubQANt8ZnSW3sk3Hy8YEYyB1fRGP" ) )

   // These do not exist
   // const regionMap = appSvc.testRepo( CID.parse( "zdj7WVuzaY8f6J53yJpjM8H1hFq9QRZKBWKukdGZFMiScp8AM" ) )
   // const regionMap = appSvc.testRepo( CID.parse( "QmeXewWTbGUnvAPQ5VUcJ2uF3PX1uWbZg1Yjk9EJzQqzXF" ) )

   // This is current
   // const regionMap = appSvc.testRepo( CID.parse( "bafyreicqvrftolzvv3jhmqptkezch7f7dlfomu6mmv3cihqmerg274x3ky" ) )
   // console.log( regionMap )

   // appSvc.testRepoSave()
   } catch {
      console.error("Exception thrown?")
   }
}

bootstrap().catch((x) => console.error(x))
// tn / 9V / 1v / zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJ
