import { CommandFactory } from "nest-commander"
import { CliAppModule } from "./app/Module.js"

async function bootstrap(): Promise<void> {
   // or, if you only want to print Nest's warnings and errors
   await CommandFactory.run(CliAppModule, ["warn", "error"])
}

try {
   await bootstrap()
} catch {
   console.log("Top command error logged")
}
