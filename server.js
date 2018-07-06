const path = require('path')
const express = require('express')
const app = express()

var fs = require('fs');
var env = require('./env.json');
var http;

if(env.ssl === false) {
  console.log('use http');
  http = require('http').createServer(app);
} else {  
  console.log('use https');
  var options = {
    key: fs.readFileSync(env.certs.key_path),
    cert: fs.readFileSync(env.certs.cert_path)
  };
  http = require('https').createServer(options, app);
}

var io = require('socket.io')(http);

const extend = require('util')._extend

require('console-stamp')(console, '[HH:MM:ss.l]')

const refererCheck = function (req, res, next) {
  if (req.get('Referer')) {
    next()
  } else {
    res.status(404).end()
  }
}

app.get('/comment/:comment', refererCheck, function (req, res) {
  const msg = extend({ body: req.param('comment') }, req.query)
  console.log('comment: ' + JSON.stringify(msg))
  io.emit('comment', msg)
  res.end()
})

app.get('/heart_beat', refererCheck, function (req, res) {
  const msg = extend({}, req.query)
  console.log('heart_beat: ' + JSON.stringify(msg))
  io.emit('heart_beat', msg)
  res.end()
})

app.get('/comment', refererCheck, function (req, res) {
  const msg = extend({}, req.query)
  console.log('comment: ' + JSON.stringify(msg))
  io.emit('comment', msg)
  res.end()
})

app.get('/like', refererCheck, function (req, res) {
  const msg = extend({}, req.query)
  console.log('like: ' + JSON.stringify(msg))
  io.emit('like', msg)
  res.end()
})

app.use(express.static(path.join(__dirname, 'public')))

io.on('connection', function (socket) {
  console.log('connected: ' + socket.request.connection.remoteAddress)

  socket.on('disconnect', function () {
    console.log('disconnected: ' + socket.request.connection.remoteAddress)
  })
})

http.listen(process.env.PORT || 2525)
