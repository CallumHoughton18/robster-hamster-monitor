import { BotCommand } from "./bot-command";
import { SlashCommandBuilder } from "discord.js";
import { isInFestiveSeason } from "../utils/helpers";

export const christmasCommand: BotCommand = {
  execute: async interaction => {
    if (!isInFestiveSeason(new Date())) {
      return "It's not christmas, you can't send that! (wait until the 24th of December)";
    }
    await interaction.channel?.send({
      content: "Merry Christmas @everyone ! Lots of love from Robster xo",
      files: [
        {
          attachment:
            "https://media.discordapp.net/attachments/908039290406191117/1056355691595575406/robster-christmas.jpg?width=942&height=1045",
          name: "robster-christmas!.jpg",
        },
      ],
    });
    return "Festive message sent!";
  },
  data: new SlashCommandBuilder()
    .setName("robster-christmas")
    .setDescription("Sends a robster christmas image with a message"),
};
