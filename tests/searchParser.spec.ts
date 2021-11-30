import buildQuery from '../src/utils/query-builder'
describe('AFP News Search Parser', () => {
  describe('implicit operators', () => {
    test('should return an array if query string is empty', () => {
      expect(buildQuery('')).toEqual([])
    })
    test(
      'should build query with simple search terms, implicit and operator',
      () => {
        const query = buildQuery('cat -dog')
        expect(query).toEqual([{
          'and': [{
            'or': [{
              'name': 'all',
              'in': ['cat'],
              'fullText': true
            }]
          }, {
            'and': [{
              'name': 'all',
              'exclude': ['dog'],
              'fullText': true
            }]
          }]
        }])
      }
    )
    test('should build query with multi-words search terms', () => {
      const query = buildQuery('"Firstname Lastname" multi-word')
      expect(query).toEqual([{
        'and': [{
          'or': [{
            'name': 'all',
            'in': ['firstname lastname'],
            'fullText': true
          }]
        }, {
          'or': [{
            'name': 'all',
            'in': ['multi-word'],
            'fullText': true
          }]
        }]
      }])
    })
  })
  describe('implicit operators', () => {
    test('should allow field prefix', () => {
      const query = buildQuery('title:AFP')
      expect(query).toEqual([{
        'name': 'title',
        'in': ['afp'],
        'fullText': true
      }])
    })
  })
  describe('and or operators', () => {
    test('should build query with explicit AND operator', () => {
      const answer = [{
        'and': [
          { 'name': 'animal', 'in': ['cat'], 'fullText': true },
          { 'name': 'animal', 'in': ['dog'], 'fullText': true }
        ]
      }]
      expect(buildQuery('animal:cat AND animal:dog')).toEqual(answer)
      expect(buildQuery('animal:cat && animal:dog')).toEqual(answer)
    })
    test('should build query with explicit OR operator', () => {
      const answer = [{
        'or': [
          { 'name': 'animal', 'in': ['cat'], 'fullText': true },
          { 'name': 'animal', 'in': ['duck'], 'fullText': true }
        ]
      }]
      expect(buildQuery('animal:cat OR animal:duck')).toEqual(answer)
      expect(buildQuery('animal:cat || animal:duck')).toEqual(answer)
    })
    test('should build query with explicit NOT operator', () => {
      const answerAnd = [{
        'and': [
          { 'name': 'animal', 'in': ['cat'], 'fullText': true },
          { 'name': 'animal', 'exclude': ['dog'], 'fullText': true }
        ]
      }]
      const answerOr = [{
        'or': [
          { 'name': 'animal', 'in': ['cat'], 'fullText': true },
          { 'name': 'animal', 'exclude': ['dog'], 'fullText': true }
        ]
      }]
      expect(buildQuery('animal:cat NOT animal:dog')).toEqual(answerAnd)
      expect(buildQuery('animal:cat AND NOT animal:dog')).toEqual(answerAnd)
      expect(buildQuery('animal:cat OR NOT animal:dog')).toEqual(answerOr)
    })
    test('should build query with explicit parenthesis', () => {
      const query = buildQuery('animal:cat AND animal:(dog OR duck)')
      expect(query).toEqual([{
        'and': [
          { 'name': 'animal', 'in': ['cat'], 'fullText': true },
          {
            'or': [
              { 'name': 'animal', 'in': ['dog'], 'fullText': true },
              { 'name': 'animal', 'in': ['duck'], 'fullText': true }
            ]
          }
        ]
      }])
    })
  })
  describe('exclude contains', () => {
    test('should allows to exclude some words', () => {
      const query = buildQuery('animal:duck AND NOT animal:(cat dog)')
      expect(query).toEqual([
        {
          'and': [
            { 'name': 'animal', 'in': ['duck'], 'fullText': true },
            {
              'and': [
                { 'name': 'animal', 'exclude': ['cat'], 'fullText': true },
                { 'name': 'animal', 'exclude': ['dog'], 'fullText': true }
              ]
            }
          ]
        }
      ])
    })
  })
})
