import { computed, ref } from 'vue'
import type { FileWithStatus } from '~/types/chat'

const ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf,text/plain'
const MAX_FILES = 4
/** Files above this size are not inlined into the chat request. */
const MAX_INLINE_BYTES = 1024 * 1024

/** Read a file as a `data:` URL (a provider cannot fetch a `blob:` URL). */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads straight to our own `/api/operations/upload` route (no blob store, no auth).
 * The same composable shape as the reference template so the prompt UI is unchanged.
 */
export function useFileUploadWithStatus() {
  const files = ref<FileWithStatus[]>([])
  const uploading = ref(false)

  const uploadedFiles = computed(() => files.value.filter(entry => entry.status === 'uploaded'))

  async function upload(entry: FileWithStatus) {
    const body = new FormData()
    body.append('file', entry.file)

    try {
      const res = await $fetch<{ ok: boolean; files?: { id: string; name: string; size: number }[] }>('/api/operations/upload', {
        method: 'POST',
        body
      })
      const stored = res.files?.[0]
      entry.status = 'uploaded'
      entry.uploadedPathname = stored?.id
    } catch (error) {
      entry.status = 'error'
      entry.error = error instanceof Error ? error.message : 'Upload failed'
    }
  }

  async function addFiles(incoming: File[]) {
    const room = MAX_FILES - files.value.length
    if (room <= 0) return

    const entries = incoming.slice(0, room).map<FileWithStatus>((file) => ({
      file,
      id: crypto.randomUUID(),
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      dataUrl: '',
      status: 'uploading'
    }))

    files.value.push(...entries)
    uploading.value = true
    try {
      await Promise.all(entries.map(async (entry) => {
        // The bytes travel with the chat request, so read them before the
        // upload: a `blob:` URL is meaningless to the model.
        if (entry.file.size <= MAX_INLINE_BYTES) {
          try {
            entry.dataUrl = await readAsDataUrl(entry.file)
          } catch {
            /* an unreadable file is simply not attached to the message */
          }
        }
        await upload(entry)
      }))
    } finally {
      uploading.value = false
    }
  }

  function removeFile(id: string) {
    const index = files.value.findIndex(entry => entry.id === id)
    if (index === -1) return
    const [removed] = files.value.splice(index, 1)
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
  }

  function clearFiles() {
    for (const entry of files.value) {
      if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl)
    }
    files.value = []
  }

  const { dropzoneRef, isDragging, open } = useFileUpload({
    accept: ACCEPT,
    multiple: true,
    onUpdate: addFiles
  })

  return {
    dropzoneRef,
    dragging: isDragging,
    open,
    files,
    uploading,
    uploadedFiles,
    addFiles,
    removeFile,
    clearFiles
  }
}
