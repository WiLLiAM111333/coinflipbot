import { Snowflake } from "discord.js";
import { OngoingBet } from "../../db/models/OngoingBet.model";
import { UserManager } from "../user/UserManager";
import { ISessionOutput } from "./ISessionOutput";
import { PlaceBetErrors } from "./PlaceBetErrors";

export class GambleManager {
  private userManager: UserManager;

  public constructor() {
    this.userManager = new UserManager();
  };

  public async getUsersCurrency(userID: Snowflake): Promise<number> {
    try {
      return (await this.userManager.getOne(userID)).currency;
    } catch (err) {
      console.error(err);
    }
  }

  public async hasBetSession(userID: Snowflake): Promise<boolean> {
    return !!(await this.getBetSession(userID));
  }

  public async parseBet(userID: Snowflake, bet: string): Promise<number> {
    if(/\d+/.test(bet)) {
      const betAmount = parseInt(bet, 10);
      return betAmount;
    }

    if(bet === 'allin') {
      const betAmount = await this.getUsersCurrency(userID);
      return betAmount;
    }

    return 0;
  }

  public async getBetSession(userID: Snowflake) {
    try {
      return await OngoingBet.findOne({ userID });
    } catch (err) {
      console.error(err);
    }
  }

  public async placeBet(hostUserID: Snowflake, userID: Snowflake, side: GambleSideString, amount: number): Promise<void> {
    if(hostUserID === userID) {
      throw ({ code: PlaceBetErrors.SELF_BET });
    }

    const session = await this.getBetSession(hostUserID);

    for(let i = 0; i < session.betsPlaced.length; i++) {
      if(session.betsPlaced[i].userID === userID) {
        const oldBet = session.betsPlaced[i];

        session.betsPlaced[i] = { userID, side, amount };
        await session.save();

        throw ({ code: PlaceBetErrors.DOUBLE_BET, data: { oldBet, newBet: { side, amount } } });
      }
    }

    session.betsPlaced.push({ userID, side, amount });
    await session.save();
  }

  public async concludeSession(userID: Snowflake, winningSide: GambleSideString): Promise<ISessionOutput> {
    const session = await this.getBetSession(userID);

    const output: ISessionOutput = {
      hostUserID: session.userID,
      winners: [],
      losers: []
    }

    for(const placedBet of session.betsPlaced) {
      const user = await this.userManager.getOne(placedBet.userID);

      if(placedBet.side === winningSide) {
        output.winners.push({
          userID: user.id,
          amount: placedBet.amount
        });
      } else {
        output.losers.push({
          userID: user.id,
          amount: placedBet.amount
        });
      }
    }

    return output;
  }

  public async handlePostConcludeCommandSuccess(sessionOutput: ISessionOutput): Promise<void> {
    const { winners, losers } = sessionOutput;

    await OngoingBet.deleteOne({ userID: sessionOutput.hostUserID });

    for(const { userID, amount } of winners) {
      const user = await this.userManager.getOne(userID);
      user.currency += amount;

      await user.save();
    }

    for(const { userID, amount } of losers) {
      const user = await this.userManager.getOne(userID);
      user.currency -= amount;

      await user.save();
    }
  }
}
