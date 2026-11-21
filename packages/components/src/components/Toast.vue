<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { useToast } from '@nuxt/ui/composables'
import { computed } from 'vue'
import { hasAllProps } from '../helpers'

const props = defineProps<{ props: { label?: string; title?: string; description?: string; color?: 'neutral' | 'primary' | 'success' | 'warning' | 'error' } }>()
const p = computed(() => props.props ?? {})
const toast = useToast()

function notify() {
  toast.add({
    title: p.value.title ?? '',
    description: p.value.description,
    color: p.value.color
  })
}
</script>

<template>
  <UButton v-if="hasAllProps(p, 'title')" :color="p?.color ?? 'neutral'" variant="outline" @click="notify">{{ p?.label ?? 'Notify' }}</UButton>
</template>
