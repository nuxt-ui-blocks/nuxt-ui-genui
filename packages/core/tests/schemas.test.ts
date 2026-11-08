import { describe, expect, it } from 'vitest'
import { SalesDashboardSchema } from '../src/schemas'

const valid = {
  title: 'Revenue overview',
  description: 'Monthly snapshot',
  metrics: [{ label: 'Revenue', value: '$24,500', change: '+12.5%', trend: 'up' }],
  orders: [{ id: '#1024', customer: 'Ada Lovelace', total: '$240.00', status: 'Completed' }]
}

describe('SalesDashboardSchema', () => {
  it('round-trips a valid dashboard', () => {
    const parsed = SalesDashboardSchema.parse(valid)
    expect(parsed.title).toBe(valid.title)
    expect(parsed.metrics[0]?.trend).toBe('up')
    expect(parsed.orders[0]?.status).toBe('Completed')
  })

  it('keeps the wire-format property order (OpenUI Lang positional args)', () => {
    expect(Object.keys(SalesDashboardSchema.shape)).toEqual([
      'title',
      'description',
      'metrics',
      'orders'
    ])
  })

  it('rejects an unknown trend enum', () => {
    const bad = structuredClone(valid) as typeof valid
    bad.metrics[0]!.trend = 'sideways' as never
    expect(() => SalesDashboardSchema.parse(bad)).toThrow()
  })
})
