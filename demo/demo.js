var express = require('express')
var path = require('path')
var uuid = require('uuid')
var bodyParser = require('body-parser')
var session = require('express-session')
var _ = require('lodash')
var app = express()
var sess = {
  genid: function(req) {
    var id = uuid.v4()
    console.log('new session id', id);
    return id
  },
  secret: 'demo',
  cookie: {},
  resave: false,
  saveUninitialized: true
}

function getSession(req) {
  var ses= req.session;
  if ( ses.cart === undefined ) {
    ses.cart = {
      items: [],
      totals: {
        subTotal: 0,
        shipping: 0,
        grandTotal: 0
      }
    }
  }

  return ses
}

app.use(bodyParser.json());
app.use(session(sess))
app.use('/dist', express.static(path.normalize(path.join(__dirname, '..', 'dist'))))
app.use('/', express.static('public', { index: 'index.html'}))
app.get('/awc', function(req, res, next) {
  var ses = getSession(req)
  res.send({ data: ses.cart, success: true})
  next()
})
app.post('/awc', function(req, res, next) {
  var ses = getSession(req)
  console.log(req.body)

  if ( req.body.action == 'addToCart' ) {
		var items = []
		if ( !Array.isArray(req.body.data) ) {
			items.push(req.body.data);
		} else {
			items = req.body.data;
		}

		_.each(items, (item) => {
			ses.cart.items.push(item)
		})
    res.send({ 'success': true })
  } else if ( req.body.action == 'removeFromCart' ) {
    _.remove(ses.cart.items, (item) => {
      return item.id == req.body.data;
    })
    res.send({ 'success': true })
  } else {
    res.send({success: false, message: 'unknown command', body: req.body})
  }

  next()
})
app.listen(8080)
