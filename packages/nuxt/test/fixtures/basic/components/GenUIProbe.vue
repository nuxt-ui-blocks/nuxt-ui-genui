<script setup lang="ts">
import type { Library } from '@openuidev/vue-lang'

// Registration probe: this template resolves <NuxtGenUI> purely through the
// fixture app's nuxt component registry (module addComponent), not through a
// relative SFC import. If the module registration path broke, this renders an
// unresolved <nuxt-genui> element and the pipeline output would be missing.
defineProps<{ library: Library; response: string; isStreaming?: boolean }>()
</script>
<template>
  <NuxtGenUI :library="library" :response="response" :is-streaming="isStreaming" />
</template>
