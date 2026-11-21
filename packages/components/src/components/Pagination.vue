<script setup lang="ts">
import UPagination from '@nuxt/ui/components/Pagination.vue'
import { computed, ref } from 'vue'

const props = defineProps<{ props: { total?: number; itemsPerPage?: number; siblingCount?: number } }>()
const p = computed(() => props.props ?? {})
const page = ref(1)
</script>

<template>
  <UPagination v-model:page="page" :total="p?.total ?? 100" :items-per-page="p?.itemsPerPage ?? 10" :sibling-count="p?.siblingCount ?? 1" />
</template>
