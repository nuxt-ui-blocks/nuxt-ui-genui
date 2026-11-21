import { describe, it, expect } from 'vitest'
import { ALL_DEFS } from '../src/index'
import { FormChildUnion, FORM_FIELD_NAMES } from '../src/unions'

const FORM_NAMES = ['Form', 'Input', 'Textarea', 'InputNumber', 'Select', 'Checkbox', 'RadioGroup', 'Switch', 'Slider', 'InputRating', 'SelectMenu', 'PinInput', 'InputTags', 'ColorPicker', 'InputDate', 'InputTime', 'FileUpload', 'CheckboxGroup', 'InputMenu'] as const
const nameOf = (d: unknown) => (d as { name: string }).name
const propsOf = (d: unknown) => (d as { props: { shape: Record<string, unknown> } }).props.shape

describe('forms defs', () => {
  it('registers the Form and field components in ALL_DEFS', () => {
    const names = ALL_DEFS.map(nameOf)
    for (const n of FORM_NAMES) expect(names).toContain(n)
  })

  it('Form prop order is wire format: formId, title, submitLabel, children', () => {
    const form = ALL_DEFS.find((d) => nameOf(d) === 'Form') as never
    expect(Object.keys(propsOf(form))).toEqual(['formId', 'title', 'submitLabel', 'children'])
  })

  it('every field def has required `name` as the FIRST prop key', () => {
    for (const n of FORM_NAMES.slice(1)) {
      const def = ALL_DEFS.find((d) => nameOf(d) === n) as never
      expect(Object.keys(propsOf(def))[0], n).toBe('name')
    }
  })

  it('Select and RadioGroup require an options array of strings', () => {
    for (const n of ['Select', 'RadioGroup'] as const) {
      const def = ALL_DEFS.find((d) => nameOf(d) === n) as never as { props: { shape: { options: { element: { type: string } } } } }
      expect(def.props.shape.options.element.type).toBe('string')
    }
  })

  it('FORM_FIELD_NAMES mirrors the field defs (order frozen)', () => {
    expect(FORM_FIELD_NAMES).toEqual(['Input', 'Textarea', 'InputNumber', 'Select', 'Checkbox', 'CheckboxGroup', 'RadioGroup', 'Switch', 'Slider', 'InputRating', 'SelectMenu', 'PinInput', 'InputTags', 'ColorPicker', 'InputDate', 'InputTime', 'FileUpload', 'InputMenu'])
  })

  it('FormChildUnion is exactly the field refs', () => {
    const refs = (FORM_FIELD_NAMES as readonly string[]).map(
      (n) => (ALL_DEFS.find((d) => nameOf(d) === n) as never as { ref: unknown }).ref
    )
    expect((FormChildUnion as never as { options: { ref?: unknown }[] }).options.map((o) => o)).toEqual(refs)
    expect((FormChildUnion as never as { options: unknown[] }).options).toHaveLength(18)
  })
})

