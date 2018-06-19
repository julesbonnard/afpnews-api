const chai = require('chai');
const expect = chai.expect;

const AfpNews = require('../')

describe('AFP News Search Parser', function() {
  describe('implicit operators', function() {
    it('should return an array if query string is empty', async function() {
      const afpNews = new AfpNews();
      const query = await afpNews.buildQuery('');
      expect(query).to.deep.equal([]);
    })
    it('should build query with simple search terms, implicit and operator', async function() {
      const afpNews = new AfpNews();
      const query = await afpNews.buildQuery('cat dog');
      expect(query).to.deep.equal([
        {
          name: 'news',
          in: ['cat'],
          fullText: true
        },
        {
          name: 'news',
          in: ['dog'],
          fullText: true
        }
      ]);
    });
    it('should build query with multi-words search terms', async function() {
      const afpNews = new AfpNews();
      const query = await afpNews.buildQuery('"Firstname Lastname" multi-word');
      expect(query).to.deep.equal([
        {
          name: 'news',
          in: ['Firstname Lastname'],
          fullText: true
        },
        {
          name: 'news',
          in: ['multi-word'],
          fullText: true
        }
      ]);
    });
  });
  describe('implicit operators', function() {
    it('should allow field prefix', async function() {
      const afpNews = new AfpNews();
      const query = await afpNews.buildQuery('title:AFP');
      expect(query).to.deep.equal([
        {
          name: 'title',
          in: [
            'AFP'
          ]
        }
      ]);
    })
  });
  describe('and or operators', function() {
    it('should build query with explicit AND operator', async function() {
      const afpNews = new AfpNews();
      const query = await afpNews.buildQuery('cat AND dog AND duck');
      expect(query).to.deep.equal([{
        and: [
          {
            name: 'news',
            in: ['cat'],
            fullText: true
          },
          {
            and: [
              {
                name: 'news',
                in: ['dog'],
                fullText: true
              },
              {
                name: 'news',
                in: ['duck'],
                fullText: true
              }
            ]
          }
        ]
      }]);
    });
    it('should build query with explicit OR operator', async function() {
      const afpNews = new AfpNews();
      const query = await afpNews.buildQuery('cat AND dog OR duck AND cat');
      expect(query).to.deep.equal([
        {
          and: [
            {
              name: "news",
              in: [
                "cat"
              ],
              fullText: true
            },
            {
              or: [
                {
                  name: "news",
                  in: [
                    "dog"
                  ],
                  fullText: true
                },
                {
                  and: [
                    {
                      name: "news",
                      in: [
                        "duck"
                      ],
                      fullText: true
                    },
                    {
                      name: "news",
                      in: [
                        "cat"
                      ],
                      fullText: true
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]);
    });
    it('should build query with explicit parenthesis', async function() {
      const afpNews = new AfpNews();
      const query = await afpNews.buildQuery('cat AND (dog OR duck) AND cat');
      expect(query).to.deep.equal([
        {
          and: [
            {
              name: "news",
              in: [
                "cat"
              ],
              fullText: true
            },
            {
              and: [
                {
                  or: [
                    {
                      name: "news",
                      in: [
                        "dog"
                      ],
                      fullText: true
                    },
                    {
                      name: "news",
                      in: [
                        "duck"
                      ],
                      fullText: true
                    }
                  ]
                },
                {
                  name: "news",
                  in: [
                    "cat"
                  ],
                  fullText: true
                }
              ]
            }
          ]
        }
      ]);
    });
  });
  describe('exclude contains', async function() {
    it('should allows to exclude some words', async function() {
      const afpNews = new AfpNews();
      const query = await afpNews.buildQuery('cat -dog title:-duck');
      expect(query).to.deep.equal([
        {
          name: 'news',
          in: ['cat'],
          fullText: true
        },
        {
          name: 'news',
          exclude: ['dog'],
          fullText: true
        },
        {
          name: 'title',
          exclude: ['duck']
        }
      ]);
    });
  });
});
