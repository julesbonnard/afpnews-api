import chai from 'chai'
import buildQuery from '../src/utils/query-builder'

const expect = chai.expect

describe('AFP News Search Parser', () => {
  describe('implicit operators', () => {
    it('should return an array if query string is empty', () => {
      const query = buildQuery('')
      expect(query).to.deep.equal([])
    })
    it('should build query with simple search terms, implicit and operator', () => {
      const query = buildQuery('cat dog')
      expect(query).to.deep.equal([{
        "and": [{
          "or": [{
            "name": "news",
            "in": ["cat"]
          }, {
            "name": "slug",
            "in": ["cat"]
          }, {
            "name": "city",
            "in": ["cat"]
          }, {
            "name": "country",
            "in": ["cat"]
          }, {
            "name": "title",
            "in": ["cat"]
          }, {
            "name": "caption",
            "in": ["cat"]
          }, {
            "name": "creator",
            "in": ["cat"]
          }, {
            "name": "headline",
            "in": ["cat"]
          }, {
            "name": "entity_person",
            "in": ["cat"]
          }, {
            "name": "entity_location",
            "in": ["cat"]
          }]
        }, {
          "or": [{
            "name": "news",
            "in": ["dog"]
          }, {
            "name": "slug",
            "in": ["dog"]
          }, {
            "name": "city",
            "in": ["dog"]
          }, {
            "name": "country",
            "in": ["dog"]
          }, {
            "name": "title",
            "in": ["dog"]
          }, {
            "name": "caption",
            "in": ["dog"]
          }, {
            "name": "creator",
            "in": ["dog"]
          }, {
            "name": "headline",
            "in": ["dog"]
          }, {
            "name": "entity_person",
            "in": ["dog"]
          }, {
            "name": "entity_location",
            "in": ["dog"]
          }]
        }]
      }])
    })
    it('should build query with multi-words search terms', () => {
      const query = buildQuery('"Firstname Lastname" multi-word')
      expect(query).to.deep.equal([{
        "and": [{
          "or": [{
            "name": "news",
            "in": ["firstname lastname"]
          }, {
            "name": "slug",
            "in": ["firstname lastname"]
          }, {
            "name": "city",
            "in": ["firstname lastname"]
          }, {
            "name": "country",
            "in": ["firstname lastname"]
          }, {
            "name": "title",
            "in": ["firstname lastname"]
          }, {
            "name": "caption",
            "in": ["firstname lastname"]
          }, {
            "name": "creator",
            "in": ["firstname lastname"]
          }, {
            "name": "headline",
            "in": ["firstname lastname"]
          }, {
            "name": "entity_person",
            "in": ["firstname lastname"]
          }, {
            "name": "entity_location",
            "in": ["firstname lastname"]
          }]
        }, {
          "or": [{
            "name": "news",
            "in": ["multi-word"]
          }, {
            "name": "slug",
            "in": ["multi-word"]
          }, {
            "name": "city",
            "in": ["multi-word"]
          }, {
            "name": "country",
            "in": ["multi-word"]
          }, {
            "name": "title",
            "in": ["multi-word"]
          }, {
            "name": "caption",
            "in": ["multi-word"]
          }, {
            "name": "creator",
            "in": ["multi-word"]
          }, {
            "name": "headline",
            "in": ["multi-word"]
          }, {
            "name": "entity_person",
            "in": ["multi-word"]
          }, {
            "name": "entity_location",
            "in": ["multi-word"]
          }]
        }]
      }])
    })
  })
  describe('implicit operators', () => {
    it('should allow field prefix', () => {
      const query = buildQuery('title:AFP')
      expect(query).to.deep.equal([{
        "name": "title",
        "in": ["afp"]
      }])
    })
  })
  describe('and or operators', () => {
    it('should build query with explicit AND operator', () => {
      const query = buildQuery('cat AND dog AND duck')
      expect(query).to.deep.equal([{
        "and": [{
          "or": [{
            "name": "news",
            "in": ["cat"]
          }, {
            "name": "slug",
            "in": ["cat"]
          }, {
            "name": "city",
            "in": ["cat"]
          }, {
            "name": "country",
            "in": ["cat"]
          }, {
            "name": "title",
            "in": ["cat"]
          }, {
            "name": "caption",
            "in": ["cat"]
          }, {
            "name": "creator",
            "in": ["cat"]
          }, {
            "name": "headline",
            "in": ["cat"]
          }, {
            "name": "entity_person",
            "in": ["cat"]
          }, {
            "name": "entity_location",
            "in": ["cat"]
          }]
        }, {
          "and": [{
            "or": [{
              "name": "news",
              "in": ["dog"]
            }, {
              "name": "slug",
              "in": ["dog"]
            }, {
              "name": "city",
              "in": ["dog"]
            }, {
              "name": "country",
              "in": ["dog"]
            }, {
              "name": "title",
              "in": ["dog"]
            }, {
              "name": "caption",
              "in": ["dog"]
            }, {
              "name": "creator",
              "in": ["dog"]
            }, {
              "name": "headline",
              "in": ["dog"]
            }, {
              "name": "entity_person",
              "in": ["dog"]
            }, {
              "name": "entity_location",
              "in": ["dog"]
            }]
          }, {
            "or": [{
              "name": "news",
              "in": ["duck"]
            }, {
              "name": "slug",
              "in": ["duck"]
            }, {
              "name": "city",
              "in": ["duck"]
            }, {
              "name": "country",
              "in": ["duck"]
            }, {
              "name": "title",
              "in": ["duck"]
            }, {
              "name": "caption",
              "in": ["duck"]
            }, {
              "name": "creator",
              "in": ["duck"]
            }, {
              "name": "headline",
              "in": ["duck"]
            }, {
              "name": "entity_person",
              "in": ["duck"]
            }, {
              "name": "entity_location",
              "in": ["duck"]
            }]
          }]
        }]
      }])
    })
    it('should build query with explicit OR operator', () => {
      const query = buildQuery('cat AND dog OR duck AND cat')
      expect(query).to.deep.equal([{
        "and": [{
          "or": [{
            "name": "news",
            "in": ["cat"]
          }, {
            "name": "slug",
            "in": ["cat"]
          }, {
            "name": "city",
            "in": ["cat"]
          }, {
            "name": "country",
            "in": ["cat"]
          }, {
            "name": "title",
            "in": ["cat"]
          }, {
            "name": "caption",
            "in": ["cat"]
          }, {
            "name": "creator",
            "in": ["cat"]
          }, {
            "name": "headline",
            "in": ["cat"]
          }, {
            "name": "entity_person",
            "in": ["cat"]
          }, {
            "name": "entity_location",
            "in": ["cat"]
          }]
        }, {
          "or": [{
            "or": [{
              "name": "news",
              "in": ["dog"]
            }, {
              "name": "slug",
              "in": ["dog"]
            }, {
              "name": "city",
              "in": ["dog"]
            }, {
              "name": "country",
              "in": ["dog"]
            }, {
              "name": "title",
              "in": ["dog"]
            }, {
              "name": "caption",
              "in": ["dog"]
            }, {
              "name": "creator",
              "in": ["dog"]
            }, {
              "name": "headline",
              "in": ["dog"]
            }, {
              "name": "entity_person",
              "in": ["dog"]
            }, {
              "name": "entity_location",
              "in": ["dog"]
            }]
          }, {
            "and": [{
              "or": [{
                "name": "news",
                "in": ["duck"]
              }, {
                "name": "slug",
                "in": ["duck"]
              }, {
                "name": "city",
                "in": ["duck"]
              }, {
                "name": "country",
                "in": ["duck"]
              }, {
                "name": "title",
                "in": ["duck"]
              }, {
                "name": "caption",
                "in": ["duck"]
              }, {
                "name": "creator",
                "in": ["duck"]
              }, {
                "name": "headline",
                "in": ["duck"]
              }, {
                "name": "entity_person",
                "in": ["duck"]
              }, {
                "name": "entity_location",
                "in": ["duck"]
              }]
            }, {
              "or": [{
                "name": "news",
                "in": ["cat"]
              }, {
                "name": "slug",
                "in": ["cat"]
              }, {
                "name": "city",
                "in": ["cat"]
              }, {
                "name": "country",
                "in": ["cat"]
              }, {
                "name": "title",
                "in": ["cat"]
              }, {
                "name": "caption",
                "in": ["cat"]
              }, {
                "name": "creator",
                "in": ["cat"]
              }, {
                "name": "headline",
                "in": ["cat"]
              }, {
                "name": "entity_person",
                "in": ["cat"]
              }, {
                "name": "entity_location",
                "in": ["cat"]
              }]
            }]
          }]
        }]
      }])
    })
    it('should build query with explicit NOT operator', () => {
      const query = buildQuery('cat NOT dog')
      expect(query).to.deep.equal([
        {
          "and": [
            {
              "or": [
                {
                  "name": "news",
                  "in": [
                    "cat"
                  ]
                },
                {
                  "name": "slug",
                  "in": [
                    "cat"
                  ]
                },
                {
                  "name": "city",
                  "in": [
                    "cat"
                  ]
                },
                {
                  "name": "country",
                  "in": [
                    "cat"
                  ]
                },
                {
                  "name": "title",
                  "in": [
                    "cat"
                  ]
                },
                {
                  "name": "caption",
                  "in": [
                    "cat"
                  ]
                },
                {
                  "name": "creator",
                  "in": [
                    "cat"
                  ]
                },
                {
                  "name": "headline",
                  "in": [
                    "cat"
                  ]
                },
                {
                  "name": "entity_person",
                  "in": [
                    "cat"
                  ]
                },
                {
                  "name": "entity_location",
                  "in": [
                    "cat"
                  ]
                }
              ]
            },
            {
              "and": [
                {
                  "name": "news",
                  "exclude": [
                    "dog"
                  ]
                },
                {
                  "name": "slug",
                  "exclude": [
                    "dog"
                  ]
                },
                {
                  "name": "city",
                  "exclude": [
                    "dog"
                  ]
                },
                {
                  "name": "country",
                  "exclude": [
                    "dog"
                  ]
                },
                {
                  "name": "title",
                  "exclude": [
                    "dog"
                  ]
                },
                {
                  "name": "caption",
                  "exclude": [
                    "dog"
                  ]
                },
                {
                  "name": "creator",
                  "exclude": [
                    "dog"
                  ]
                },
                {
                  "name": "headline",
                  "exclude": [
                    "dog"
                  ]
                },
                {
                  "name": "entity_person",
                  "exclude": [
                    "dog"
                  ]
                },
                {
                  "name": "entity_location",
                  "exclude": [
                    "dog"
                  ]
                }
              ]
            }
          ]
        }
      ])
    })
    it('should build query with explicit parenthesis', () => {
      const query = buildQuery('cat AND (dog OR duck) AND cat')
      expect(query).to.deep.equal([{
        "and": [{
          "or": [{
            "name": "news",
            "in": ["cat"]
          }, {
            "name": "slug",
            "in": ["cat"]
          }, {
            "name": "city",
            "in": ["cat"]
          }, {
            "name": "country",
            "in": ["cat"]
          }, {
            "name": "title",
            "in": ["cat"]
          }, {
            "name": "caption",
            "in": ["cat"]
          }, {
            "name": "creator",
            "in": ["cat"]
          }, {
            "name": "headline",
            "in": ["cat"]
          }, {
            "name": "entity_person",
            "in": ["cat"]
          }, {
            "name": "entity_location",
            "in": ["cat"]
          }]
        }, {
          "and": [{
            "or": [{
              "or": [{
                "name": "news",
                "in": ["dog"]
              }, {
                "name": "slug",
                "in": ["dog"]
              }, {
                "name": "city",
                "in": ["dog"]
              }, {
                "name": "country",
                "in": ["dog"]
              }, {
                "name": "title",
                "in": ["dog"]
              }, {
                "name": "caption",
                "in": ["dog"]
              }, {
                "name": "creator",
                "in": ["dog"]
              }, {
                "name": "headline",
                "in": ["dog"]
              }, {
                "name": "entity_person",
                "in": ["dog"]
              }, {
                "name": "entity_location",
                "in": ["dog"]
              }]
            }, {
              "or": [{
                "name": "news",
                "in": ["duck"]
              }, {
                "name": "slug",
                "in": ["duck"]
              }, {
                "name": "city",
                "in": ["duck"]
              }, {
                "name": "country",
                "in": ["duck"]
              }, {
                "name": "title",
                "in": ["duck"]
              }, {
                "name": "caption",
                "in": ["duck"]
              }, {
                "name": "creator",
                "in": ["duck"]
              }, {
                "name": "headline",
                "in": ["duck"]
              }, {
                "name": "entity_person",
                "in": ["duck"]
              }, {
                "name": "entity_location",
                "in": ["duck"]
              }]
            }]
          }, {
            "or": [{
              "name": "news",
              "in": ["cat"]
            }, {
              "name": "slug",
              "in": ["cat"]
            }, {
              "name": "city",
              "in": ["cat"]
            }, {
              "name": "country",
              "in": ["cat"]
            }, {
              "name": "title",
              "in": ["cat"]
            }, {
              "name": "caption",
              "in": ["cat"]
            }, {
              "name": "creator",
              "in": ["cat"]
            }, {
              "name": "headline",
              "in": ["cat"]
            }, {
              "name": "entity_person",
              "in": ["cat"]
            }, {
              "name": "entity_location",
              "in": ["cat"]
            }]
          }]
        }]
      }])
    })
  })
  describe('exclude contains', () => {
    it('should allows to exclude some words', () => {
      const query = buildQuery('cat -dog title:-duck')
      expect(query).to.deep.equal([{
        "and": [{
          "or": [{
            "name": "news",
            "in": ["cat"]
          }, {
            "name": "slug",
            "in": ["cat"]
          }, {
            "name": "city",
            "in": ["cat"]
          }, {
            "name": "country",
            "in": ["cat"]
          }, {
            "name": "title",
            "in": ["cat"]
          }, {
            "name": "caption",
            "in": ["cat"]
          }, {
            "name": "creator",
            "in": ["cat"]
          }, {
            "name": "headline",
            "in": ["cat"]
          }, {
            "name": "entity_person",
            "in": ["cat"]
          }, {
            "name": "entity_location",
            "in": ["cat"]
          }]
        }, {
          "and": [{
            "and": [{
              "name": "news",
              "exclude": ["dog"]
            }, {
              "name": "slug",
              "exclude": ["dog"]
            }, {
              "name": "city",
              "exclude": ["dog"]
            }, {
              "name": "country",
              "exclude": ["dog"]
            }, {
              "name": "title",
              "exclude": ["dog"]
            }, {
              "name": "caption",
              "exclude": ["dog"]
            }, {
              "name": "creator",
              "exclude": ["dog"]
            }, {
              "name": "headline",
              "exclude": ["dog"]
            }, {
              "name": "entity_person",
              "exclude": ["dog"]
            }, {
              "name": "entity_location",
              "exclude": ["dog"]
            }]
          }, {
            "name": "title",
            "exclude": ["duck"]
          }]
        }]
      }])
    })
  })
})