import { createLibrary, defineComponent } from '@openuidev/vue-lang'
import SalesDashboard from '~/components/genui/SalesDashboard.vue'
import { componentSpecs } from 'nuxt-ui-genui-core'
import type { SalesDashboardSchema } from 'nuxt-ui-genui-core'

/**
 * The client-side OpenUI library. The server imports schemas.ts only and never
 * imports this file because it contains a Vue SFC dependency. Component metadata
 * (name/description/props) comes from `nuxt-ui-genui-core` so the client and
 * server can never drift apart; only the SFC attachment is client-side.
 */
const spec = componentSpecs[0]!

const SalesDashboardComponent = defineComponent({
  name: spec.name,
  description: spec.description,
  props: spec.props as typeof SalesDashboardSchema,
  component: SalesDashboard
})

export const genuiLibrary = createLibrary({
  components: [SalesDashboardComponent],
  root: 'SalesDashboard'
})
