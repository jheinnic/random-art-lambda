import { CommandFactory } from "nest-commander"
import { CliAppModule } from "../di/CliAppModule.js"

async function bootstrap(): Promise<void> {
   // or, if you only want to print Nest's warnings and errors
   const retval = await CommandFactory.run(CliAppModule, [
      "warn",
      "error",
      "log",
      "debug",
      "verbose",
      "fatal",
   ])
   console.log(retval)
}

try {
   await bootstrap()
} catch {
   console.log("Top command error logged")
}
