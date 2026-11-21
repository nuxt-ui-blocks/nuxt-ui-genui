<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GenUIMessage } from '@nuxt-ui-genui/chat'

const props = defineProps<{
  message: GenUIMessage
  text: string
}>()

const emit = defineEmits<{
  save: [message: GenUIMessage, text: string]
  cancel: []
}>()

const editingText = ref(props.text)
const canSave = computed(() => editingText.value.trim().length > 0 && editingText.value !== props.text)
</script>

<template>
  <div class="flex flex-col gap-2">
    <UTextarea
      v-model="editingText"
      autofocus
      autoresize
      :rows="1"
      size="xl"
      variant="none"
      :ui="{ base: 'p-0' }"
      class="w-full"
    />

    <div class="flex justify-end gap-2">
      <UButton
        label="Cancel"
        color="neutral"
        variant="soft"
        size="sm"
        @click="emit('cancel')"
      />
      <UButton
        label="Save"
        color="primary"
        variant="solid"
        size="sm"
        :disabled="!canSave"
        @click="emit('save', message, editingText.trim())"
      />
    </div>
  </div>
</template>
