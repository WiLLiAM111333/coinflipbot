const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  tag: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  wins: {
    type: Number,
    required: true
  },
  losses: {
    type: Number,
    required: true
  },
  winRate: {
    type: String,
    required: true
  }
});

exports.User = model('users', UserSchema);
