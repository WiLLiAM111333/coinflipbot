import { Schema, model } from 'mongoose';

const ThemeSongSchema = new Schema({
  guildID: {
    type: String,
    required: true
  },
  userID: {
    type: String,
    required: true
  },
  song: {
    type: String,
    required: true
  }
});

export const ThemeSong = model('theme-songs', ThemeSongSchema);
