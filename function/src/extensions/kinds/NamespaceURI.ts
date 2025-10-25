export type NamespaceURI<
   ExtensionPoint extends string,
   Name extends string,
> = `${ExtensionPoint}/${Name}`

// In your registry
export type PluginNamespace = string & { __brand: "PluginNamespace" }
