var express = require('express')
var path = require('path')
var app = express()

app.use('/dist', express.static(path.normalize(path.join(__dirname, '..', 'dist'))))
app.use('/', express.static('public', { index: 'index.html'}))
app.listen(8080)
