import { Schema, model } from 'mongoose';
import { IUser } from '../../lib/user/IUser';

const UserSchema = new Schema<IUser>({
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
    required: false,
    default: 0
  },
  losses: {
    type: Number,
    required: true,
    default: 0
  },
  winRate: {
    type: String,
    required: true,
    default: '0%'
  },
  personalRole: {
    type: String,
    required: false
  }
});

export const User = model<IUser>('users', UserSchema);
