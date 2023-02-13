import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export interface BotCommand {
  data: SlashCommandBuilder;
  execute: (interaction: CommandInteraction) => Promise<string>;
}
