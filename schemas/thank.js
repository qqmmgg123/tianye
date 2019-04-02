let Schema = require('mongoose').Schema;
const constant = require('../settings/const')

let thankSchema = new Schema({
  type_id: {
    type: String,
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  giver_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    alias: 'giver',
    required: true 
  },
  winner_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    alias: 'winner', 
    required: true 
  },
  basis_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Mind', 
    alias: 'basis', 
    required: true 
  },
  given_date: { type: Date, default: Date.now }
})

module.exports = thankSchema
