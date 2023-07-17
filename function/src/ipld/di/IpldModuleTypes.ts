export const SCHEMA_PARSER: unique symbol = Symbol( "SchemaParser" )
export const SERDES_FACTORY: unique symbol = Symbol( "SerdesFactory" )
export const SCHEMA_DSL_CONFIG: unique symbol = Symbol( "SchemaDslConfiguration" )

export const IpldModuleTypes = {
  SchemaParser: SCHEMA_PARSER,
  SerdesFactory: SERDES_FACTORY,
  SchemaDslConfig: SCHEMA_DSL_CONFIG
}

export const REGISTER_METHOD_KEY = "register"
export const FACTORY_METHOD_KEY = "create"
