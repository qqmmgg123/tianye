let Schema = require('mongoose').Schema;

let FeatureVisitorSchema = new Schema({
  visitor_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    alias: 'visitor',
    required: true 
  },
  feature: String,
  visited_date: { 
    type: Date, 
    default: Date.now 
  }
})

FeatureVisitorSchema.index({ visitor_id: 1, feature: 1 }, { unique: true });
module.exports = FeatureVisitorSchema
