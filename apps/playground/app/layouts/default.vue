<script setup lang="ts">
const sidebarOpen = ref(false)
const searchOpen = ref(false)

const OPERATIONS = [
  { label: 'Launch readiness', icon: 'i-lucide-rocket', to: '/?q=launch+readiness+review' },
  { label: 'Incident INC-2041', icon: 'i-lucide-siren', to: '/?q=incident+INC-2041+api+latency' },
  { label: 'Vendor comparison', icon: 'i-lucide-bar-chart-3', to: '/?q=vendor+comparison+observability' },
  { label: 'Q4 KPI review', icon: 'i-lucide-chart-line', to: '/?q=q4+kpi+review' },
  { label: 'Deploy plan v2.14.0', icon: 'i-lucide-rocket', to: '/?q=deploy+plan+v2.14.0' },
  { label: 'Production approval', icon: 'i-lucide-shield-check', to: '/?q=production+deploy+approval' }
] as const

const items = OPERATIONS.map((op) => ({ ...op, type: 'link' as const }))
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="sidebarOpen"
      :min-size="12"
      :default-size="13"
      collapsible
      resizable
      :menu="{ inset: true }"
      class="border-r-0 py-4 dark:[--ui-bg-elevated:var(--ui-color-neutral-900)]"
    >
      <template #header="{ collapsed }">
        <NuxtLink v-if="!collapsed" to="/" class="flex items-end gap-0.5 outline-primary/25 focus-visible:outline-3 rounded-md" aria-label="Operations Center home">
          <Logo class="h-8 w-auto shrink-0" />
          <span class="flex items-baseline gap-1.5 leading-tight">
            <span class="text-xl font-bold text-highlighted">Ops Console</span>
            <span class="text-[10px] uppercase tracking-[0.2em] text-muted">GenUI</span>
          </span>
        </NuxtLink>

        <UDashboardSidebarCollapse class="ms-auto" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :items="[{ label: 'Operations', type: 'label' }, ...items]"
          :collapsed="collapsed"
          orientation="vertical"
        />
      </template>

      <template #footer="{ collapsed }">
        <div v-if="!collapsed" class="px-4 text-[10px] uppercase tracking-[0.2em] text-muted">
          Live turn · flash-lite
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch
      v-model:open="searchOpen"
      placeholder="Search operations..."
      :groups="[{
        id: 'links',
        items: OPERATIONS.map((op) => ({
          label: op.label,
          to: op.to,
          icon: op.icon
        }))
      }]"
    />

    <div class="flex-1 flex m-4 lg:ml-0 rounded-lg ring ring-default bg-default/75 shadow-sm min-w-0 overflow-hidden">
      <slot />
    </div>
  </UDashboardGroup>
</template>
