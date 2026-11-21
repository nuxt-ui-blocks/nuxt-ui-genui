<script setup lang="ts">
defineProps<{
  show?: boolean
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-default/75 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-3 rounded-xl ring ring-default bg-elevated px-8 py-6 shadow-lg">
          <UIcon name="i-lucide-paperclip" class="size-6 text-primary" />
          <p class="text-sm font-medium text-highlighted">
            Drop files to attach them
          </p>
          <p class="text-xs text-muted">
            Images, PDF or plain text · up to 4 files, 2MB each
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
