<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AvatarProps } from '@nuxt/ui'

const props = withDefaults(defineProps<{
  name: string
  type: string
  previewUrl?: string
  size?: AvatarProps['size']
  status?: 'idle' | 'uploading' | 'uploaded' | 'error'
  error?: string
  removable?: boolean
}>(), {
  size: '2xl',
  status: 'idle',
  removable: false
})

const emit = defineEmits<{ remove: [] }>()

const zoomOpen = ref(false)
const isImage = computed(() => props.type.startsWith('image/') && !!props.previewUrl)

function getFileIcon(type: string, name: string) {
  if (type.startsWith('image/')) return 'i-lucide-image'
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'i-lucide-file-text'
  if (type.startsWith('text/')) return 'i-lucide-file-code'
  return 'i-lucide-file'
}
</script>

<template>
  <div class="group relative">
    <UTooltip :text="name">
      <UAvatar
        :size="size"
        :src="isImage ? previewUrl : undefined"
        :icon="getFileIcon(type, name)"
        class="rounded-lg"
        :class="[
          isImage && 'cursor-zoom-in',
          status === 'uploading' && 'opacity-60',
          status === 'error' && 'opacity-60'
        ]"
        :ui="{ image: 'object-cover' }"
        @click="isImage && (zoomOpen = true)"
      />

      <div
        v-if="status === 'uploading'"
        class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/50"
      >
        <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-white" />
      </div>

      <div
        v-else-if="status === 'error'"
        class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-error/50"
      >
        <UIcon name="i-lucide-alert-circle" class="size-5 text-white" />
      </div>
    </UTooltip>

    <UButton
      v-if="removable"
      icon="i-lucide-x"
      size="xs"
      color="neutral"
      variant="solid"
      class="absolute -top-1 -right-1 opacity-0 transition-opacity group-hover:opacity-100"
      :aria-label="`Remove ${name}`"
      @click="emit('remove')"
    />

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0"
      >
        <div
          v-if="zoomOpen && isImage"
          class="fixed inset-0 z-50 flex items-center justify-center bg-default/75 p-8 backdrop-blur-sm"
          @click="zoomOpen = false"
        >
          <img :src="previewUrl" :alt="name" class="max-h-full max-w-full rounded-lg shadow-xl">
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
