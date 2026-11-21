import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { readMultipartFormData } from 'h3'

const UPLOAD_DIR = () => path.join(process.cwd(), '.data', 'uploads')
const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_FILES = 4
/** Multipart envelope + the biggest allowed file. */
const MAX_REQUEST_BYTES = 4 * 1024 * 1024

// Extension is derived from the validated MIME type, never from the client filename.
const ALLOWED: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt'
}

const safeName = (raw: string | undefined) => {
  if (!raw) return 'file'
  const base = path.basename(raw).replace(/[^\w.\- ]/g, '_').slice(0, 120)
  return base || 'file'
}

export default defineEventHandler(async (event) => {
  // First line of defence: `readMultipartFormData` buffers the whole body, so
  // reject an oversized request before it is read. (A client can lie about the
  // header, so the per-file check below still applies.)
  const declared = Number(event.node.req.headers['content-length'] ?? 0)
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
    setResponseStatus(event, 413)
    return { ok: false, error: `request exceeds ${MAX_REQUEST_BYTES / 1024 / 1024}MB` }
  }

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'multipart/form-data with at least one file is required' }
  }
  const files = parts.filter((p) => p.filename && p.data)
  if (!files.length) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'no file parts found (expected a multipart field named "file")' }
  }
  if (files.length > MAX_FILES) {
    setResponseStatus(event, 413)
    return { ok: false, error: `too many files (max ${MAX_FILES})` }
  }

  for (const file of files) {
    const mime = file.type ?? ''
    if (!ALLOWED[mime]) {
      setResponseStatus(event, 415)
      return { ok: false, error: `file type not allowed: ${mime || 'unknown'}` }
    }
    if (file.data.length > MAX_FILE_BYTES) {
      setResponseStatus(event, 413)
      return { ok: false, error: `file exceeds ${MAX_FILE_BYTES / 1024 / 1024}MB` }
    }
  }

  await fs.mkdir(UPLOAD_DIR(), { recursive: true })
  const refs = []
  for (const file of files) {
    const mime = file.type as string
    const id = randomUUID()
    const ext = ALLOWED[mime]!
    const name = safeName(file.filename)
    await fs.writeFile(path.join(UPLOAD_DIR(), id + ext), file.data)
    refs.push({ id, name, size: file.data.length })
  }
  return { ok: true, files: refs }
})
