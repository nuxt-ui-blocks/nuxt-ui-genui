<script setup lang="ts">
import { computed } from 'vue'

const { model, models } = useModels()

const activeIcon = computed(() => models.value.find(entry => entry.value === model.value)?.icon)
</script>

<template>
  <USelectMenu
    v-model="model"
    :items="models"
    size="sm"
    :icon="activeIcon"
    color="neutral"
    variant="ghost"
    value-key="value"
    class="data-[state=open]:bg-elevated"
    :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
  />
</template>
