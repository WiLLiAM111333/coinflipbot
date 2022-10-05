import { CommandHelp         } from "./CommandHelp";
import { CommandOptions      } from "./CommandOptions";
import { CommandRequirements } from "./CommandRequirements";

export interface ICommand {
  requirements: CommandRequirements;
  help: CommandHelp; 
  options: CommandOptions;
}
