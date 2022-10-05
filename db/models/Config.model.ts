import { Schema, model } from 'mongoose';

const ConfigSchema = new Schema({
  guildID: {
    type: String,
    required: true
  },
  logChannel: {
    type: String,
    required: false
  },
  adminRole: {
    type: String,
    required: false
  },
  wardenRole: {
    type: String,
    required: false
  },
  gulagRole: {
    type: String,
    required: false
  },
  gulagChannel: {
    type: String,
    required: false
  },
  ignoredPersonalRoles: {
    type: Array,
    required: false,
    default: []
  }
});

export const Config = model('config', ConfigSchema);
