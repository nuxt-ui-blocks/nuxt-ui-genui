import { computed, ref, watch } from 'vue'
import { useFetch } from '#imports'

export interface GenUIModel {
  label: string
  value: string
  icon: string
}

/**
 * The ops console runs one real backend: the local OpenAI-compatible gateway
 * when `GENAI_API_KEY` is set, or the deterministic mock when it is explicitly
 * requested with `GENAI_MOCK=1`. The selector shows what is actually answering —
 * it never offers a model the server cannot run.
 */
export function useModels() {
  const { data: provider } = useFetch<{ live: boolean; mock: boolean; model?: string }>('/api/provider', {
    key: 'genui-provider',
    default: () => ({ live: false, mock: false })
  })

  const models = computed<GenUIModel[]>(() => {
    if (provider.value?.live && provider.value.model) {
      return [{ label: provider.value.model, value: provider.value.model, icon: 'i-lucide-cpu' }]
    }
    if (provider.value?.mock) {
      return [{ label: 'deterministic mock', value: 'mock', icon: 'i-lucide-flask-conical' }]
    }
    return [{ label: 'model not configured', value: 'none', icon: 'i-lucide-plug-zap' }]
  })

  const model = ref(models.value[0]?.value ?? 'none')

  watch(models, (list) => {
    if (!list.some(entry => entry.value === model.value)) {
      model.value = list[0]?.value ?? 'none'
    }
  })

  return { models, model }
}
