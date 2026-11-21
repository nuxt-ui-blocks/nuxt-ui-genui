import { inject, provide, type InjectionKey } from 'vue'

/**
 * Runtime allowlists for containers whose Zod union the installed renderer
 * (vue-lang 0.4.x) does not enforce. The renderer provides a map keyed by
 * component name; containers filter their element children against it.
 */
export type GenUIContainerChildren = Readonly<Record<string, readonly string[]>>

const KEY: InjectionKey<GenUIContainerChildren> = Symbol('genui-container-children')

export function provideGenUIContainerChildren(map: GenUIContainerChildren): void {
  provide(KEY, map)
}

export function useGenUIContainerChildren(name: string, fallback: readonly string[]): readonly string[] {
  const map = inject(KEY, null)
  return map?.[name] ?? fallback
}
