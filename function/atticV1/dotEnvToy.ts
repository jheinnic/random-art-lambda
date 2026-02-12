console.log(process.env.USER ?? "xyz")
console.log(process.env.HOSTNAME ?? "hostname")
console.log(process.env.PATH ?? "path")

const processEnv = {};
const dotenv = await import('dotenv')
const result = dotenv.config({processEnv: processEnv })
console.log(processEnv);
console.log(result);
const error2 = new Error("error2")
const processEnv2 = {}
const result2 = dotenv.expand({processEnv: processEnv2, error: error2, parse: {
	RANDOM_ART_MODE: "fibble",
	TWO: "${RANDOM_ART_MODE}"
}})
console.log(processEnv2)
console.log(error2)
console.log(result2)
