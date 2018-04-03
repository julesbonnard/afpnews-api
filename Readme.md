# AfpNews API

[![Build Status](https://travis-ci.org/julesbonnard/afpnews-api.svg?branch=master)](https://travis-ci.org/julesbonnard/afpnews-api)

This project is aimed to help javascript developers use the [AFP News API](https://api.afp.com/).

It provides authentication and search functions.

## Getting Started

This package is available both for NodeJS and browsers. That's why two versions are available on the `./dist` directory.

### Prerequisites

Read [the API documentation](https://api.afpforum.com/), and ask for an API Key and credentials.

### Installing

#### Node

`npm install --save afpnews-api`

```js
const AfpNews = require('afpnews-api')
```

#### Browser

```html
<script src="./dist/afpnews-api.js"></script>
```

### Let's start using it

```js
const afpNews = new AfpNews({ clientId: 'YOUR_CLIENT_ID', clientSecret: 'YOUR_CLIENT_SECRET' })

const credentials = {
  username: 'YOUR_USERNAME',
  password: 'YOUR_PASSWORD'
}

afpNews.authenticate(credentials)
  .then(token => {
    // You can eventually save the token to be used later

    return afpNews.search()
  })
  .then(news => {
    console.log(news)
  })
  .catch(err => {
    console.error(err)
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

The query parameter can be used to look precisely for a field (`title:Macron`) and may include logical parameters (`Macron OR Merkel`).

## Development

Clone the repository, then `npm install`

Source files are automatically compiled using Webpack with `npm run dev`

Build and minify your work for browsers and node with `npm run build`

## Running the tests

Just `npm test` to execute all tests in `./tests`

## Built With

* [Webpack](https://webpack.js.org/) - Building machine
* [Babel](https://babeljs.io/) - Javascript Transpiler
* [ESLint](https://eslint.org/) - JS Linter

## Authors

* [Jules Bonnard](https://github.com/julesbonnard) - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
