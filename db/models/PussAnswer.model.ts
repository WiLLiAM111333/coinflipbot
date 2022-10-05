import { Schema, model } from 'mongoose';

const PussAnswerSchema = new Schema({
  text: {
    type: String,
    required: true
  }
});

export const PussAnswer = model('puss_answer', PussAnswerSchema);
