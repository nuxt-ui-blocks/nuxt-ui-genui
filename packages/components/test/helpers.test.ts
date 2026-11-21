import { describe, it, expect } from 'vitest'
import { hasAllProps, asArray } from '../src/helpers'
describe('helpers', () => {
  it('hasAllProps requires every key present', () => {
    expect(hasAllProps({ a: 1, b: 'x' }, 'a', 'b')).toBe(true)
    expect(hasAllProps({ a: 1 }, 'a', 'b')).toBe(false)
    expect(hasAllProps(null, 'a')).toBe(false)
  })
  it('asArray normalizes', () => {
    expect(asArray(1)).toEqual([1])
    expect(asArray([1, 2])).toEqual([1, 2])
    expect(asArray(undefined)).toEqual([])
  })
})
