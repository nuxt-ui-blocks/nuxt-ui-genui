export function hasAllProps(obj: Record<string, unknown> | null | undefined, ...keys: string[]): boolean {
  if (!obj) return false
  return keys.every((k) => obj[k] !== undefined && obj[k] !== null)
}
export function asArray<T = unknown>(v: T[] | T | null | undefined): T[] {
  if (Array.isArray(v)) return v
  if (v === null || v === undefined) return []
  return [v]
}
