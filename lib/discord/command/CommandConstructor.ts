import { CommandHelp } from "./CommandHelp";
import { CommandOptions } from "./CommandOptions";
import { CommandRequirements } from "./CommandRequirements";

export interface CommandConstructor extends Optional<CommandHelp>, Optional<CommandRequirements>, Optional<CommandOptions> {};
