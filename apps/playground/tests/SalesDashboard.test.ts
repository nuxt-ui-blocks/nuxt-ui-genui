import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SalesDashboard from '../app/components/genui/SalesDashboard.vue'

const props = {
  title: 'Revenue overview',
  description: 'Monthly snapshot',
  metrics: [
    { label: 'Revenue', value: '$24,500', change: '+12.5%', trend: 'up' },
    { label: 'Orders', value: '1,240', change: '+4.1%', trend: 'up' },
    { label: 'Avg. order', value: '$58', change: '-2.0%', trend: 'down' },
    { label: 'Refunds', value: '12', change: '0%', trend: 'neutral' }
  ],
  orders: [
    { id: '#1024', customer: 'Ada Lovelace', total: '$240.00', status: 'Completed' },
    { id: '#1023', customer: 'Grace Hopper', total: '$132.50', status: 'Pending' },
    { id: '#1022', customer: 'Alan Turing', total: '$98.00', status: 'Cancelled' },
    { id: '#1021', customer: 'Edsger Dijkstra', total: '$410.25', status: 'Completed' }
  ]
} as const

const stubs = {
  UCard: { props: ['ui'], template: '<div><slot /></div>' },
  UBadge: { props: ['color', 'variant'], template: '<span><slot /></span>' }
}

describe('SalesDashboard', () => {
  it('renders the title and all orders', () => {
    const wrapper = mount(SalesDashboard, {
      props: { props, renderNode: () => null as never },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('Revenue overview')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.findAll('tbody tr').length).toBe(4)
  })
})
