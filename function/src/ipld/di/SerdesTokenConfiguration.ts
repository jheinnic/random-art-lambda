export class SerdesTokenConfiguration {
  constructor (
    public readonly rootProductionTokens: Readonly<Record<string, symbol | string>>
  ) { }
}
