import { ISchemaSerdes } from './ISchemaSerdes.js'
import { ModelEnvelope } from './ModelEnvelope.js'
// import { RandomArtworkSpec } from './RandomArtworkSpec.js'

export type IRandomArtworkSchemaSerdes = ISchemaSerdes<{ repoVersion: string, model: [] }, ModelEnvelope>