import { Client, Collection, Events, REST, Routes } from "discord.js";
import { Logger } from "robster-shared/src";
import { BotCommand } from "./bot-command";

const deployCommands = async (
  robsterCommands: Array<BotCommand>,
  token: string,
  clientId: string
) => {
  const rest = new REST({ version: "10" }).setToken(token);
  const commandsAsJSON = robsterCommands.map(x => x.data.toJSON());
  await rest.put(Routes.applicationCommands(clientId), {
    body: commandsAsJSON,
  });
};

export const registerAndDeployCommandsWithClient = (
  client: Client,
  commands: Array<BotCommand>,
  token: string,
  clientId: string,
  logger: Logger
) => {
  const robsterAppCommands = new Collection();
  commands.forEach(x => robsterAppCommands.set(x.data.name, x));

  client.commands = robsterAppCommands;
  deployCommands(commands, token, clientId);

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      const commandResponse = await command.execute(interaction);
      await interaction.reply({
        content: commandResponse,
        ephemeral: true,
      });
    } catch (error) {
      logger.error("cannot execute command", error as Error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });
};
