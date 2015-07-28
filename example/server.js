var express = require('express')
var coMicroFileDb = require('../coMicroFileDb')
var app = express()
var path = require('path')
var http = require('http')

app.all('/*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

coMicroFileDb({
  app: app,
  docsRootDir: path.resolve(__dirname, 'somefiles'),
  relevantFileName: 'testfile.json',
  rootRoute: '/myfiles'
})

var httpPort = 3000
http.createServer(app).listen(httpPort)
console.log('http at port: ' + httpPort)