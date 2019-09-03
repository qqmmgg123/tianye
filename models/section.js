let mongoose = require('mongoose')
let Section = require('../schemas/section')

Section.virtual('classic', {
  ref: 'Classic',
  localField: 'classic_id',
  foreignField: '_id'
})

module.exports = mongoose.model('Section', Section)