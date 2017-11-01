"use strict";
/**
 * @module html
 */

 // htmlEncode/decode is based on lessons learned from angularjs
 var hiddenPre=document.createElement("pre");
 var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
   	NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g;

module.exports = {
	htmlEncode: function(value) {
		if ( value === undefined || value === null ) {
			value = "";
		}

		return value.
				replace(/&/g, '&amp;').
				replace(SURROGATE_PAIR_REGEXP, function(value) {
					var hi = value.charCodeAt(0);
					var low = value.charCodeAt(1);
					return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
				}).
				replace(NON_ALPHANUMERIC_REGEXP, function(value) {
					return '&#' + value.charCodeAt(0) + ';';
				}).
				replace(/</g, '&lt;').
				replace(/>/g, '&gt;');
	},
	htmlDecode: function(value) {
		if ( value === undefined || value === null ) {
			value = "";
		}

		value = value.replace(/</g,"&lt;");
		hiddenPre.innerHTML = value;
		var result = hiddenPre.textContent;
		return result;
	},

	queryEscape: function(value) {
		if (!value) { return []; }
		var result = value.replace(/#(\d)/, "#\\3$1 ");
		return result;
	},

	hasClass: function(el, cls) {
    return (` ${el.className} `).indexOf(` ${cls} `) > -1
  },

  addClass: function(el, cls) {
		el.classList.add(cls);
  },

	removeClass: function(el, cls) {
		el.classList.remove(cls);
	},

  hasAttr: function(el, attr) {
    return el.hasAttribute(attr)
  },

  getAttr: function(el, attr) {
    return module.exports.htmlDecode(el.getAttribute(attr));
  },

  setAttr: function(el, attr, value) {
    el.setAttribute(attr, value);
  },

	queryAll: function(query, context) {
		if ( context === undefined ) {
			context = document;
		}

		return context.querySelectorAll(module.exports.queryEscape(query));
	},

	queryFirst: function(query, context) {
		var result = module.exports.queryAll(query, context);
		if ( result.length > 0 ) {
			return result[0];
		}

		return false;
	}
}
