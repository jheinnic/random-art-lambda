/**
 * Expression Visibility Types
 *
 * Controls whether a filename expression field is present, required, or absent
 * at a given configuration level. Used with generic type parameters to shape
 * interface fields at compile time.
 *
 * Three visibility states:
 * - 'hidden': Field is absent from the interface
 * - 'mandatory': Field must be provided
 * - 'optional': Field may be provided
 */

/**
 * Visibility state for an expression configuration field.
 *
 * When used as a generic type parameter, controls the presence and
 * optionality of expression fields in configuration interfaces.
 */
export type ExpressionVisibility = "hidden" | "mandatory" | "optional"

/**
 * Conditional type that shapes a field value based on visibility.
 *
 * - 'mandatory' → T (required)
 * - 'optional' → T | undefined
 * - 'hidden' → never (field cannot exist)
 *
 * @example
 * ```typescript
 * interface Config<V extends ExpressionVisibility> {
 *   expression: VisibleField<V, string>
 * }
 * // Config<'mandatory'> → { expression: string }
 * // Config<'optional'> → { expression: string | undefined }
 * // Config<'hidden'> → { expression: never }
 * ```
 */
export type VisibleField<
   V extends ExpressionVisibility,
   T,
> = V extends "mandatory" ? T : V extends "optional" ? T | undefined : never

/**
 * Conditional property presence on an interface based on visibility.
 *
 * - 'hidden' → empty object (property absent)
 * - 'mandatory' → { [Key]: T } (required property)
 * - 'optional' → { [Key]?: T } (optional property)
 *
 * Use with intersection types to compose interfaces:
 * @example
 * ```typescript
 * interface MySpec<V extends ExpressionVisibility>
 *   extends VisibleProps<V, 'fileNameExpression', string> {
 *   // other fields
 * }
 * ```
 */
export type VisibleProps<
   V extends ExpressionVisibility,
   Key extends string,
   T,
> = V extends "hidden"
   ? object
   : V extends "mandatory"
     ? { readonly [K in Key]: T }
     : { readonly [K in Key]?: T }
