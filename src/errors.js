module.exports = {
	customError: function(name, initFn) {
		var errCls = function() {

			if ( "captureStackTrace" in Error) {
				Error.captureStackTrace(this, errCls);
			} else {
				this.stack = (new Error()).stack;
			}

			initFn.apply(this, arguments);
		}

		errCls.prototype = Object.create(Error.prototype);
		errCls.prototype.name = name;
		errCls.prototype.constructor = errCls;

		return errCls;
	}
}
