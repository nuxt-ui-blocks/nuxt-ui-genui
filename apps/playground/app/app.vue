<script setup lang="ts">
import { provideGenUIUploader } from '@nuxt-ui-genui/components/upload'

useHead({
  htmlAttrs: { lang: 'en' },
  meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }]
})
useSeoMeta({
  title: 'Nuxt GenUI — Operations Center',
  description: 'Generative UI framework for Nuxt UI with OpenUI Lang: an AI-powered operations console for launches, incidents, vendors, KPIs, deploys, and approvals.'
})

// The library never talks to a server on its own: the host decides where files go.
// Here the Ops Console points GenUI FileUpload fields at its own Nitro route.
provideGenUIUploader({
  async upload(files: File[]) {
    const body = new FormData()
    for (const file of files) body.append('file', file, file.name)
    const res = await $fetch<{ ok: boolean; files?: { id: string; name: string; size: number }[]; error?: string }>('/api/operations/upload', {
      method: 'POST',
      body
    })
    if (!res.ok) throw new Error(res.error ?? 'Upload rejected')
    return res.files ?? []
  }
})
</script>

<template>
  <UApp :toaster="{ position: 'top-right' }" :tooltip="{ delayDuration: 200 }">
    <NuxtLoadingIndicator color="var(--ui-primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
