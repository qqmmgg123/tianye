let Schema = require('mongoose').Schema;
const constant = require('../settings/const')

let visitorSchema = new Schema({
  visitor_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    alias: 'visitor',
    required: true 
  },
  basis_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Mind', 
    alias: 'basis', 
    required: true 
  },
  visited_date: { type: Date, default: Date.now }
})

visitorSchema.index({ visitor_id: 1, basis_id: 1 }, { unique: true });
module.exports = visitorSchema
