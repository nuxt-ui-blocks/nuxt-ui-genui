import { SalesDashboardSchema } from 'nuxt-ui-genui-core'

/**
 * Deterministic demo transport. Replace this handler with a model adapter.
 * It intentionally imports serializable schemas only, never Vue components.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ prompt?: string }>(event)
  const prompt = body?.prompt?.trim()

  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'A prompt is required.' })
  }

  const dashboard = SalesDashboardSchema.parse({
    title: 'Sales overview',
    description: `Generated demo response for: ${prompt}`,
    metrics: [
      { label: 'Total revenue', value: '$24,500', change: '+12.5% vs last month', trend: 'up' },
      { label: 'Orders', value: '1,240', change: '+8.2% vs last month', trend: 'up' },
      { label: 'Conversion rate', value: '3.82%', change: '+0.4% vs last month', trend: 'up' },
      { label: 'Average order', value: '$19.76', change: '-1.2% vs last month', trend: 'down' }
    ],
    orders: [
      { id: '#1024', customer: 'Olivia Rhye', total: '$240.00', status: 'Completed' },
      { id: '#1025', customer: 'Phoenix Baker', total: '$125.00', status: 'Pending' },
      { id: '#1026', customer: 'Lana Steiner', total: '$380.00', status: 'Completed' },
      { id: '#1027', customer: 'Demi Wilkinson', total: '$89.00', status: 'Cancelled' }
    ]
  })

  // OpenUI Lang positional arguments follow the Zod object property order.
  const ui = [
    'root = SalesDashboard(',
    JSON.stringify(dashboard.title),
    ', ',
    JSON.stringify(dashboard.description ?? ''),
    ', ',
    JSON.stringify(dashboard.metrics),
    ', ',
    JSON.stringify(dashboard.orders),
    ')'
  ].join('')

  return { ui, meta: { mode: 'demo', validated: true } }
})
