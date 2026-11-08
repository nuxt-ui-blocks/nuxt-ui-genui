import { z } from 'zod/v4'

/** Serializable schemas shared by client and server. Keep Vue imports out of this file. */
export const MetricSchema = z.object({
  label: z.string().describe('Short metric label.'),
  value: z.string().describe('Formatted metric value, for example $24,500.'),
  change: z.string().optional().describe('Optional period-over-period change.'),
  trend: z.enum(['up', 'down', 'neutral']).optional().describe('Direction of the change.')
})

export const OrderSchema = z.object({
  id: z.string().describe('Order identifier.'),
  customer: z.string().describe('Customer name.'),
  total: z.string().describe('Formatted order total.'),
  status: z.enum(['Completed', 'Pending', 'Cancelled']).describe('Current order status.')
})

export const SalesDashboardSchema = z.object({
  title: z.string().describe('Dashboard heading.'),
  description: z.string().optional().describe('One-line dashboard context.'),
  metrics: z.array(MetricSchema).max(4).describe('Up to four key performance metrics.'),
  orders: z.array(OrderSchema).max(8).describe('Recent orders, maximum eight.')
})

export type SalesDashboardProps = z.infer<typeof SalesDashboardSchema>
