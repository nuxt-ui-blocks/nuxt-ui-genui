export type GenUILibraryErrorCode =
  | 'NOT_V4_SCHEMA'
  | 'DUPLICATE_COMPONENT'
  | 'RESERVED_NAME'
  | 'INVALID_ROOT'
  | 'UNKNOWN_COMPONENT'

export class GenUILibraryError extends Error {
  constructor(readonly code: GenUILibraryErrorCode, message: string) { super(message); this.name = 'GenUILibraryError' }
}
