# AfpNews API

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
const ApiCore = require('afpnews-api')
// OR using import
import ApiCore from 'afpnews-api'
```

#### Browser

```html
<script src="./dist/bundles/apicore.umd.min.js"></script>
```

### Let's start using it

```js
// Initialize the API
const apicore = new ApiCore({ clientId, clientSecret })

// Authenticate
await apicore.authenticate({ username, password })

// Get token changed
apicore.on('tokenChanged', token => console.log(token))

// Search for latest documents
const { documents } = await apicore.search()

// Or using a generator to crawl multiple pages
for await (const doc of apicore.searchAll()) {
  console.log(doc)
}

// Get a specific document
const document = await apicore.get(uno)

// Look for similar documents
const { documents } = await apicore.mlt(uno)

// Display the most used slugs
const { keywords } = await apicore.list('slug')
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

* [TypeScript](https://www.typescriptlang.org/) - Typescript

## Authors

* [Jules Bonnard](https://github.com/julesbonnard) - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
