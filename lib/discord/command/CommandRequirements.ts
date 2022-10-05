import { PermissionsString } from "discord.js";

export interface CommandRequirements {
  ownerOnly: boolean;
  userPerms?: Array<PermissionsString>;
  clientPerms?: Array<PermissionsString>;
}
