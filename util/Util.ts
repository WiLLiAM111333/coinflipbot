import { Document } from "mongoose";
import { IUser } from "../lib/user/IUser";
import { User } from "../db/models/User.model";
import { FuckYou } from "../typings/FuckYou";
import { Snowflake } from "discord.js";

export class Util {
  private constructor() {
    throw new ReferenceError('Cannot instantiate static class Utils');
  }

  public static async createUser(userData: IUser): Promise<Document<unknown, IUser, IUser>> {
    try {
      const newUser = new User({
        tag: userData.tag,
        id: userData.id,
        wins: 0,
        losses: 0,
        winRate: '0%'
      });

      await newUser.save();

      return newUser;
    } catch (err) {
      console.error(err);
    }
  }

  public static flipCoin(): 'heads' | 'tails' {
    const random = Math.floor(Math.random() * 2);
    return random ? 'heads' : 'tails';
  }

  public static getWinRatio({ wins, losses }: IUser): `${number}` | `${string}%` {
    if (wins === 0 && losses === 0) {
      return '0'
    } else if (wins === 1 && losses === 0) {
      return '100%'
    } else {
      return `${((wins * 100) / (wins + losses)).toFixed(2)}%`
    }
  }

  public static async handleWin(user: FuckYou<IUser>): Promise<void> {
    try {
      if(user) {
        user.wins = user.wins + 1;
        user.winRate = this.getWinRatio(user);

        await user.save();
      }
    } catch (err) {
      console.error(err);
    }
  }

  public static async handleLoss(user: FuckYou<IUser>): Promise<void> {
    try {
      if(user) {
        user.losses = user.losses + 1;
        user.winRate = this.getWinRatio(user);

        await user.save();
      }
    } catch (err) {
      console.error(err);
    }
  }

  public static getCombinedStringArrayLength(arr: Array<string>): number {
    return arr.reduce((totalLength, str): number => {
      if(typeof str !== 'string') {
        throw new TypeError(`Expected String, recieved: ${typeof str}`);
      }

      totalLength += str.length
      return totalLength;
    }, 0);
  }

  public static multipleUserMention(...users: Array<Snowflake>): string {
    let str = '';

    for(let i = 0; i < users.length; i++) {
      str += `<@${users[i]}>${i === users.length - 1 ? '' : ' '}`;
    }

    return str;
  }
}
