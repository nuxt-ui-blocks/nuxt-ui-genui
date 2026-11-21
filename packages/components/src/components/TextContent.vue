<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '../markdown'

const props = defineProps<{ props: { text?: string } }>()
const html = computed(() => renderMarkdown(props.props?.text ?? ''))
</script>

<template><div v-html="html" /></template>
