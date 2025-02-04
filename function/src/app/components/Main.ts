import { NestFactory } from "@nestjs/core"
import { sha256 as hash } from "multiformats/hashes/sha2"

import { CID } from "multiformats"
import { AppModule } from "../di/index.js"
import { AppServiceTwo } from "./AppServiceTwo.js"

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext( AppModule )
  const appSvc = app.get( AppServiceTwo )
  console.log( appSvc )

  appSvc.testRun()

  // const regionMap = appSvc.testRepo( CID.parse( "zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJtn9V1v" ) )
  // const regionMap = appSvc.testRepo( CID.parse( "zdpuB381N99CGFwmnVCXfubQANt8ZnSW3sk3Hy8YEYyB1fRGP" ) )
  // const regionMap = appSvc.testRepo( CID.parse( "zdj7WVuzaY8f6J53yJpjM8H1hFq9QRZKBWKukdGZFMiScp8AM" ) )
  // const regionMap = appSvc.testRepo( CID.parse( "QmeXewWTbGUnvAPQ5VUcJ2uF3PX1uWbZg1Yjk9EJzQqzXF" ) )
  // console.log( regionMap )
}

bootstrap().catch( ( x ) => console.error( x ) )
// tn / 9V / 1v / zdpuAsQEbAYrfbrgcR7EgDarTSGePziWyX3m8jL4gmJ