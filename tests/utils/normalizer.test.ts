import { describe, it, expect } from 'vitest'
import { normalize } from '../../src/utils/normalizer'

describe('normalize', () => {
  it('should convert to lowercase', () => {
    expect(normalize('HELLO')).toBe('hello')
    expect(normalize('Hello World')).toBe('hello world')
  })

  it('should trim whitespace', () => {
    expect(normalize('  hello  ')).toBe('hello')
    expect(normalize('\thello\t')).toBe('hello')
  })

  it('should remove diacritics', () => {
    expect(normalize('café')).toBe('cafe')
    expect(normalize('Mélenchon')).toBe('melenchon')
    expect(normalize('über')).toBe('uber')
    expect(normalize('naïve')).toBe('naive')
    expect(normalize('résumé')).toBe('resume')
    expect(normalize('São Paulo')).toBe('sao paulo')
  })

  it('should handle combined transformations', () => {
    expect(normalize('  CAFÉ  ')).toBe('cafe')
    expect(normalize('  Éric ZEMMOUR  ')).toBe('eric zemmour')
  })

  it('should handle strings without special characters', () => {
    expect(normalize('hello')).toBe('hello')
    expect(normalize('test123')).toBe('test123')
  })

  it('should handle empty strings', () => {
    expect(normalize('')).toBe('')
  })

  it('should throw on non-string input', () => {
    expect(() => normalize(undefined)).toThrow('The query must be a string')
    expect(() => normalize(42 as unknown as string)).toThrow('The query must be a string')
    expect(() => normalize(null as unknown as string)).toThrow('The query must be a string')
  })
})
