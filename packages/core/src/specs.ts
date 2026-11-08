import type { z } from 'zod/v4'
import { SalesDashboardSchema } from './schemas'

export interface ComponentSpec {
  name: string
  description: string
  props: z.ZodTypeAny
}

export const componentSpecs: ComponentSpec[] = [
  {
    name: 'SalesDashboard',
    description: 'A compact sales dashboard with KPI metrics and a recent-orders table.',
    props: SalesDashboardSchema
  }
]
