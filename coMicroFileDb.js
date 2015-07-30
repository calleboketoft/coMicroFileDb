var fs = require('fs')
var q = require('q')
var findit = require('findit')
var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')

// App configuration
var specFile
var docsRootDir
var app
var rootRoute

var CONST = {
  SPEC_FILE: 'recipe.json',
  FILE_TYPES: {
    '.jpg': 'image',
    '.png': 'image',
    '.jpeg': 'image',
    '.md': 'markdown',
    '.pdf': 'pdf',
    '.json': 'json'
  }
}

module.exports = function(options) {
  app = options.app
  app.use(bodyParser())
  docsRootDir = options.docsRootDir || '../'
  specFile = options.specFile || CONST.SPEC_FILE
  rootRoute = options.rootRoute || '/myfiles'

  var docs = express.Router()
  docs.get('/', getDocs) // Get all docs
  docs.post('/', postDoc) // Save one doc
  app.use(rootRoute, docs)
}

function fileFormatter (file, data, isSpecFile) {
  var dirSplit = file.split(path.sep)
  var fileInfo = {
    dirname: dirSplit[dirSplit.length-2],
    filepath: file,
    filerelpath: file.slice(docsRootDir.length + 1),
    extname: path.extname(file),
    typeoffile: CONST.FILE_TYPES[path.extname(file)]
  }
  if (data) {
    fileInfo.content = data
  }
  if (isSpecFile) {
    fileInfo.specFile = true
  }
  return fileInfo
}

function getDocs (req, res) {
  getFilesFromDocsRoot({
    specFile: specFile,
    extnames: CONST.FILE_TYPES
  }).then(function(files) {
    res.json(files)
  })
}

// options: {
//   specFile: '',
//   filetypes: [{'.jpg': 'image'}] 
// }
function getFilesFromDocsRoot (options) {
  var dfd = q.defer()
  var finder = findit(docsRootDir)
  var files = []
  var deferreds = []

  finder.on('directory', function (dir, stat, stop) {
    var base = path.basename(dir)
    if (base === '.git' || base === 'node_modules' || base === 'jspm_packages') stop()
  })

  finder.on('file', function (file, stat) {
    var currFileName = path.basename(file)
    var currFileExt = path.extname(file)

    function matcher () {
      var itsAMatch = options.specFile === currFileName
      if (!itsAMatch && options.extnames) {
        Object.keys(options.extnames).forEach(function(extname) {
          if (currFileExt === extname.toLowerCase()) {
            itsAMatch = true
          }
        })
      }
      return itsAMatch
    }

    if (matcher()) {
      var deferFileRead = q.defer()
      deferreds.push(deferFileRead.promise)

      var isSpecFile = currFileName === options.specFile

      // Read the contents of the specFile
      if (isSpecFile) {
        fs.readFile(file, 'utf8', function (err, data) {
          if (err) { throw err }
          files.push(fileFormatter(file, data, isSpecFile))
          deferFileRead.resolve()
        })
      } else {
        // It's one of the other files, just push the file info
        files.push(fileFormatter(file))
        deferFileRead.resolve()
      }
    }
  })

  finder.on('end', function () {
    q.all(deferreds).done(function () {
      dfd.resolve(files)
    })
  })
  return dfd.promise
}

function postDoc (req, res, next) {
  var newDocContent = req.body.content

  fs.writeFile(req.body.filepath, newDocContent, function (err) {
    if (err) { throw err }
    res.json(req.body)
  })
}
