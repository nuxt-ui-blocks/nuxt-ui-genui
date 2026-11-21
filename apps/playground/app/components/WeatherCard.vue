<script setup lang="ts">
import UCard from '@nuxt/ui/components/Card.vue'
const props = defineProps<{ props: { city?: string; temp?: string; condition?: string } }>()
</script>
<template>
  <UCard v-if="props.props">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-wide text-muted">{{ props.props.city }}</p>
        <p class="text-xl font-bold">{{ props.props.temp }}</p>
      </div>
      <span class="text-sm">{{ props.props.condition }}</span>
    </div>
  </UCard>
</template>
