export default {
   preset: "ts-jest/presets/default-esm",
   testEnvironment: "node",
   roots: ["<rootDir>/src"],
   testMatch: ["**/__tests__/**/*.test.ts"],
   moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
   collectCoverageFrom: [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/**/__tests__/**",
      "!src/**/__examples__/**",
   ],
   moduleNameMapper: {
      "^@app/(.*)$": "<rootDir>/src/app/$1",
      "^@painting/(.*)$": "<rootDir>/src/painting/$1",
      "^@plotting/(.*)$": "<rootDir>/src/plotting/$1",
      "^(\\.{1,2}/.*)\\.js$": "$1",
   },
   extensionsToTreatAsEsm: [".ts"],
   transform: {
      "^.+\\.ts$": [
         "ts-jest",
         {
            useESM: true,
            tsconfig: {
               module: "ESNext",
               moduleResolution: "node",
               esModuleInterop: true,
            },
         },
      ],
   },
}
