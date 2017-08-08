"use strict";

module.exports = {
	LEVEL: {
		NONE: 0,
		LOG: 1,
		INFO: 2,
		WARN: 3,
		ERROR: 4,
		DEBUG: 5
	},
	level: 0,
	group: function(label, fn) {
		var val = undefined;
		if ( console.group !== undefined ) {
			console.group(label);
			try {
				val = fn();
			} catch(ex) {
				module.exports.error(ex);
				console.groupEnd();
				throw ex;
			}
			console.groupEnd();
		} else {
			try{
				val = fn();
			} catch(ex) {
				module.exports.error(ex);
				console.groupEnd();
				throw ex;
			}
		}

		return val;
	},

	log: function() {
		if ( module.exports.level >= module.exports.LEVEL.LOG ) {
			if ( console.log !== undefined ) {
				console.log.apply(console, Array.from(arguments));
			}
		}
	},

	info: function() {
		if ( module.exports.level >= module.exports.LEVEL.INFO  ) {
			if ( console.log !== undefined ) {
				console.info.apply(console, Array.from(arguments));
			}
		}
	},

	error: function() {
		if ( module.exports.level >= module.exports.LEVEL.ERROR  ) {
			if ( console.error !== undefined ) {
				console.error.apply(console, Array.from(arguments));
			}
		}
	},

	warn: function() {
		if ( module.exports.level >= module.exports.LEVEL.WARN  ) {
			if ( console.warn !== undefined ) {
				console.warn.apply(console, Array.from(arguments));
			}
		}
	},

	debug: function() {
		if ( module.exports.level >= module.exports.LEVEL.DEBUG  ) {
			if ( console.debug !== undefined ) {
				console.debug.apply(console, Array.from(arguments));
			}
		}
	},

	table: function() {
		if ( module.exports.level >= module.exports.LEVEL.DEBUG  ) {
			if ( console.table !== undefined ) {
				console.table.apply(console, Array.from(arguments));
			}
		}
	}

};
