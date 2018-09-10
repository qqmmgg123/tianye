const crypto = require('crypto')
const semver = require('semver')

module.exports = {
  pbkdf2: function(password, salt) {
    return new Promise((resolve, reject) => {
      const pbkdf2DigestSupport = semver.gte(process.version, '0.12.0');
      const iterations         = 25000
      const keylen             = 512
      const digestAlgorithm    = 'sha256'

      if (pbkdf2DigestSupport) {
        crypto.pbkdf2(password, salt, iterations, keylen, digestAlgorithm, (err, hash) => {
          if (err) {
            reject(err)
          } else {
            resolve(hash)
          }
        })
      } else {
        crypto.pbkdf2(password, salt, iterations, keylen, (err, hash) => {
          if (err) {
            reject(err)
          } else {
            resolve(hash)
          }
        })
      }
    })
  }
}
