/**
 * Error thrown when a required field is missing in middleware context.
 *
 * This is typically a SEMANTIC_ERROR disposition.
 */
export class MissingRequiredFieldError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'MissingRequiredFieldError'
        Error.captureStackTrace(this, MissingRequiredFieldError)
    }
}
