/**
 * Module dependencies.
 */
var passport = require('passport-strategy')
  , util = require('util')
  , lookup = require('./utils').lookup;

function Strategy(options, verify) {
  if (typeof options == 'function') {
    verify = options;
    options = {};
  }
  if (!verify) { throw new TypeError('LocalStrategy requires a verify callback'); }
  
  this._phoneField = options.phoneField || 'phone';
  this._codeField = options.codeField || 'code';
  
  passport.Strategy.call(this);
  this.name = 'code';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request based on the contents of a form submission.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
  options = options || {};
  var phone = lookup(req.body, this._phoneField) || lookup(req.query, this._phoneField);
  var code = lookup(req.body, this._codeField) || lookup(req.query, this._codeField);
  
  if (!phone || !code) {
    return this.fail({ message: options.badRequestMessage || 'Missing credentials' }, 400);
  }
  
  var self = this;
  
  function verified(err, user, info) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(info); }
    self.success(user, info);
  }
  
  try {
    if (self._passReqToCallback) {
      this._verify(req, phone, code, verified);
    } else {
      this._verify(phone, code, verified);
    }
  } catch (ex) {
    return self.error(ex);
  }
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;