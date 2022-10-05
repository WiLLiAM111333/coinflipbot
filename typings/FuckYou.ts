import { Document } from "mongoose";

export type FuckYou <T extends {}> = Document<unknown, unknown, T> & T;
