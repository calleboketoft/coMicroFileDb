# coMicroFileDb

```javascript
var coMicroFileDb = require('coMicroFileDb')({
  app: app, // express app
  docsRootDir: path.resolve(__dirname, ''),
  relevantFileName: 'README.md',
  rootRoute: '/myfiles'
})
```

Start the example in `example` and make a GET request to `localhost:3000/myfiles` to get the files.

To save one document, make a POST request with the body of one file to `localhost:3000/myfiles`