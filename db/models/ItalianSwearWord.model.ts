import { Schema, model } from 'mongoose';

const ItalianSwearWordSchema = new Schema({
  term: {
    type: String,
    required: true
  }
});

export const ItalianSwearWord = model('italian_swearwords', ItalianSwearWordSchema);
