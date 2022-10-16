export class FsBlockstoreConfiguration {
  constructor (
    public readonly rootPath: string,
    public readonly cacheSize: number
  ) {}
}
