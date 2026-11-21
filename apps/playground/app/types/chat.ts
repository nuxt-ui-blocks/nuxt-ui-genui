export interface FileWithStatus {
  file: File
  id: string
  previewUrl: string
  /**
   * The file as a `data:` URL. A provider cannot read a `blob:` URL, so the
   * bytes travel inline with the request. Empty when the file is too large to
   * inline or could not be read.
   */
  dataUrl: string
  status: 'uploading' | 'uploaded' | 'error'
  uploadedUrl?: string
  uploadedPathname?: string
  error?: string
}
