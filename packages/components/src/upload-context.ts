import { inject, provide, type InjectionKey } from 'vue'

/**
 * A file the host has accepted and stored. Contents live on the host; only this
 * metadata ref ever reaches form values (and therefore `submit_form`).
 */
export interface GenUIUploadedFile {
  id: string
  name: string
  size: number
}

/**
 * Host-supplied upload transport. `upload` should reject (or throw) with a
 * human-readable message when the server refuses the files, e.g. wrong type or
 * too large. Authorization, size limits and storage are entirely the host's.
 */
export interface GenUIUploader {
  upload(files: File[]): Promise<GenUIUploadedFile[]>
}

export const GENUI_UPLOAD_KEY: InjectionKey<GenUIUploader> = Symbol('genui-upload')

/**
 * Host-side: configure `FileUpload` fields. Call from the setup of the component
 * that renders the GenUI tree (any ancestor of the uploaded field works).
 */
export function provideGenUIUploader(uploader: GenUIUploader): void {
  provide(GENUI_UPLOAD_KEY, uploader)
}

/** Field-side: `null` when the host has not configured an upload route. */
export function useGenUIUploader(): GenUIUploader | null {
  return inject(GENUI_UPLOAD_KEY, null)
}
