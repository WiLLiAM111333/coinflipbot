import { Schema, model } from 'mongoose';

const ModerationLoggerConfigSchema = new Schema({
  guildID: {
    type: String,
    required: true
  },
  logChannelID: {
    type: String,
    required: true
  }
});

export const ModerationLoggerConfig = model('moderation_logger_cfg', ModerationLoggerConfigSchema);
