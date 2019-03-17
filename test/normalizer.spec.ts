import { normalize } from '../src/utils/normalizer'

describe('AFP News Normalizer', () => {
  test('should lowercase value', () => {
    expect(normalize('Cat')).toBe('cat')
  })
  test('should remove accents', () => {
    expect(normalize('pépé')).toBe('pepe')
  })
  test('should trim the string', () => {
    expect(normalize(' dog')).toBe('dog')
  })
})
