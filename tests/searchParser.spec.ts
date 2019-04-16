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
              'name': 'news',
              'in': ['cat']
            }, {
              'name': 'slug',
              'in': ['cat']
            }, {
              'name': 'city',
              'in': ['cat']
            }, {
              'name': 'country',
              'in': ['cat']
            }, {
              'name': 'title',
              'in': ['cat']
            }, {
              'name': 'caption',
              'in': ['cat']
            }, {
              'name': 'creator',
              'in': ['cat']
            }, {
              'name': 'headline',
              'in': ['cat']
            }, {
              'name': 'entity_person',
              'in': ['cat']
            }, {
              'name': 'entity_location',
              'in': ['cat']
            }]
          }, {
            'and': [{
              'name': 'news',
              'exclude': ['dog']
            }, {
              'name': 'slug',
              'exclude': ['dog']
            }, {
              'name': 'city',
              'exclude': ['dog']
            }, {
              'name': 'country',
              'exclude': ['dog']
            }, {
              'name': 'title',
              'exclude': ['dog']
            }, {
              'name': 'caption',
              'exclude': ['dog']
            }, {
              'name': 'creator',
              'exclude': ['dog']
            }, {
              'name': 'headline',
              'exclude': ['dog']
            }, {
              'name': 'entity_person',
              'exclude': ['dog']
            }, {
              'name': 'entity_location',
              'exclude': ['dog']
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
            'name': 'news',
            'in': ['firstname lastname']
          }, {
            'name': 'slug',
            'in': ['firstname lastname']
          }, {
            'name': 'city',
            'in': ['firstname lastname']
          }, {
            'name': 'country',
            'in': ['firstname lastname']
          }, {
            'name': 'title',
            'in': ['firstname lastname']
          }, {
            'name': 'caption',
            'in': ['firstname lastname']
          }, {
            'name': 'creator',
            'in': ['firstname lastname']
          }, {
            'name': 'headline',
            'in': ['firstname lastname']
          }, {
            'name': 'entity_person',
            'in': ['firstname lastname']
          }, {
            'name': 'entity_location',
            'in': ['firstname lastname']
          }]
        }, {
          'or': [{
            'name': 'news',
            'in': ['multi-word']
          }, {
            'name': 'slug',
            'in': ['multi-word']
          }, {
            'name': 'city',
            'in': ['multi-word']
          }, {
            'name': 'country',
            'in': ['multi-word']
          }, {
            'name': 'title',
            'in': ['multi-word']
          }, {
            'name': 'caption',
            'in': ['multi-word']
          }, {
            'name': 'creator',
            'in': ['multi-word']
          }, {
            'name': 'headline',
            'in': ['multi-word']
          }, {
            'name': 'entity_person',
            'in': ['multi-word']
          }, {
            'name': 'entity_location',
            'in': ['multi-word']
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
        'in': ['afp']
      }])
    })
  })
  describe('and or operators', () => {
    test('should build query with explicit AND operator', () => {
      const answer = [{
        'and': [
          { 'name': 'animal', 'in': ['cat'] },
          { 'name': 'animal', 'in': ['dog'] }
        ]
      }]
      expect(buildQuery('animal:cat AND animal:dog')).toEqual(answer)
      expect(buildQuery('animal:cat && animal:dog')).toEqual(answer)
    })
    test('should build query with explicit OR operator', () => {
      const answer = [{
        'or': [
          { 'name': 'animal', 'in': ['cat'] },
          { 'name': 'animal', 'in': ['duck'] }
        ]
      }]
      expect(buildQuery('animal:cat OR animal:duck')).toEqual(answer)
      expect(buildQuery('animal:cat || animal:duck')).toEqual(answer)
    })
    test('should build query with explicit NOT operator', () => {
      const answerAnd = [{
        'and': [
          { 'name': 'animal', 'in': ['cat'] },
          { 'name': 'animal', 'exclude': ['dog'] }
        ]
      }]
      const answerOr = [{
        'or': [
          { 'name': 'animal', 'in': ['cat'] },
          { 'name': 'animal', 'exclude': ['dog'] }
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
          { 'name': 'animal', 'in': ['cat'] },
          {
            'or': [
              { 'name': 'animal', 'in': ['dog'] },
              { 'name': 'animal', 'in': ['duck'] }
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
            { 'name': 'animal', 'in': ['duck'] },
            {
              'and': [
                { 'name': 'animal', 'exclude': ['cat'] },
                { 'name': 'animal', 'exclude': ['dog'] }
              ]
            }
          ]
        }
      ])
    })
  })
})
