# AfpNews API

![Build Status](https://github.com/julesbonnard/afpnews-api/workflows/NodeJS/badge.svg?branch=master)

This project is aimed to help javascript developers use the AFP Core API.

It provides authentication, searching for documents function, and online news product.

## Getting Started

This package is available both for NodeJS and browsers. That's why two versions are available on the `./dist` directory.

### Prerequisites

You'll need an API key and credentials to retrieve all content from the API.

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
const afpNews = new AfpNews({ clientId, clientSecret })

// Get token changed
afpNews.on('tokenChanged', token => console.log(token))

// Search for latest documents
await afpNews.authenticate({ username, password })
const { documents } = await afpNews.search()

// Get a specific document
const document = await afpNews.get(uno)

// Look for similar documents
const { documents } = await afpNews.mlt(uno)

// Display the most used slugs
const { keywords } = await afpNews.list('slug')
```

### Query parser

The above request use default parameters stored in ./src/default-search-params.js

You can pass your own parameters to the search function, that will overide the defaults.

The query parameter can be used to look precisely for a field (`title:Macron`) and may include logical parameters (`Macron OR Merkel`, `Macron AND NOT Merkel`, `(title:Macron OR title:Merkel) AND country:fra`).

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
```

## Built With

* [Microbundle](https://www.npmjs.com/package/microbundle) - Building machine
* [TypeScript](https://www.typescriptlang.org/) - Typescript

## Authors

* [Jules Bonnard](https://github.com/julesbonnard) - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
