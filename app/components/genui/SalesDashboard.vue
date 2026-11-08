<script setup lang="ts">
import type { RenderNodeResult } from '@openuidev/vue-lang'
import type { SalesDashboardProps } from '#shared/genui/schemas'

const props = defineProps<{ props: SalesDashboardProps; renderNode: (value: unknown) => RenderNodeResult }>()

const statusColor = (status: string) => {
  if (status === 'Completed') return 'success' as const
  if (status === 'Pending') return 'warning' as const
  return 'error' as const
}
</script>

<template>
  <section class="space-y-4 rounded-xl border border-default bg-default p-4 sm:p-5">
    <header class="space-y-1">
      <h2 class="text-lg font-semibold">{{ props.title }}</h2>
      <p v-if="props.description" class="text-sm text-muted">{{ props.description }}</p>
    </header>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <UCard v-for="metric in props.metrics || []" :key="metric.label" :ui="{ body: 'p-4 sm:p-4' }">
        <p class="text-sm text-muted">{{ metric.label }}</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight">{{ metric.value }}</p>
        <p v-if="metric.change" class="mt-1 text-xs" :class="metric.trend === 'down' ? 'text-error' : metric.trend === 'up' ? 'text-success' : 'text-muted'">
          {{ metric.change }}
        </p>
      </UCard>
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div class="flex items-center justify-between border-b border-default px-4 py-3">
        <h3 class="font-medium">Recent orders</h3>
        <UBadge color="neutral" variant="subtle">{{ props.orders?.length || 0 }} orders</UBadge>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-muted">
            <tr class="border-b border-default">
              <th class="px-4 py-3 font-medium">Order</th>
              <th class="px-4 py-3 font-medium">Customer</th>
              <th class="px-4 py-3 font-medium">Total</th>
              <th class="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in props.orders || []" :key="order.id" class="border-b border-default last:border-0">
              <td class="whitespace-nowrap px-4 py-3 font-medium">{{ order.id }}</td>
              <td class="whitespace-nowrap px-4 py-3">{{ order.customer }}</td>
              <td class="whitespace-nowrap px-4 py-3">{{ order.total }}</td>
              <td class="whitespace-nowrap px-4 py-3">
                <UBadge :color="statusColor(order.status)" variant="subtle">{{ order.status }}</UBadge>
              </td>
            </tr>
            <tr v-if="!props.orders?.length">
              <td colspan="4" class="px-4 py-8 text-center text-muted">No orders to display.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </section>
</template>
