const {htmlEncode, htmlDecode} = require('./html');
const EventEmitter = require('eventemitter2').EventEmitter2;
const utils = require('./utils')
const Handlebars = require('handlebars')
const Promise = require('BlueBird')

/**
 * Handlebars wrapper to add custom features to our templates
 */
class Template extends EventEmitter {

	constructor(tpl, cart) {
		super();

		this._cart = cart;
		this._waitFor = [];
		this.resource = tpl;
	}

	promiseReady() {
		return new Promise((resolve, reject) => {
			this.resource.then(() => {
				resolve(this);
				return true;
			})
			.catch((err) => {
				reject(err);
				return false;
			})
		})
	}

	updateWaitFor(prm) {
		this._waitFor.push(prm)
	}

	beginRender(context) {
		var tpl = this.resource.value();
		this.emit('tpl-start-render');

		return tpl(Object.assign({
			$cart: this._cart,
			$parent: this,
			$tpl: this
		},context))
	}

	endRender() {
		if ( this._waitFor.length > 0 ) {
			return Promise.join.apply(Promise, this._waitFor)
				.then(() => {
					this._waitFor = [] // reset wait list
					this.emit('tpl-end-render');
					this.emit('tpl-ready')
					return true;
				})
		}

		return new Promise((resolve, reject) => {
			this.emit('tpl-end-render');
			this.emit('tpl-ready')
			resolve(true);
		});

	}

	delayedTpl(id, tpl_name, obj) {
		var cart = this._cart;
		var t = this._cart.template(tpl_name);
		var tpl_promise = t
			.promiseReady()
			.then((tpl) => {
				var html = tpl.beginRender(obj)
				var container = document.getElementById(id)
				if ( container ) {
					container.innerHTML = html
					container.className = "awc-placeholder loaded"

					return tpl.endRender().then((r) => {
						cart.updateUI();
						return r;
					});
				} else {
					return false;
				}
			})

			obj.$parent.updateWaitFor(tpl_promise)
	}

	isFulfilledPassthrough(data) {
		var base = this;
		return (result) => {
			if ( base.resource.isFulfilled() ) {
				// if template is ready just pass along results
				if ( data ) {
					return data;
				}

				return result;
			} else {
				// wait for template to load
				return new Promise((resolve, reject) => {
					base.resource
						.then(() => {
							if ( data ) {
								resolve(data);
							} else {
								resolve(result)
							}
						})
						.catch((err) => { reject(err) })
				})
			}
		}
	}
}

Handlebars.registerHelper("sub", function() {
	let result = arguments[0];
	for (var i = 1; i < arguments.length - 1; i++) {
		result -= arguments[i];
	}

	return result;
})

Handlebars.registerHelper("add", function () {
	let result = arguments[0];
	for (var i = 1; i < arguments.length - 1; i++) {
		result += arguments[i];
	}

	return result;
})

Handlebars.registerHelper("mul", function () {
	let result = arguments[0];
	for (var i = 1; i < arguments.length - 1; i++) {
		result *= arguments[i];
	}

	return result;
})

Handlebars.registerHelper("div", function () {
	let result = arguments[0];
	for (var i = 1; i < arguments.length - 1; i++) {
		result /= arguments[i];
	}

	return result;
})

Handlebars.registerHelper("mod", function (left, right, scope) {
	return left % right;
})

Handlebars.registerHelper("difPercentOf", function (left, right, scope) {
	// ex: (difPercentOf 10 100) = 90%
	return ((right - left) * 100) / right;
})

Handlebars.registerHelper("percentOf", function (left, right, scope) {
	// ex: (percentOf 10 100) = 10%
	return (left * 100) / right;
})

Handlebars.registerHelper("toFixed", function (number, decimals, scope) {
	return number.toFixed(decimals);
})

Handlebars.registerHelper("not", function(value, scope) {
	return value?false:true;
})

Handlebars.registerHelper("eq", function(left, right, scope) {
	return left == right;
})

Handlebars.registerHelper("ne", function(left, right, scope) {
	return left != right;
})

Handlebars.registerHelper("gt", function(left, right, scope) {
	return left > right;
})

Handlebars.registerHelper("lt", function(left, right, scope) {
	return left < right;
})

Handlebars.registerHelper("ge", function(left, right, scope) {
	return left >= right;
})

Handlebars.registerHelper("le", function(left, right, scope) {
	return left <= right;
})

Handlebars.registerHelper("or", function(left, right, scope) {
	for (var i = 0; i < arguments.length - 1; i++) {

		if ( typeof arguments[i] != "function" && arguments[i] ) {
			return arguments[i];
		}
	}
	return false;
})

Handlebars.registerHelper("and", function(left, right, scope) {
	return left && right;
})

Handlebars.registerHelper("template", function(tpl_name, obj, scope) {
	var id = awc.uuid()
	obj.$cart = scope.data.root.$cart;
	obj.$parent = scope.data.root.$parent;
	obj.$tpl = scope.data.root.$tpl;
	obj.$tpl.delayedTpl(id, tpl_name, obj)
	return '<div id="'+id+'" class="awc-placeholder loading"></div>';
})

Handlebars.registerHelper("json", function(value, scope) {
	return JSON.stringify(value)
})

Handlebars.registerHelper('escape', function(value, scope) {
	if ( value ) {
		return value.replace(/(['"])/g, '\\$1');
	}

	return "";
})

Handlebars.registerHelper('htmlEncode', function(value, scope) {
	return htmlEncode(value);
})

Handlebars.registerHelper('htmlDecode', function(value, scope) {
	return htmlDecode(value);
})

Handlebars.registerHelper('cssEscape', function(value, scope) {
	if ( value ) {
		return value.replace(/[^a-z0-9\-]/gi, '_')
	}

	return "";
})

Handlebars.registerHelper('eachEven', function(arr, scope) {
	if ( arr && arr.length > 0 ) {
		var buffer = "";
		for(var i = 0; i < arr.length; i++) {
			var item = arr[i]
			item.$index = i
			item.$is_first = i==0?1:0;
			item.$is_even = (i % 2) == 0
			buffer += scope.fn(item)
		}
		return buffer;
	} else {
		return scope.inverse(this)
	}
})

Handlebars.registerHelper('is_even', function(value, scope) {
	if ( (value % 2) == 0 ) {
		return scope.fn(this)
	} else {
		return scope.inverse(this);
	}
})

Handlebars.registerHelper('is_odd', function(value, scope) {
	if ( (value % 2) == 1 ) {
		return scope.fn(this)
	} else {
		return scope.inverse(this);
	}
})

Handlebars.registerHelper('currency', function(value, scope) {

	var context = scope.data.root;

	if ( context.$cart === undefined ) {
		debug.error('Contexts: ', context, this)
		throw new Error('Cart not found in current context.')
	}
	if ( value === undefined ) {
		return '';
	}

	return context.$cart.storeAdapter.formatCurrency(value)
})

Handlebars.registerHelper("jsinclude", function(src, scope) {
	utils.require(src);
	return '';
})

module.exports = {
	Handlebars: Handlebars,
	Template: Template
}
