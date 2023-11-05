import { it, expect } from 'vitest'
import { add } from '../src'

it('adds', () => {
  expect(add(1, 2)).toBe(3)
})
