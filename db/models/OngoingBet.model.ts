import { Schema, model } from 'mongoose';
import { IOngoingBet } from '../../lib/gamble/IOngoingBet';

const OngoingBetSchema = new Schema({
  guildID: {
    type: String,
    required: true
  },
  userID: {
    type: String,
    required: true
  },
  betsPlaced: {
    type: Array,
    required: true,
    default: []
  }
});

export const OngoingBet = model<IOngoingBet>('ongoing_bets', OngoingBetSchema);
