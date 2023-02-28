import { IUser } from "../lib/user/IUser";

const { join } = require('path');

export namespace Constants {
  const assetsRoot = join(__dirname, '..', '..', 'assets');

  export const COINFLIP_IMAGES = {
    tails: join(assetsRoot, 'tails.png'),
    heads: join(assetsRoot, 'heads.png')
  }

  export const GULAG_IMAGES = {
    gulag: join(assetsRoot, 'gulag', 'offToGulag.gif'),
    captured: join(assetsRoot, 'gulag', 'captured.gif'),
    free: join(assetsRoot, 'gulag', 'free.gif')
  }

  export enum EmbedColors {
    RED = '#ff0000',
    GREEN = '#00d111'
  }

  export const DEFAULT_USER: Omit<IUser, 'id' | 'personalRole' | 'tag'> = {
    losses: 0,
    wins: 0,
    winRate: '0',
    currency: 0
  }

  export const PLANNING_REMINDER_INTERVAL = [3, 7];
  export const HOUR_INTERVAL = [1, 24];
  export const MINUTES_INTERVAL = [0, 59];

  export const TWELVE_HOUR_TIME_REGEX = /[1-9]?[0-2]?(:[0-5][0-9])?(am|pm)/;
  export const TIME_STR_MINUTES_REGEX = /:[0-5][0-9]/;
  export const TWENTYFOUR_HOUR_TIME_REGEX = /((2[0-3])|[0-1][0-9]):[0-5][0-9]/;
}
