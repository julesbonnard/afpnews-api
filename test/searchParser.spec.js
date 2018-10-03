import chai from 'chai'
import { buildQuery } from '../src/queryBuilder'

const expect = chai.expect

describe('AFP News Search Parser', () => {
  describe('implicit operators', () => {
    it('should return an array if query string is empty', () => {
      const query = buildQuery('')
      expect(query).to.deep.equal([])
    })
    it('should build query with simple search terms, implicit and operator', () => {
      const query = buildQuery('cat dog')
      expect(query).to.deep.equal([
        {
          name: 'news',
          in: ['cat']
        },
        {
          name: 'news',
          in: ['dog']
        }
      ])
    })
    it('should build query with multi-words search terms', () => {
      const query = buildQuery('"Firstname Lastname" multi-word')
      expect(query).to.deep.equal([
        {
          name: 'news',
          in: ['Firstname Lastname']
        },
        {
          name: 'news',
          in: ['multi-word']
        }
      ])
    })
  })
  describe('implicit operators', () => {
    it('should allow field prefix', () => {
      const query = buildQuery('title:AFP')
      expect(query).to.deep.equal([
        {
          name: 'title',
          in: [
            'AFP'
          ]
        }
      ])
    })
  })
  describe('and or operators', () => {
    it('should build query with explicit AND operator', () => {
      const query = buildQuery('cat AND dog AND duck')
      expect(query).to.deep.equal([{
        and: [
          {
            name: 'news',
            in: ['cat']
          },
          {
            and: [
              {
                name: 'news',
                in: ['dog']
              },
              {
                name: 'news',
                in: ['duck']
              }
            ]
          }
        ]
      }])
    })
    it('should build query with explicit OR operator', () => {
      const query = buildQuery('cat AND dog OR duck AND cat')
      expect(query).to.deep.equal([
        {
          and: [
            {
              name: "news",
              in: [
                "cat"
              ]
            },
            {
              or: [
                {
                  name: "news",
                  in: [
                    "dog"
                  ]
                },
                {
                  and: [
                    {
                      name: "news",
                      in: [
                        "duck"
                      ]
                    },
                    {
                      name: "news",
                      in: [
                        "cat"
                      ]
                    }
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
      expect(query).to.deep.equal([
        {
          and: [
            {
              name: "news",
              in: [
                "cat"
              ]
            },
            {
              and: [
                {
                  or: [
                    {
                      name: "news",
                      in: [
                        "dog"
                      ]
                    },
                    {
                      name: "news",
                      in: [
                        "duck"
                      ]
                    }
                  ]
                },
                {
                  name: "news",
                  in: [
                    "cat"
                  ]
                }
              ]
            }
          ]
        }
      ])
    })
  })
  describe('exclude contains', () => {
    it('should allows to exclude some words', () => {
      const query = buildQuery('cat -dog title:-duck')
      expect(query).to.deep.equal([
        {
          name: 'news',
          in: ['cat']
        },
        {
          name: 'news',
          exclude: ['dog']
        },
        {
          name: 'title',
          exclude: ['duck']
        }
      ])
    })
  })
})
