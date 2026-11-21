<script setup lang="ts">
import UUser from '@nuxt/ui/components/User.vue'
import { computed } from 'vue'

const props = defineProps<{ props: { name?: string; description?: string; avatar?: { src?: string; alt?: string; text?: string } } }>()
const p = computed(() => props.props ?? {})
</script>

<template>
  <UUser v-if="p?.name" :name="p?.name" :description="p?.description" :avatar="p?.avatar" />
</template>
