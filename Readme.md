# AfpNews API

[![Build Status](https://travis-ci.org/julesbonnard/afpnews-api.svg?branch=master)](https://travis-ci.org/julesbonnard/afpnews-api) [![Greenkeeper badge](https://badges.greenkeeper.io/julesbonnard/afpnews-api.svg)](https://greenkeeper.io/)

This project is aimed to help javascript developers use the [AFP News API](https://api.afp.com/).

It provides authentication, search and get functions.

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
<script module="./dist/afpnews-api.es.js"></script>
<script nomodule src="./dist/afpnews-api.umd.js"></script>
```

### Let's start using it

```js
const afpNews = new AfpNews({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  saveToken: token => {
    // You can eventually save the token to be used later
    console.log(token)
  }
})

afpNews
  .authenticate({
    username: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD'
  })
  .then(() => afpNews.search())
  .then(news => {
    console.log(news)
  })

afpNews
  .get('A_SPECIFIC_UNO')
  .then(({ document }) => {
    console.log(document)
  })
```

### Query parser

The above request use default parameters stored in ./src/defaultParams.js

You can pass your own parameters to the search function, that will overide the defaults : 

```js
const params = {
  products: ['news'],
  langs: ['fr'],
  urgencies: [1, 2, 3, 4],
  query: 'french politics',
  size: 10,
  dateFrom: '2012-01-01',
  dateTo: 'now',
  sortField: 'published',
  sortOrder: 'desc'
}

afpNews.search(params)
  .then(news => {
    console.log(news)
  })
```

The query parameter can be used to look precisely for a field (`title:Macron`) and may include logical parameters (`Macron OR Merkel`, `Macron AND NOT Merkel`, `title:(Macron OR Merkel) AND country:fra`).

## Development

Clone the repository, then `npm install`

Build and minify your work for browsers and node with `npm run build`

## Running the tests

Just `npm test` to execute all tests in `./tests`

## Built With

* [Microbundle](https://www.npmjs.com/package/microbundle) - Building machine
* [TypeScript](https://www.typescriptlang.org/) - Typescript

## Authors

* [Jules Bonnard](https://github.com/julesbonnard) - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
