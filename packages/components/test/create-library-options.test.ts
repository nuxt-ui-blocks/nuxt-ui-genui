import { describe, expect, it } from 'vitest'
import { z } from 'zod/v4'
import { defineGenUIComponent, generateGenUISystemPrompt, GenUILibraryError } from '@nuxt-ui-genui/core'
import { createCardDef, createNuxtUILibrary } from '../src'

const weatherCard = defineGenUIComponent({
  name: 'WeatherCard',
  props: z.object({ city: z.string(), temp: z.string() }),
  description: 'Weather card for a city.'
})

function promptOf(library: ReturnType<typeof createNuxtUILibrary>): string {
  return generateGenUISystemPrompt(library as never)
}

describe('createNuxtUILibrary options', () => {
  it('includes every built-in by default', () => {
    const prompt = promptOf(createNuxtUILibrary())
    expect(prompt).toContain('StatsCard')
    expect(prompt).toContain('DataTable')
    expect(prompt).toContain('Buttons')
  })

  it('limits the library to the requested components', () => {
    const prompt = promptOf(createNuxtUILibrary({ components: ['Card', 'TextContent'] }))
    expect(prompt).toContain('TextContent')
    expect(prompt).not.toContain('StatsCard')
  })

  it('rejects an unknown component name', () => {
    expect(() => createNuxtUILibrary({ components: ['Card', 'Nope'] })).toThrow(GenUILibraryError)
  })

  it('appends extra components and advertises them in the prompt', () => {
    const prompt = promptOf(createNuxtUILibrary({ extraComponents: [weatherCard] }))
    expect(prompt).toContain('WeatherCard')
  })

  it('adds extra Card children to Card\'s Zod union', () => {
    const base = createCardDef().props.shape.children.element.options.length
    const card = createCardDef([weatherCard])
    const options = card.props.shape.children.element.options
    expect(options).toHaveLength(base + 1)
    expect(options.at(-1)).toBe(weatherCard.ref)
  })

  it('does not mutate the shared Card definition', () => {
    const before = createCardDef().props.shape.children.element.options.length
    createCardDef([weatherCard])
    expect(createCardDef().props.shape.children.element.options.length).toBe(before)
  })
})
