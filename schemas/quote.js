const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let quoteSchema = new Schema({
  type: {
    type: String, 
    required: true, 
    trim: true
  },
  title: { 
    type: String, 
    trim: true
  },
  summary: { 
    type: String, 
    required: true, 
    trim: true
  },
  url: { 
    type: String,
    trim: true
  },
  poster_url: { 
    type: String, 
    default: constant.DEFAULT_IMAGE,
    trim: true
  }
}, {
  timestamps: true
})

module.exports = quoteSchema