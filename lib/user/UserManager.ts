import { User } from "../../db/models/User.model";
import { IUser } from "./IUser";
import { Constants } from "../../util/Constants";
import { Snowflake } from "discord.js";

const { DEFAULT_USER } = Constants;

export class UserManager {
  public constructor() {};

  public async get(id: Snowflake) {
    try {
      return await User.find({ id });
    } catch (err) {
      throw err;
    }
  }

  public async getOne(id: Snowflake) {
    try {
      return await User.findOne({ id });
    } catch (err) {
      throw err;
    }
  }

  public async getOrCreate({ id, tag }: Optional<IUser>) {
    try {
      return await User.findOne({ id }) ?? await this.create({ id, tag });
    } catch (err) {
      throw err;
    }
  }

  public async create({ id, tag }: Optional<IUser>) {
    try {
      return await new User({ id, tag, ...DEFAULT_USER }).save();
    } catch (err) {
      throw err;
    }
  }
}
