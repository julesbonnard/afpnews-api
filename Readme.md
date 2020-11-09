# AfpNews API

[![Build Status](https://travis-ci.org/julesbonnard/afpnews-api.svg?branch=master)](https://travis-ci.org/julesbonnard/afpnews-api) [![Greenkeeper badge](https://badges.greenkeeper.io/julesbonnard/afpnews-api.svg)](https://greenkeeper.io/)

This project is aimed to help javascript developers use the [AFP News API](https://api.afp.com/).

It provides authentication, searching for documents function, and online news product.

## Getting Started

This package is available both for NodeJS and browsers. That's why two versions are available on the `./dist` directory.

### Prerequisites

Read [the API documentation](https://api.afp.com/), and [ask for an API Key and credentials](https://developers.afp.com).

### Installing

#### Node

`npm install --save afpnews-api`

```js
const AfpNews = require('afpnews-api')
// OR using import
import AfpNews from 'afpnews-api'
```

#### Browser

```html
<script src="./dist/afpnews-api.umd.js"></script>
```

### Let's start using it

```js
// Initialize the API
const afpNews = new AfpNews({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  saveToken: token => {
    // You can eventually save the token to be used later
    console.log(token)
  }
})

// Search for latest documents
afpNews
  .authenticate({
    username: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD'
  })
  .then(() => afpNews.search())
  .then(({ documents }) => {
    console.log(documents)
  })

// Get a specific document
afpNews
  .get('A_SPECIFIC_UNO')
  .then(document => {
    console.log(document)
  })

// Look for similar documents
afpNews
  .mlt('A_SPECIFIC_UNO')
  .then(({ documents }) => {
    console.log(documents)
  })

// Display the most used slugs
afpNews
  .list('slug')
  .then(({ keywords }) => {
    console.log(keywords)
  })

// Display the available topics for a specific language
afpNews
  .topics('fr')
  .then(({ topics }) => {
    console.log(topics)
  })

// Display the editor's choice for a specific topic
afpNews
  .topicIndex('Sport', 'fr')
  .then(({ documents }) => {
    console.log(documents)
  })
```

### Query parser

The above request use default parameters stored in ./src/default-search-params.js

You can pass your own parameters to the search function, that will overide the defaults : 

```js
afpNews.search({
  products: ['news'],
  langs: ['fr'],
  urgencies: [1, 2, 3, 4],
  query: 'french politics',
  size: 10,
  dateFrom: '2012-01-01',
  dateTo: 'now',
  sortField: 'published',
  sortOrder: 'desc'
})
```

The query parameter can be used to look precisely for a field (`title:Macron`) and may include logical parameters (`Macron OR Merkel`, `Macron AND NOT Merkel`, `title:(Macron OR Merkel) AND country:fra`).

## Development

Clone the repository, then `npm install`

Build and minify your work for browsers and node with `npm run build`

## Running the tests

Just `npm test` to execute all tests in `./tests`

You will need some environment variables in a .env file : 

```
AFPNEWS_BASE_URL=
AFPNEWS_API_KEY=
AFPNEWS_CLIENT_ID=
AFPNEWS_CLIENT_SECRET=
AFPNEWS_USERNAME=
AFPNEWS_PASSWORD=
AFPNEWS_CUSTOM_AUTH_URL=https://
```

## Built With

* [Microbundle](https://www.npmjs.com/package/microbundle) - Building machine
* [TypeScript](https://www.typescriptlang.org/) - Typescript

## Authors

* [Jules Bonnard](https://github.com/julesbonnard) - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
