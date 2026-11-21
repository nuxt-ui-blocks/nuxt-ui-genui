import { describe, expect, it } from 'vitest'
import { activeSlots, MESSAGE_SLOTS } from '../src/slots'

describe('chat-ui slot forwarding', () => {
  it('declares only the message slots the host supplied', () => {
    expect(activeSlots(MESSAGE_SLOTS, { content: () => null, actions: () => null }))
      .toEqual(['content', 'actions'])
  })

  it('preserves the documented order', () => {
    expect(activeSlots(MESSAGE_SLOTS, Object.fromEntries(MESSAGE_SLOTS.map(n => [n, () => null]))))
      .toEqual([...MESSAGE_SLOTS])
  })

  it('declares no slots when the host supplies none', () => {
    expect(activeSlots(MESSAGE_SLOTS, {})).toEqual([])
  })
})
