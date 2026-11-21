<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import UFormField from '@nuxt/ui/components/FormField.vue'
import { computed, ref, watch } from 'vue'
import { hasAllProps } from '../helpers'
import { useGenUIField } from '../form-context'
import { useGenUIUploader, type GenUIUploadedFile } from '../upload-context'

const props = defineProps<{ props: { name?: string; label?: string; accept?: string; maxFiles?: number; buttonLabel?: string; rules?: import('../rules').Rules } }>()
// Reactive on purpose: containers are patched in place while the program streams.
const p = computed(() => props.props ?? {})
const { fieldValue, inForm, update } = useGenUIField(() => p.value)
const uploader = useGenUIUploader()
const uploading = ref(false)
const error = ref('')
// UFileUpload owns the hidden input, drag/drop and accept validation. It only
// hands us raw File[] through v-model; the host uploader turns those into refs.
const rawFiles = ref<File[]>([])
const refs = computed<GenUIUploadedFile[]>(() => {
  const raw = fieldValue.value
  return Array.isArray(raw) ? (raw as GenUIUploadedFile[]) : []
})
const disabled = computed(() => !inForm.value || !uploader || uploading.value)
watch(rawFiles, async (files) => {
  if (!files?.length || !uploader) return
  const selected = files.slice(0, p.value.maxFiles ?? 4)
  rawFiles.value = []
  error.value = ''
  uploading.value = true
  try {
    const uploaded = await uploader.upload(selected)
    update([...refs.value, ...uploaded])
  } catch (e) {
    error.value = e instanceof Error && e.message ? e.message : 'Upload failed'
  } finally {
    uploading.value = false
  }
})
</script>

<template>
  <UFormField v-if="hasAllProps(p, 'name')" :name="p?.name" :required="p?.rules?.required === true" class="space-y-1" eager-validation>
    <span v-if="p?.label" class="text-sm font-medium">{{ p.label }}</span>
    <UFileUpload v-model="rawFiles" :name="p?.name" :accept="p?.accept" multiple :disabled="disabled" :preview="false">
      <template #default="{ open }">
        <UButton
          :label="uploading ? 'Uploading...' : (p?.buttonLabel ?? 'Attach file')"
          icon="i-lucide-upload"
          color="neutral"
          variant="outline"
          :disabled="disabled"
          @click="open()"
        />
      </template>
    </UFileUpload>
    <span class="text-xs text-muted">{{ uploader ? 'type/size validated by the host' : 'Uploads are disabled: the host has not provided an uploader' }}</span>
    <ul v-if="refs.length" class="space-y-1">
      <li v-for="ref in refs" :key="ref.id" class="flex items-center justify-between rounded-md border border-default px-3 py-1.5 text-xs">
        <span class="truncate">{{ ref.name }}</span>
        <span class="shrink-0 text-muted">{{ Math.max(1, Math.round(ref.size / 1024)) }} KB</span>
      </li>
    </ul>
    <p v-if="error" class="text-xs text-error">{{ error }}</p>
    <p v-if="!inForm" class="text-xs text-muted">Not in a form - this value is never submitted.</p>
  </UFormField>
</template>
