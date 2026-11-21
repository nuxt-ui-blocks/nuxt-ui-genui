<script setup lang="ts">
import type { FileWithStatus } from '~/types/chat'

defineProps<{
  files: FileWithStatus[]
}>()

const emit = defineEmits<{ remove: [id: string] }>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <ChatFilePreview
      v-for="file in files"
      :key="file.id"
      :name="file.file.name"
      :type="file.file.type"
      :preview-url="file.previewUrl"
      :status="file.status"
      :error="file.error"
      removable
      @remove="emit('remove', file.id)"
    />
  </div>
</template>
