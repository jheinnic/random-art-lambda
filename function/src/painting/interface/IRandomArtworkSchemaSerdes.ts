import { ISchemaSerdes } from '../../ipfs/interface/ISchemaSerdes.js'
import { ModelEnvelope } from './ModelEnvelope.js'

export type IRandomArtworkSchemaSerdes = ISchemaSerdes<{ repoVersion: string, model: [] }, ModelEnvelope>