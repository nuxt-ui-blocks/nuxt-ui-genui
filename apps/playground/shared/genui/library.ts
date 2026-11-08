import { createLibrary, defineComponent } from '@openuidev/vue-lang'
import SalesDashboard from '~/components/genui/SalesDashboard.vue'
import { SalesDashboardSchema } from './schemas'

/**
 * The client-side OpenUI library. The server imports schemas.ts only and never
 * imports this file because it contains a Vue SFC dependency.
 */
const SalesDashboardComponent = defineComponent({
  name: 'SalesDashboard',
  description: 'A compact sales dashboard with KPI metrics and a recent-orders table.',
  props: SalesDashboardSchema,
  component: SalesDashboard
})

export const genuiLibrary = createLibrary({
  components: [SalesDashboardComponent],
  root: 'SalesDashboard'
})
