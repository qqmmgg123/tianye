let Schema = require('mongoose').Schema;

let ownerTroubleSchema = new Schema({
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', alias: 'owner' },
  trouble_id: { type: Schema.Types.ObjectId, ref: 'Trouble', alias: 'trouble' },
  owned_date: { type: Date, default: Date.now },
})

module.exports = ownerTroubleSchema