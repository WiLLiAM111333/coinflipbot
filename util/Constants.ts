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
    winRate: '0'
  }
}
