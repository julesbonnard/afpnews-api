# AfpNews API

This project is aimed to help javascript developers use the [AFP News API](https://api.afpforum.com/).

It provides authentication and search functions.

## Getting Started

This package is availabe both for NodeJS and browsers. That's why two versions are available on the `./dist` directory.

### Prerequisites

Read [the API documentation](https://api.afpforum.com/), and ask for an API Key and credentials.

### Installing

#### Node

`npm install --save afpnews-api` (Not published yet)

```js
const AfpNews = require('afpnews-api')
```

#### Browser

```html
<script src="./dist/afpnews.browser.js"></script>
```

### Let's start using it

```js
const afpNews = new AfpNews({ apiKey: 'YOUR_API_KEY' })

const credentials = {
  username: 'YOUR_USERNAME',
  password: 'YOUR_PASSWORD'
}

afpNews.authenticate(credentials)
  .then(token => {
    // You can eventually save the token to be used later
    // afpNews.token = token

    return afpNews.search()
  })
  .then(news => {
    console.log(news)
  })
  .catch(err => {
    console.error(err)
  })
```

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
